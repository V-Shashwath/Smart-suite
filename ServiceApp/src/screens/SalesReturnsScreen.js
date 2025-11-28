import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SmartSuiteFormScreen from '../components/SmartSuiteFormScreen';
import AccordionSection from '../components/AccordionSection';
import ItemTable from '../components/ItemTable';
import { branches, employeeUsernames, productOptions, adjustmentAccounts } from '../data/mockData';
import { previewInvoicePDF, sharePDFViaWhatsApp, generateInvoicePDF } from '../utils/pdfUtils';
import useScreenDraft from '../hooks/useScreenDraft';
import withScreenPermission from '../components/withScreenPermission';

const SalesReturnsScreen = () => {
  const [branch, setBranch] = useState('');
  const [executive, setExecutive] = useState('');
  const [vSeries, setVSeries] = useState('');
  const [voucherSeries, setVoucherSeries] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [date, setDate] = useState('26-11-2025');
  const [billerName, setBillerName] = useState('0');
  const [party, setParty] = useState('');
  const [salesAccount, setSalesAccount] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [whatsappNo, setWhatsappNo] = useState('');
  const [readingA3, setReadingA3] = useState('');
  const [readingA4, setReadingA4] = useState('');
  const [remarks, setRemarks] = useState('');
  const [machineType, setMachineType] = useState('');

  const [itemBody, setItemBody] = useState([
    {
      sno: '1',
      code: '',
      product: '',
      quantity: '',
      inclRate: '',
      rate: '',
      gross: '',
      discRate: '',
      discount: '',
    },
  ]);

  const [adjustments, setAdjustments] = useState([
    {
      sno: '1',
      account: '',
      add: '',
      less: '',
      totalAdd: '',
      totalLess: '',
      adjAmount: '',
      comments1: '',
      comments2: '',
    },
  ]);

  const handleAddItem = () => {
    setItemBody([...itemBody, {
      sno: String(itemBody.length + 1),
      code: '',
      product: '',
      quantity: '',
      inclRate: '',
      rate: '',
      gross: '',
      discRate: '',
      discount: '',
    }]);
  };

  const handleDeleteItem = (index) => {
    const newItems = itemBody.filter((_, i) => i !== index);
    setItemBody(newItems.map((item, i) => ({ ...item, sno: String(i + 1) })));
  };

  const handleItemCellChange = (rowIndex, columnKey, value) => {
    const newItems = [...itemBody];
    newItems[rowIndex][columnKey] = value;
    setItemBody(newItems);
  };

  const handleAddAdjustment = () => {
    setAdjustments([...adjustments, {
      sno: String(adjustments.length + 1),
      account: '',
      add: '',
      less: '',
      totalAdd: '',
      totalLess: '',
      adjAmount: '',
      comments1: '',
      comments2: '',
    }]);
  };

  const handleDeleteAdjustment = (index) => {
    const newItems = adjustments.filter((_, i) => i !== index);
    setAdjustments(newItems.map((item, i) => ({ ...item, sno: String(i + 1) })));
  };

  const handleAdjustmentCellChange = (rowIndex, columnKey, value) => {
    const newItems = [...adjustments];
    newItems[rowIndex][columnKey] = value;
    setAdjustments(newItems);
  };

  const itemColumns = [
    { key: 'sno', label: 'Sno', width: 60, editable: false },
    { key: 'code', label: 'Code', width: 100, type: 'dropdown', options: [] },
    { key: 'product', label: 'Product*', width: 150, type: 'dropdown', options: productOptions, required: true },
    { key: 'quantity', label: 'Quantity*', width: 100, keyboardType: 'numeric', required: true },
    { key: 'inclRate', label: 'Incl Rate', width: 100, keyboardType: 'numeric' },
    { key: 'rate', label: 'Rate', width: 100, keyboardType: 'numeric' },
    { key: 'gross', label: 'Gross', width: 100, keyboardType: 'numeric' },
    { key: 'discRate', label: 'Disc Rate', width: 100, keyboardType: 'numeric' },
    { key: 'discount', label: 'Discount', width: 100, keyboardType: 'numeric' },
  ];

  const adjustmentColumns = [
    { key: 'sno', label: 'Sno', width: 60, editable: false },
    { key: 'account', label: 'Account', width: 150, type: 'dropdown', options: adjustmentAccounts },
    { key: 'add', label: 'Add', width: 100, keyboardType: 'numeric' },
    { key: 'less', label: 'Less', width: 100, keyboardType: 'numeric' },
    { key: 'totalAdd', label: 'TotalAdd', width: 100, keyboardType: 'numeric' },
    { key: 'totalLess', label: 'TotalLess', width: 100, keyboardType: 'numeric' },
    { key: 'adjAmount', label: 'AdjAmount', width: 100, keyboardType: 'numeric' },
    { key: 'comments1', label: 'Comments1', width: 120 },
    { key: 'comments2', label: 'Comments2', width: 120 },
  ];

  const totals = useMemo(() => {
    const totalQty = itemBody.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalGross = itemBody.reduce((sum, item) => sum + (parseFloat(item.gross) || 0), 0);
    const totalDiscount = itemBody.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
    const totalAdd = adjustments.reduce((sum, adj) => sum + (parseFloat(adj.add) || 0), 0);
    const totalLess = adjustments.reduce((sum, adj) => sum + (parseFloat(adj.less) || 0), 0);
    const totalBillValue = totalGross - totalDiscount + totalAdd - totalLess;
    return {
      totalQty,
      totalGross,
      totalDiscount,
      totalAdd,
      totalLess,
      totalBillValue,
      totalValue: totalBillValue,
    };
  }, [itemBody, adjustments]);

  const summaryFields = [
    { label: 'Total Qty', value: totals.totalQty.toString() },
    { label: 'Total Gross', value: totals.totalGross.toFixed(2) },
    { label: 'Total Discount', value: totals.totalDiscount.toFixed(2) },
    { label: 'Total Add', value: totals.totalAdd.toFixed(2) },
    { label: 'Total Less', value: totals.totalLess.toFixed(2) },
    { label: 'Total Bill Value', value: totals.totalBillValue.toFixed(2) },
    { label: 'Round off', value: '0.00' },
    { label: 'Total Value', value: totals.totalValue.toFixed(2) },
  ];

  const [collectionTotal, setCollectionTotal] = useState('');
  const [collectedCash, setCollectedCash] = useState('');
  const [collectedCard, setCollectedCard] = useState('');
  const [collectedUpi, setCollectedUpi] = useState('');

  const getNumeric = (val) => parseFloat(val) || 0;
  const getTotalBillValue = () => totals.totalBillValue;
  const calculatedBalance = () => {
    const total = getTotalBillValue();
    const balance = total - getNumeric(collectionTotal) - getNumeric(collectedCash) - getNumeric(collectedCard) - getNumeric(collectedUpi);
    return balance.toFixed(2);
  };

  const getSalesReturnData = useCallback(() => {
    return {
      title: 'Sales Returns',
      voucherDetails: { voucherSeries: vSeries, voucherNo: voucherNo, voucherDatetime: date },
      transactionDetails: { date, branch, username: executive },
      customerData: {
        customerName: party,
        customerId,
        mobileNo,
        whatsappNo,
        customerType,
      },
      header: {
        billerName,
        salesAccount,
        readingA3,
        readingA4,
        remarks,
        machineType,
      },
      items: itemBody,
      adjustments,
      summary: totals,
      collections: {
        collections: getNumeric(collectionTotal),
        cash: getNumeric(collectedCash),
        card: getNumeric(collectedCard),
        upi: getNumeric(collectedUpi),
        balance: parseFloat(calculatedBalance()),
      },
    };
  }, [
    vSeries,
    voucherNo,
    date,
    branch,
    executive,
    party,
    customerId,
    mobileNo,
    whatsappNo,
    customerType,
    billerName,
    salesAccount,
    readingA3,
    readingA4,
    remarks,
    machineType,
    itemBody,
    adjustments,
    totals,
    collectionTotal,
    collectedCash,
    collectedCard,
    collectedUpi,
    calculatedBalance,
  ]);

  const { handleSave, isSaving } = useScreenDraft('SalesReturns', getSalesReturnData, {
    successMessage: 'Sales return draft saved.',
  });

  const handlePreviewInvoice = async () => {
    if (itemBody.length === 0 || !itemBody[0].product) {
      Alert.alert('No Items', 'Please add at least one item to preview the return.', [{ text: 'OK' }]);
      return;
    }
    try {
      const data = getSalesReturnData();
      await previewInvoicePDF({
        title: data.title,
        voucherDetails: data.voucherDetails,
        transactionDetails: data.transactionDetails,
        customerData: data.customerData,
        items: data.items.map(item => ({
          productName: item.product,
          quantity: item.quantity || 0,
          rate: item.rate || 0,
          net: item.gross || 0,
        })),
        adjustments: data.adjustments,
        summary: data.summary,
        collections: data.collections,
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
      const data = getSalesReturnData();
      const { uri } = await generateInvoicePDF({
        title: data.title,
        voucherDetails: data.voucherDetails,
        transactionDetails: data.transactionDetails,
        customerData: data.customerData,
        items: data.items.map(item => ({
          productName: item.product,
          quantity: item.quantity || 0,
          rate: item.rate || 0,
          net: item.gross || 0,
        })),
        adjustments: data.adjustments,
        summary: data.summary,
        collections: data.collections,
      });
      await sharePDFViaWhatsApp(uri, mobileNo || whatsappNo);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    }
  };

  return (
    <SmartSuiteFormScreen
      title="Sales Returns"
      summaryFields={summaryFields}
      onPreview={handlePreviewInvoice}
      onWhatsApp={handleSendWhatsApp}
      actionBarActions={{ onSave: handleSave }}
      isSaving={isSaving}
    >
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
                <Picker.Item label="Select Branch" value="" />
                {branches.map((b, idx) => (
                  <Picker.Item key={idx} label={b} value={b} />
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
                <Picker.Item label="Select Executive" value="" />
                {employeeUsernames.map((e, idx) => (
                  <Picker.Item key={idx} label={e} value={e} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </AccordionSection>

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
                <Picker.Item label="Select" value="" />
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
            <Text style={styles.label}>Biller Name</Text>
            <TextInput
              style={styles.input}
              value={billerName}
              onChangeText={setBillerName}
            />
          </View>
        </View>
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>
            *Party
          </Text>
          <TextInput
            style={styles.input}
            value={party}
            onChangeText={setParty}
          />
        </View>
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>
            *Sales Account
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={salesAccount}
              onValueChange={setSalesAccount}
              style={styles.picker}
            >
              <Picker.Item label="Select Sales Account" value="" />
            </Picker>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Customer ID</Text>
            <TextInput
              style={styles.input}
              value={customerId}
              onChangeText={setCustomerId}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Mobile No</Text>
            <TextInput
              style={styles.input}
              value={mobileNo}
              onChangeText={setMobileNo}
              keyboardType="phone-pad"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Customer Type</Text>
            <TextInput
              style={styles.input}
              value={customerType}
              onChangeText={setCustomerType}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>WhatsApp No</Text>
            <TextInput
              style={styles.input}
              value={whatsappNo}
              onChangeText={setWhatsappNo}
              keyboardType="phone-pad"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>ReadingA3</Text>
            <TextInput
              style={styles.input}
              value={readingA3}
              onChangeText={setReadingA3}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>ReadingA4</Text>
            <TextInput
              style={styles.input}
              value={readingA4}
              onChangeText={setReadingA4}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Machine Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={machineType}
                onValueChange={setMachineType}
                style={styles.picker}
              >
                <Picker.Item label="Select Machine Type" value="" />
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

      <AccordionSection title="ITEM BODY" defaultExpanded={true}>
        <ItemTable
          columns={itemColumns}
          data={itemBody}
          onAddRow={handleAddItem}
          onDeleteRow={handleDeleteItem}
          onCellChange={handleItemCellChange}
        />
      </AccordionSection>

      <AccordionSection title="ADJUSTMENTS BODY" defaultExpanded={true}>
        <ItemTable
          columns={adjustmentColumns}
          data={adjustments}
          onAddRow={handleAddAdjustment}
          onDeleteRow={handleDeleteAdjustment}
          onCellChange={handleAdjustmentCellChange}
        />
      </AccordionSection>

      <AccordionSection title="COLLECTIONS" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Collections</Text>
            <TextInput
              style={styles.input}
              value={collectionTotal}
              onChangeText={setCollectionTotal}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Cash</Text>
            <TextInput
              style={styles.input}
              value={collectedCash}
              onChangeText={setCollectedCash}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Card</Text>
            <TextInput
              style={styles.input}
              value={collectedCard}
              onChangeText={setCollectedCard}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>UPI</Text>
            <TextInput
              style={styles.input}
              value={collectedUpi}
              onChangeText={setCollectedUpi}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Balance</Text>
          <View style={styles.displayBox}>
            <Text style={styles.balanceText}>₹{calculatedBalance()}</Text>
          </View>
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
  displayBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default withScreenPermission('SalesReturns')(SalesReturnsScreen);


