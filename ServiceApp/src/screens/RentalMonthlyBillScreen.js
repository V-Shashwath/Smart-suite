import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SmartSuiteFormScreen from '../components/SmartSuiteFormScreen';
import AccordionSection from '../components/AccordionSection';
import ItemTable from '../components/ItemTable';
import { branches, employeeUsernames, adjustmentAccounts, machineTypes } from '../data/mockData';
import { previewInvoicePDF, sharePDFViaWhatsApp, generateInvoicePDF } from '../utils/pdfUtils';

const RentalMonthlyBillScreen = () => {
  const [branch, setBranch] = useState('');
  const [executive, setExecutive] = useState('');
  const [voucherSeries, setVoucherSeries] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [date, setDate] = useState('26-11-2025');
  const [customerName, setCustomerName] = useState('');
  const [salesAccount, setSalesAccount] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [customerType, setCustomerType] = useState('0');
  const [whatsappNo, setWhatsappNo] = useState('');
  const [machineType, setMachineType] = useState('');
  const [machinePurchasedDate, setMachinePurchasedDate] = useState('26-11-2025');
  const [contractExpiredOn, setContractExpiredOn] = useState('26-11-2025');
  const [remainingDays, setRemainingDays] = useState('0');
  const [remainingCopies, setRemainingCopies] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [gstBill, setGstBill] = useState(false);

  // Readings state
  const [readings, setReadings] = useState({
    currentReading: '0',
    previousReading: '0',
    a4: '0',
    totalA4: '0',
    ca4: '0',
    a3: '0',
    totalA3: '0',
    ca3: '0',
    monthlyCharges: '0',
    months: '0',
    freeCopies: '0',
    chargeableCopies: '0',
    contractCharges: '0',
    testedCopies: '0',
  });

  const [adjustments, setAdjustments] = useState([
    {
      sno: '1',
      account: '',
      add: '',
      less: '',
      discount: '',
      adjAmount: '',
      comments1: '',
      comments2: '',
      addLess: '',
      totalAdj: '',
    },
  ]);

  const handleAddAdjustment = () => {
    setAdjustments([...adjustments, {
      sno: String(adjustments.length + 1),
      account: '',
      add: '',
      less: '',
      discount: '',
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

  const adjustmentColumns = [
    { key: 'sno', label: 'Sno', width: 60, editable: false },
    { key: 'account', label: 'Account', width: 150, type: 'dropdown', options: adjustmentAccounts },
    { key: 'add', label: 'Add', width: 100, keyboardType: 'numeric' },
    { key: 'less', label: 'Less', width: 100, keyboardType: 'numeric' },
    { key: 'discount', label: 'Discount', width: 100, keyboardType: 'numeric' },
    { key: 'adjAmount', label: 'AdjAmount', width: 100, keyboardType: 'numeric' },
    { key: 'comments1', label: 'Comments1', width: 120 },
    { key: 'comments2', label: 'Comments2', width: 120 },
    { key: 'addLess', label: 'Add/Less', width: 100, type: 'dropdown', options: ['Add', 'Less'] },
    { key: 'totalAdj', label: 'TotalAdj', width: 100, keyboardType: 'numeric' },
  ];

  const summaryFields = [
    { label: 'Total Free Copies', value: '0' },
    { label: 'Chargeable Copies Amt', value: '0' },
    { label: 'Total Monthly Charges', value: '0' },
    { label: 'Total Chargeable Copies', value: '0' },
    { label: 'Chargeable Copies', value: '0' },
    { label: 'TotalAdd', value: '0' },
    { label: 'TotalLess', value: '0' },
    { label: 'Total Gross', value: '0' },
    { label: 'Total Value', value: '0' },
    { label: 'Ledger Balance', value: '0' },
  ];

  const collectionsFields = [
    { label: 'Collections', value: '0' },
    { label: 'Cash', value: '0' },
    { label: 'UPI', value: '0' },
    { label: 'Card', value: '0' },
    { label: 'Balance', value: '0' },
  ];

  const handlePreviewInvoice = async () => {
    if (!customerName || !customerId) {
      Alert.alert('Missing Data', 'Please fill in customer details to preview the bill.', [{ text: 'OK' }]);
      return;
    }
    try {
      await previewInvoicePDF({
        title: 'Rental Monthly Bill',
        voucherDetails: { voucherSeries: voucherSeries, voucherNo: voucherNo, voucherDatetime: date },
        transactionDetails: { date: date, branch: branch, username: executive },
        customerData: { customerName: customerName, customerId: customerId, mobileNo: mobileNo, whatsappNo: whatsappNo },
        readings: readings,
        adjustments: adjustments,
        summary: { totalValue: summaryFields.find(f => f.label === 'TotalValue')?.value || 0 },
      });
    } catch (error) {
      console.error('Error previewing bill:', error);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!customerName || !customerId) {
      Alert.alert('Missing Data', 'Please fill in customer details before sending the bill.', [{ text: 'OK' }]);
      return;
    }
    try {
      const { uri } = await generateInvoicePDF({
        title: 'Rental Monthly Bill',
        voucherDetails: { voucherSeries: voucherSeries, voucherNo: voucherNo, voucherDatetime: date },
        transactionDetails: { date: date, branch: branch, username: executive },
        customerData: { customerName: customerName, customerId: customerId, mobileNo: mobileNo, whatsappNo: whatsappNo },
        readings: readings,
        adjustments: adjustments,
        summary: { totalValue: summaryFields.find(f => f.label === 'TotalValue')?.value || 0 },
      });
      await sharePDFViaWhatsApp(uri, whatsappNo || mobileNo);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    }
  };

  return (
    <SmartSuiteFormScreen
      title="Rental Monthly Bill"
      summaryFields={summaryFields}
      footerContent={(
        <View style={styles.footerActionWrapper}>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.previewButton]} onPress={handlePreviewInvoice}>
              <Text style={styles.actionButtonText}>📄 Preview Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.whatsappButton]} onPress={handleSendWhatsApp}>
              <Text style={styles.actionButtonText}>💬 Send WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Machine Purchased Date</Text>
            <TextInput
              style={styles.input}
              value={machinePurchasedDate}
              onChangeText={setMachinePurchasedDate}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contract Expired On</Text>
            <TextInput
              style={styles.input}
              value={contractExpiredOn}
              onChangeText={setContractExpiredOn}
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Remaining Days</Text>
            <TextInput
              style={styles.input}
              value={remainingDays}
              onChangeText={setRemainingDays}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Remaining Copies</Text>
            <TextInput
              style={styles.input}
              value={remainingCopies}
              onChangeText={setRemainingCopies}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={styles.input}
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={3}
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
              <Text style={styles.label}>Current Reading</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.currentReading}
                onChangeText={(text) => setReadings({ ...readings, currentReading: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>Previous Reading</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.previousReading}
                onChangeText={(text) => setReadings({ ...readings, previousReading: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>A4</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.a4}
                onChangeText={(text) => setReadings({ ...readings, a4: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>TotalA4</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.totalA4}
                onChangeText={(text) => setReadings({ ...readings, totalA4: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>CA4</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.ca4}
                onChangeText={(text) => setReadings({ ...readings, ca4: text })}
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
              <Text style={styles.label}>TotalA3</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.totalA3}
                onChangeText={(text) => setReadings({ ...readings, totalA3: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>CA3</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.ca3}
                onChangeText={(text) => setReadings({ ...readings, ca3: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>Monthly Charges</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.monthlyCharges}
                onChangeText={(text) => setReadings({ ...readings, monthlyCharges: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>Months</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.months}
                onChangeText={(text) => setReadings({ ...readings, months: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>Free Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.freeCopies}
                onChangeText={(text) => setReadings({ ...readings, freeCopies: text })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>Chargeable Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.chargeableCopies}
                onChangeText={(text) => setReadings({ ...readings, chargeableCopies: text })}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>Contract Charges</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.contractCharges}
                onChangeText={(text) => setReadings({ ...readings, contractCharges: text })}
                keyboardType="numeric"
              />
            </View>
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
        </View>
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
        <View style={styles.collectionsGrid}>
          {collectionsFields.map((field, index) => (
            <View key={index} style={styles.collectionField}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.collectionInput}
                value={field.value}
                keyboardType="numeric"
              />
            </View>
          ))}
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
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  collectionField: {
    flex: 1,
    minWidth: '45%',
  },
  collectionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  previewButton: {
    backgroundColor: '#2196F3',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RentalMonthlyBillScreen;


