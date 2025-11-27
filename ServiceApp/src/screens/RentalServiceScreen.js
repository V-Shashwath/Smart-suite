import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SmartSuiteFormScreen from '../components/SmartSuiteFormScreen';
import AccordionSection from '../components/AccordionSection';
import ItemTable from '../components/ItemTable';
import { branches, employeeUsernames, productOptions, adjustmentAccounts, machineTypes } from '../data/mockData';
import { previewInvoicePDF, sharePDFViaWhatsApp, generateInvoicePDF } from '../utils/pdfUtils';

const RentalServiceScreen = () => {
  const [branch, setBranch] = useState('');
  const [executive, setExecutive] = useState('');
  const [vSeries, setVSeries] = useState('VSeries');
  const [voucherSeries, setVoucherSeries] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [date, setDate] = useState('26-11-2025');
  const [customerName, setCustomerName] = useState('');
  const [salesAccount, setSalesAccount] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [whatsappNo, setWhatsappNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [machineType, setMachineType] = useState('');
  const [gstBill, setGstBill] = useState(false);

  // Readings state
  const [readings, setReadings] = useState({
    in: '0',
    out: '0',
    testedCopies: '0',
    ia4: '0',
    a4: '0',
    a4Copies: '0',
    ia3: '0',
    a3: '0',
    a3Copies: '0',
  });

  // Barcode state
  const [barcode, setBarcode] = useState('0');

  const [itemBody, setItemBody] = useState([
    {
      sno: '1',
      barcode: '',
      product: '',
      quantity: '',
      productSerialNo: '',
      rate: '',
      gross: '',
      comments1: '',
      comments2: '',
      freeQty: '',
      stkQty: '',
    },
  ]);

  const [adjustments, setAdjustments] = useState([
    {
      sno: '1',
      account: '',
      add: '',
      less: '',
      adjAmount: '',
      comments1: '',
      comments2: '',
      addLess: '',
      totalAdj: '',
    },
  ]);

  const handleAddItem = () => {
    setItemBody([...itemBody, {
      sno: String(itemBody.length + 1),
      barcode: '',
      product: '',
      quantity: '',
      productSerialNo: '',
      rate: '',
      gross: '',
      comments1: '',
      comments2: '',
      freeQty: '',
      stkQty: '',
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
      adjAmount: '',
      comments1: '',
      comments2: '',
      addLess: '',
      totalAdj: '',
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
    { key: 'barcode', label: 'Barcode', width: 120 },
    { key: 'product', label: 'Product*', width: 150, type: 'dropdown', options: productOptions, required: true },
    { key: 'quantity', label: 'Quantity', width: 100, keyboardType: 'numeric' },
    { key: 'productSerialNo', label: 'ProductSerialNo', width: 130 },
    { key: 'rate', label: 'Rate', width: 100, keyboardType: 'numeric' },
    { key: 'gross', label: 'Gross', width: 100, keyboardType: 'numeric' },
    { key: 'comments1', label: 'Comments1', width: 120 },
    { key: 'comments2', label: 'Comments2', width: 120 },
    { key: 'freeQty', label: 'FreeQty', width: 100, keyboardType: 'numeric' },
    { key: 'stkQty', label: 'StkQty', width: 100, keyboardType: 'numeric' },
  ];

  const adjustmentColumns = [
    { key: 'sno', label: 'Sno', width: 60, editable: false },
    { key: 'account', label: 'Account', width: 150, type: 'dropdown', options: adjustmentAccounts },
    { key: 'add', label: 'Add', width: 100, keyboardType: 'numeric' },
    { key: 'less', label: 'Less', width: 100, keyboardType: 'numeric' },
    { key: 'adjAmount', label: 'AdjAmount', width: 100, keyboardType: 'numeric' },
    { key: 'comments1', label: 'Comments1', width: 120 },
    { key: 'comments2', label: 'Comments2', width: 120 },
    { key: 'addLess', label: 'Add/Less', width: 100, type: 'dropdown', options: ['Add', 'Less'] },
    { key: 'totalAdj', label: 'TotalAdj', width: 100, keyboardType: 'numeric' },
  ];

  const summaryFields = [
    { label: 'Total Tested Copies', value: '0' },
    { label: 'TotalQty', value: '0' },
    { label: 'TotalGrossMinusDiscount', value: '0' },
    { label: 'TotalAdd', value: '0' },
    { label: 'TotalLess', value: '0' },
    { label: 'TotalGross', value: '0' },
    { label: 'TotalValue', value: '0' },
    { label: 'Ledger Balance', value: '0' },
  ];

  const [collectionTotal, setCollectionTotal] = useState('');
  const [collectedCash, setCollectedCash] = useState('');
  const [collectedCard, setCollectedCard] = useState('');
  const [collectedUpi, setCollectedUpi] = useState('');

  const getNumeric = (val) => parseFloat(val) || 0;
  const getTotalValue = () => parseFloat(summaryFields.find((field) => field.label === 'TotalValue')?.value) || 0;
  const calculatedBalance = () => {
    const total = getTotalValue();
    const balance = total - getNumeric(collectionTotal) - getNumeric(collectedCash) - getNumeric(collectedCard) - getNumeric(collectedUpi);
    return balance.toFixed(2);
  };

  const handlePreviewInvoice = async () => {
    if (itemBody.length === 0 || !itemBody[0].product) {
      Alert.alert('No Items', 'Please add at least one item to preview the service.', [{ text: 'OK' }]);
      return;
    }
    try {
      await previewInvoicePDF({
        title: 'Rental Service',
        voucherDetails: { voucherSeries: voucherSeries, voucherNo: voucherNo, voucherDatetime: date },
        transactionDetails: { date: date, branch: branch, username: executive },
        customerData: { customerName: customerName, customerId: customerId, mobileNo: mobileNo, whatsappNo: whatsappNo },
        readings: readings,
        items: itemBody.map(item => ({ productName: item.product, quantity: item.quantity || 0, rate: item.rate || 0, net: item.gross || 0 })),
        adjustments: adjustments,
        summary: { totalValue: summaryFields.find(f => f.label === 'TotalValue')?.value || 0 },
        collections: {
          collections: getNumeric(collectionTotal),
          cash: getNumeric(collectedCash),
          card: getNumeric(collectedCard),
          upi: getNumeric(collectedUpi),
          balance: parseFloat(calculatedBalance()),
        },
      });
    } catch (error) {
      console.error('Error previewing service:', error);
    }
  };

  const handleSendWhatsApp = async () => {
    if (itemBody.length === 0 || !itemBody[0].product) {
      Alert.alert('No Items', 'Please add at least one item before sending the service.', [{ text: 'OK' }]);
      return;
    }
    try {
      const { uri } = await generateInvoicePDF({
        title: 'Rental Service',
        voucherDetails: { voucherSeries: voucherSeries, voucherNo: voucherNo, voucherDatetime: date },
        transactionDetails: { date: date, branch: branch, username: executive },
        customerData: { customerName: customerName, customerId: customerId, mobileNo: mobileNo, whatsappNo: whatsappNo },
        readings: readings,
        items: itemBody.map(item => ({ productName: item.product, quantity: item.quantity || 0, rate: item.rate || 0, net: item.gross || 0 })),
        adjustments: adjustments,
        summary: { totalValue: summaryFields.find(f => f.label === 'TotalValue')?.value || 0 },
        collections: {
          collections: getNumeric(collectionTotal),
          cash: getNumeric(collectedCash),
          card: getNumeric(collectedCard),
          upi: getNumeric(collectedUpi),
          balance: parseFloat(calculatedBalance()),
        },
      });
      await sharePDFViaWhatsApp(uri, whatsappNo || mobileNo);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    }
  };

  return (
    <SmartSuiteFormScreen
      title="Rental Service"
      summaryFields={summaryFields}
      onPreview={handlePreviewInvoice}
      onWhatsApp={handleSendWhatsApp}
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
                <Picker.Item label="Branch" value="" />
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
                <Picker.Item label="Executive" value="" />
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
          <TouchableOpacity style={styles.escButton}>
            <Text style={styles.escButtonText}>ESC</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>
            * Customer Name
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={customerName}
              onValueChange={setCustomerName}
              style={styles.picker}
            >
              <Picker.Item label="Select Customer" value="" />
            </Picker>
          </View>
        </View>
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>
            * Sales Account
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
            <Text style={styles.label}>Machine Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={machineType}
                onValueChange={setMachineType}
                style={styles.picker}
              >
                <Picker.Item label="Select Machine Type" value="" />
                {machineTypes.map((m, idx) => (
                  <Picker.Item key={idx} label={m} value={m} />
                ))}
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
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setGstBill(!gstBill)}
          >
            <Text style={styles.checkboxIcon}>{gstBill ? '☑' : '☐'}</Text>
            <Text style={styles.checkboxLabel}>GST Bill</Text>
          </TouchableOpacity>
        </View>
      </AccordionSection>

      <AccordionSection title="READINGS" defaultExpanded={true}>
        <View style={styles.readingsGrid}>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>IN</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.in}
                onChangeText={(text) => setReadings({ ...readings, in: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>OUT</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.out}
                onChangeText={(text) => setReadings({ ...readings, out: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>Tested Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.testedCopies}
                onChangeText={(text) => setReadings({ ...readings, testedCopies: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>IA4</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.ia4}
                onChangeText={(text) => setReadings({ ...readings, ia4: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>A4</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.a4}
                onChangeText={(text) => setReadings({ ...readings, a4: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>A4 Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.a4Copies}
                onChangeText={(text) => setReadings({ ...readings, a4Copies: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>IA3</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.ia3}
                onChangeText={(text) => setReadings({ ...readings, ia3: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>A3</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.a3}
                onChangeText={(text) => setReadings({ ...readings, a3: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>A3 Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.a3Copies}
                onChangeText={(text) => setReadings({ ...readings, a3Copies: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </AccordionSection>

      <AccordionSection title="BARCODE" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <TextInput
              style={styles.input}
              value={barcode}
              onChangeText={setBarcode}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.barcodeButton}>
            <Text style={styles.barcodeButtonText}>Barcodes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.getButton}>
            <Text style={styles.getButtonText}>Get</Text>
          </TouchableOpacity>
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
  checkboxContainer: {
    marginTop: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  readingsGrid: {
    gap: 12,
  },
  readingRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  readingField: {
    flex: 1,
    minWidth: '45%',
  },
  readingInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  escButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  escButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  barcodeButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  barcodeButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  getButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  getButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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

export default RentalServiceScreen;


