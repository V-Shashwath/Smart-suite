import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SmartSuiteFormScreen from '../components/SmartSuiteFormScreen';
import AccordionSection from '../components/AccordionSection';
import ItemTable from '../components/ItemTable';
import { branches, locations, employeeUsernames, productOptions } from '../data/mockData';
import { previewInvoicePDF, sharePDFViaWhatsApp, generateInvoicePDF } from '../utils/pdfUtils';
import useScreenDraft from '../hooks/useScreenDraft';
import withScreenPermission from '../components/withScreenPermission';

const EmployeeReturnScreen = () => {
  const [vSeries, setVSeries] = useState('VSeries');
  const [voucherSeries, setVoucherSeries] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [branch, setBranch] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('26-11-2025');
  const [employeeName, setEmployeeName] = useState('');

  const [itemBody, setItemBody] = useState([
    {
      sno: '1',
      code: '',
      product: '',
      issuedQty: '',
      saleQty: '',
      saleReturnQty: '',
      returnQty: '',
      productSeri: '',
    },
  ]);

  const handleAddItem = () => {
    setItemBody([...itemBody, {
      sno: String(itemBody.length + 1),
      code: '',
      product: '',
      issuedQty: '',
      saleQty: '',
      saleReturnQty: '',
      returnQty: '',
      productSeri: '',
    }]);
  };

  const handleDeleteItem = (index) => {
    const newItems = itemBody.filter((_, i) => i !== index);
    setItemBody(newItems.map((item, i) => ({ ...item, sno: String(i + 1) })));
  };

  const handleCellChange = (rowIndex, columnKey, value) => {
    const newItems = [...itemBody];
    newItems[rowIndex][columnKey] = value;
    setItemBody(newItems);
  };

  const itemColumns = [
    { key: 'sno', label: 'Sno', width: 60, editable: false },
    { key: 'code', label: 'Code', width: 100, type: 'dropdown', options: [] },
    { key: 'product', label: 'Product', width: 150, type: 'dropdown', options: productOptions },
    { key: 'issuedQty', label: 'IssuedQty', width: 100, keyboardType: 'numeric' },
    { key: 'saleQty', label: 'SaleQty', width: 100, keyboardType: 'numeric' },
    { key: 'saleReturnQty', label: 'SaleReturnQty', width: 120, keyboardType: 'numeric' },
    { key: 'returnQty', label: 'ReturnQty', width: 100, keyboardType: 'numeric' },
    { key: 'productSeri', label: 'ProductSeri', width: 120 },
  ];

  const totalReturnQty = itemBody.reduce(
    (sum, item) => sum + (parseFloat(item.returnQty) || 0),
    0
  );

  const summaryFields = [
    { label: 'Total Qty', value: String(totalReturnQty) },
  ];

  const getReturnData = useCallback(() => ({
    title: 'Employee Return',
    voucherDetails: { voucherSeries: vSeries, voucherNo: voucherNo, voucherDatetime: date },
    transactionDetails: { date, branch, location, employeeName },
    items: itemBody,
    summary: { totalQty: totalReturnQty },
  }), [vSeries, voucherNo, date, branch, location, employeeName, itemBody, totalReturnQty]);

  const { handleSave, isSaving } = useScreenDraft('EmployeeReturn', getReturnData, {
    successMessage: 'Employee return draft saved.',
  });

  const handlePreviewInvoice = async () => {
    if (itemBody.length === 0 || !itemBody[0].product) {
      Alert.alert('No Items', 'Please add at least one item to preview the return.', [{ text: 'OK' }]);
      return;
    }
    try {
      const data = getReturnData();
      await previewInvoicePDF({
        title: data.title,
        voucherDetails: data.voucherDetails,
        transactionDetails: {
          date: data.transactionDetails.date,
          branch: data.transactionDetails.branch,
          username: data.transactionDetails.employeeName || employeeName,
        },
        items: data.items.map(item => ({
          productName: item.product,
          quantity: item.returnQty || 0,
          rate: 0,
          net: 0,
        })),
        summary: data.summary,
      });
    } catch (error) {
      console.error('Error previewing return:', error);
    }
  };

  const handleSendWhatsApp = async () => {
    if (itemBody.length === 0 || !itemBody[0].product) {
      Alert.alert('No Items', 'Please add at least one item before sending the return.', [{ text: 'OK' }]);
      return;
    }
    try {
      const data = getReturnData();
      const { uri } = await generateInvoicePDF({
        title: data.title,
        voucherDetails: data.voucherDetails,
        transactionDetails: {
          date: data.transactionDetails.date,
          branch: data.transactionDetails.branch,
          username: data.transactionDetails.employeeName || employeeName,
        },
        items: data.items.map(item => ({
          productName: item.product,
          quantity: item.returnQty || 0,
          rate: 0,
          net: 0,
        })),
        summary: data.summary,
      });
      await sharePDFViaWhatsApp(uri);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    }
  };

  return (
    <SmartSuiteFormScreen
      title="Employee Return"
      summaryFields={summaryFields}
      onPreview={handlePreviewInvoice}
      onWhatsApp={handleSendWhatsApp}
      actionBarActions={{ onSave: handleSave }}
      isSaving={isSaving}
    >
      <AccordionSection title="VOUCHER" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>VSeries</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={vSeries}
                onValueChange={setVSeries}
                style={styles.picker}
              >
                <Picker.Item label="VSeries" value="VSeries" />
              </Picker>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>VoucherSeries</Text>
            <TextInput
              style={styles.input}
              value={voucherSeries}
              onChangeText={setVoucherSeries}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>VoucherNo</Text>
            <TextInput
              style={styles.input}
              value={voucherNo}
              onChangeText={setVoucherNo}
            />
          </View>
        </View>
      </AccordionSection>

      <AccordionSection title="TRANSACTION DETAILS" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Branch</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={branch}
                onValueChange={setBranch}
                style={styles.picker}
              >
                <Picker.Item label="Branch" value="" />
                {branches.map((b, idx) => (
                  <Picker.Item key={idx} label={b} value={b} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={location}
                onValueChange={setLocation}
                style={styles.picker}
              >
                <Picker.Item label="Location" value="" />
                {locations.map((l, idx) => (
                  <Picker.Item key={idx} label={l} value={l} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </AccordionSection>

      <AccordionSection title="HEADER" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Employee Name</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={employeeName}
                onValueChange={setEmployeeName}
                style={styles.picker}
              >
                <Picker.Item label="Select Employee" value="" />
                {employeeUsernames.map((e, idx) => (
                  <Picker.Item key={idx} label={e} value={e} />
                ))}
              </Picker>
            </View>
          </View>
          <TouchableOpacity style={styles.getDetailButton}>
            <Text style={styles.getDetailButtonText}>GetDetail</Text>
          </TouchableOpacity>
        </View>
      </AccordionSection>

      <AccordionSection title="ITEM BODY" defaultExpanded={true}>
        <ItemTable
          columns={itemColumns}
          data={itemBody}
          onAddRow={handleAddItem}
          onDeleteRow={handleDeleteItem}
          onCellChange={handleCellChange}
        />
      </AccordionSection>

      <AccordionSection title="REFERENCE" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Party Doc</Text>
            <TextInput style={styles.input} />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Party Ref Date</Text>
            <TextInput style={styles.input} value="26-11-2025" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Ref VoucherNo</Text>
            <TextInput style={styles.input} />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Ref VoucherSeries</Text>
            <TextInput style={styles.input} />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Account</Text>
            <View style={styles.pickerContainer}>
              <Picker style={styles.picker}>
                <Picker.Item label="Account" value="" />
              </Picker>
            </View>
          </View>
        </View>
      </AccordionSection>

      <AccordionSection title="OTHER INFO" defaultExpanded={true}>
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Other Info1</Text>
          <TextInput style={styles.input} />
        </View>
      </AccordionSection>

    </SmartSuiteFormScreen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  fieldContainer: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 12,
  },
  fullWidthField: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  picker: {
    height: 45,
  },
  getDetailButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  getDetailButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default withScreenPermission('EmployeeReturn')(EmployeeReturnScreen);


