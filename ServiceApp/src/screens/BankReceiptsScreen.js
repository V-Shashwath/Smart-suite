import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SmartSuiteFormScreen from '../components/SmartSuiteFormScreen';
import AccordionSection from '../components/AccordionSection';
import ItemTable from '../components/ItemTable';
import { branches, locations, employeeUsernames } from '../data/mockData';
import { sharePDFViaWhatsApp, generateInvoicePDF } from '../utils/pdfUtils';
import PDFPreviewModal from '../components/PDFPreviewModal';

const BankReceiptsScreen = () => {
  const [vSeries, setVSeries] = useState('VSeries');
  const [voucherSeries, setVoucherSeries] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [branch, setBranch] = useState('');
  const [location, setLocation] = useState('');
  const [executive, setExecutive] = useState('');
  const [date, setDate] = useState('26-11-2025');
  const [bankAccount, setBankAccount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [bodyItems, setBodyItems] = useState([
    {
      sno: '1',
      instrumentType: '',
      instrumentNo: '',
      instrumentDate: '',
      instrumentDetails: '',
      comments1: '',
      comments2: '',
      lineExecutive: '',
    },
  ]);
  const [totalAmount, setTotalAmount] = useState('0');
  const [totalDiscount, setTotalDiscount] = useState('0');
  const [totalValue, setTotalValue] = useState('0');
  const [ledgerBalance, setLedgerBalance] = useState('0');
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  const handleAddRow = () => {
    const newRow = {
      sno: String(bodyItems.length + 1),
      instrumentType: '',
      instrumentNo: '',
      instrumentDate: '',
      instrumentDetails: '',
      comments1: '',
      comments2: '',
      lineExecutive: '',
    };
    setBodyItems([...bodyItems, newRow]);
  };

  const handleDeleteRow = (index) => {
    const newItems = bodyItems.filter((_, i) => i !== index);
    setBodyItems(newItems.map((item, i) => ({ ...item, sno: String(i + 1) })));
  };

  const handleCellChange = (rowIndex, columnKey, value) => {
    const newItems = [...bodyItems];
    newItems[rowIndex][columnKey] = value;
    setBodyItems(newItems);
  };

  const bodyColumns = [
    { key: 'sno', label: 'Sno', width: 60, editable: false },
    { key: 'instrumentType', label: 'Instrument Type', width: 130, type: 'dropdown', options: ['Cheque', 'DD', 'NEFT', 'RTGS'] },
    { key: 'instrumentNo', label: 'Instrument No', width: 130 },
    { key: 'instrumentDate', label: 'Instrument Date', width: 130, placeholder: 'YYYY-MM-DD' },
    { key: 'instrumentDetails', label: 'Instrument Details', width: 150 },
    { key: 'comments1', label: 'Comments1', width: 120 },
    { key: 'comments2', label: 'Comments2', width: 120 },
    { key: 'lineExecutive', label: 'Line Executive', width: 130, type: 'dropdown', options: employeeUsernames },
  ];

  const summaryFields = [
    { label: 'Total Amount', value: totalAmount },
    { label: 'Total Discount', value: totalDiscount },
    { label: 'Total Value', value: totalValue },
    { label: 'Ledger Balance', value: ledgerBalance },
  ];

  const getInvoiceData = () => ({
    title: 'Bank Receipts',
    voucherDetails: {
      voucherSeries: vSeries,
      voucherNo: voucherNo,
      voucherDatetime: date,
    },
    transactionDetails: {
      date: date,
      branch: branch,
      location: location,
      username: executive,
    },
    customerData: {
      customerName: bankAccount,
    },
    bodyItems: bodyItems,
    summary: {
      totalAmount: parseFloat(totalAmount) || 0,
      totalDiscount: parseFloat(totalDiscount) || 0,
      totalValue: parseFloat(totalValue) || 0,
      ledgerBalance: parseFloat(ledgerBalance) || 0,
    },
    collections: {
      cash: parseFloat(totalAmount) || 0,
      balance: parseFloat(ledgerBalance) || 0,
    },
  });

  const handlePreviewInvoice = () => {
    if (bodyItems.length === 0 || !bodyItems[0].account) {
      Alert.alert('No Items', 'Please add at least one item to preview the receipt.', [{ text: 'OK' }]);
      return;
    }
    setShowPDFPreview(true);
  };

  const handleSendWhatsApp = async () => {
    if (bodyItems.length === 0 || !bodyItems[0].account) {
      Alert.alert('No Items', 'Please add at least one item before sending the receipt.', [{ text: 'OK' }]);
      return;
    }
    try {
      const { uri } = await generateInvoicePDF(getInvoiceData());
      await sharePDFViaWhatsApp(uri);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    }
  };

  return (
    <SmartSuiteFormScreen
      title="Bank Receipts"
      summaryFields={summaryFields}
      onPreview={handlePreviewInvoice}
      onWhatsApp={handleSendWhatsApp}
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
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={voucherSeries}
                onValueChange={setVoucherSeries}
                style={styles.picker}
              >
                <Picker.Item label="Select" value="" />
              </Picker>
            </View>
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
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Executive</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={executive}
                onValueChange={setExecutive}
                style={styles.picker}
              >
                <Picker.Item label="Executive" value="" />
                {employeeUsernames.map((e, idx) => (
                  <Picker.Item key={idx} label={e} value={e} />
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
            <Text style={styles.label}>
              Bank Account <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={bankAccount}
                onValueChange={setBankAccount}
                style={styles.picker}
              >
                <Picker.Item label="Select Bank Account" value="" />
              </Picker>
            </View>
          </View>
        </View>
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={styles.input}
            value={remarks}
            onChangeText={setRemarks}
            multiline
          />
        </View>
      </AccordionSection>

      <AccordionSection title="BODY" defaultExpanded={true}>
        <ItemTable
          columns={bodyColumns}
          data={bodyItems}
          onAddRow={handleAddRow}
          onDeleteRow={handleDeleteRow}
          onCellChange={handleCellChange}
        />
      </AccordionSection>

      <AccordionSection title="REFERENCE" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Ref VoucherSeries</Text>
            <TextInput style={styles.input} />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Ref VoucherNo</Text>
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
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Other Info1</Text>
            <TextInput style={styles.input} />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Other Info2</Text>
            <TextInput style={styles.input} />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Other Info3</Text>
            <TextInput style={styles.input} />
          </View>
        </View>
      </AccordionSection>

      <PDFPreviewModal
        isVisible={showPDFPreview}
        onClose={() => setShowPDFPreview(false)}
        invoiceData={getInvoiceData()}
      />
    </SmartSuiteFormScreen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
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
  required: {
    color: '#f44336',
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
});

export default BankReceiptsScreen;


