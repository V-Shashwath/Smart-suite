import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { transactionDetails, voucherDetails, initialCustomer } from '../data/mockData';
import QRScannerModal from '../components/QRScannerModal';

const { width } = Dimensions.get('window');

const InvoiceScreen = () => {
  const [customerData, setCustomerData] = useState(initialCustomer);
  const [gstBill, setGstBill] = useState(initialCustomer.gstBill);
  const [showScanner, setShowScanner] = useState(false);

  const handleInputChange = (field, value) => {
    setCustomerData({
      ...customerData,
      [field]: value,
    });
  };

  const handleScannedQr = (data) => {
    console.log('QR Data received:', data);
    
    // Parse comma-separated data: customerId,mobileNo,customerType,whatsappNo
    // Example: "CUST-007,9876543210,CrystalCopier,9876543210"
    try {
      const parts = data.split(',');
      
      if (parts.length >= 4) {
        const [customerId, mobileNo, customerType, whatsappNo] = parts;
        
        // Update customer state with scanned data
        setCustomerData({
          ...customerData,
          customerId: customerId.trim(),
          mobileNo: mobileNo.trim(),
          customerType: customerType.trim(),
          whatsappNo: whatsappNo.trim(),
        });
        
        Alert.alert(
          'QR Code Scanned Successfully! ✓',
          `Customer ID: ${customerId.trim()}\nMobile: ${mobileNo.trim()}`,
          [{ text: 'OK' }]
        );
      } else {
        // If format is different, just use the raw data as customer ID
        setCustomerData({
          ...customerData,
          customerId: data.trim(),
        });
        
        Alert.alert(
          'QR Code Scanned',
          `Data: ${data}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error parsing QR data:', error);
      Alert.alert(
        'Scan Error',
        'Could not parse QR code data',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Employee Sales Invoice</Text>
      </View>

      {/* TRANSACTION DETAILS SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TRANSACTION DETAILS</Text>
        
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Transaction ID</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{transactionDetails.transactionId}</Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Status</Text>
            <View style={[styles.displayBox, styles.statusBox]}>
              <Text style={styles.statusText}>{transactionDetails.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Transaction Date</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{transactionDetails.transactionDate}</Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Transaction Time</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{transactionDetails.transactionTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Transaction Type</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{transactionDetails.transactionType}</Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{transactionDetails.paymentMethod}</Text>
            </View>
          </View>
        </View>

        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Reference</Text>
          <View style={styles.displayBox}>
            <Text style={styles.displayText}>{transactionDetails.reference}</Text>
          </View>
        </View>
      </View>

      {/* VOUCHER SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VOUCHER</Text>
        
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Voucher Number</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{voucherDetails.voucherNumber}</Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Voucher Date</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{voucherDetails.voucherDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Voucher Type</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{voucherDetails.voucherType}</Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Series</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{voucherDetails.series}</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Prefix</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{voucherDetails.prefix}</Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Suffix</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{voucherDetails.suffix}</Text>
            </View>
          </View>
        </View>

        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Fiscal Year</Text>
          <View style={styles.displayBox}>
            <Text style={styles.displayText}>{voucherDetails.fiscalYear}</Text>
          </View>
        </View>
      </View>

      {/* HEADER SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HEADER</Text>
        
        {/* Date */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={customerData.date}
            onChangeText={(value) => handleInputChange('date', value)}
            placeholder="Enter date"
          />
        </View>

        {/* Biller Name and Party */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Biller Name</Text>
            <TextInput
              style={styles.input}
              value={customerData.billerName}
              onChangeText={(value) => handleInputChange('billerName', value)}
              placeholder="Enter biller name"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Party</Text>
            <TextInput
              style={styles.input}
              value={customerData.party}
              onChangeText={(value) => handleInputChange('party', value)}
              placeholder="Enter party"
            />
          </View>
        </View>

        {/* Employee Name and Customer ID with QR */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Employee Name</Text>
            <TextInput
              style={styles.input}
              value={customerData.employeeName}
              onChangeText={(value) => handleInputChange('employeeName', value)}
              placeholder="Enter employee name"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Customer ID</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.inputWithButton}
                value={customerData.customerId}
                onChangeText={(value) => handleInputChange('customerId', value)}
                placeholder="Enter customer ID"
              />
              <TouchableOpacity 
                style={styles.qrButton}
                onPress={() => setShowScanner(true)}
              >
                <Text style={styles.qrButtonText}>📷</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Mobile No and Customer Type */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Mobile No</Text>
            <TextInput
              style={styles.input}
              value={customerData.mobileNo}
              onChangeText={(value) => handleInputChange('mobileNo', value)}
              placeholder="Enter mobile number"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Customer Type</Text>
            <TextInput
              style={styles.input}
              value={customerData.customerType}
              onChangeText={(value) => handleInputChange('customerType', value)}
              placeholder="Enter customer type"
            />
          </View>
        </View>

        {/* WhatsApp No and Reading A4 */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>WhatsApp No</Text>
            <TextInput
              style={styles.input}
              value={customerData.whatsappNo}
              onChangeText={(value) => handleInputChange('whatsappNo', value)}
              placeholder="Enter WhatsApp number"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Reading A4</Text>
            <TextInput
              style={styles.input}
              value={customerData.readingA4}
              onChangeText={(value) => handleInputChange('readingA4', value)}
              placeholder="Enter A4 reading"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Reading A3 and Machine Type */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Reading A3</Text>
            <TextInput
              style={styles.input}
              value={customerData.readingA3}
              onChangeText={(value) => handleInputChange('readingA3', value)}
              placeholder="Enter A3 reading"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Machine Type</Text>
            <TextInput
              style={styles.input}
              value={customerData.machineType}
              onChangeText={(value) => handleInputChange('machineType', value)}
              placeholder="Enter machine type"
            />
          </View>
        </View>

        {/* Remarks */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={customerData.remarks}
            onChangeText={(value) => handleInputChange('remarks', value)}
            placeholder="Enter remarks"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* GST Bill Checkbox */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => {
              setGstBill(!gstBill);
              handleInputChange('gstBill', !gstBill);
            }}
          >
            <View style={[styles.checkboxBox, gstBill && styles.checkboxChecked]}>
              {gstBill && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>GST Bill</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Placeholder for future sections */}
      <View style={styles.placeholderSection}>
        <Text style={styles.placeholderText}>
          Additional sections (Items, Adjustments, Summary, etc.) will be added in next phases
        </Text>
      </View>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isVisible={showScanner}
        onScan={handleScannedQr}
        onClose={() => setShowScanner(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenHeader: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 40,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  fullWidthField: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  displayBox: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  displayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusBox: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  qrButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  qrButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  placeholderSection: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 20,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default InvoiceScreen;
