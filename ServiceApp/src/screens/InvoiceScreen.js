import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  FlatList,
  Linking,
} from 'react-native';
import { transactionDetails, voucherDetails, initialCustomer } from '../data/mockData';
import QRScannerModal from '../components/QRScannerModal';
import AddItemModal from '../components/AddItemModal';
import AddAdjustmentModal from '../components/AddAdjustmentModal';
import PreviewInvoiceModal from '../components/PreviewInvoiceModal';

const { width } = Dimensions.get('window');

const InvoiceScreen = () => {
  const [customerData, setCustomerData] = useState(initialCustomer);
  const [gstBill, setGstBill] = useState(initialCustomer.gstBill);
  const [showScanner, setShowScanner] = useState(false);
  const [items, setItems] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [adjustments, setAdjustments] = useState([]);
  const [showAddAdjustmentModal, setShowAddAdjustmentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Summary state
  const [summary, setSummary] = useState({
    itemCount: 0,
    totalQty: 0,
    totalGross: 0,
    totalDiscount: 0,
    totalAdd: 0,
    totalLess: 0,
    totalBillValue: 0,
    ledgerBalance: 0,
  });

  // Collections state
  const [collectedCash, setCollectedCash] = useState('');
  const [collectedCard, setCollectedCard] = useState('');
  const [collectedUpi, setCollectedUpi] = useState('');

  // Calculate summary whenever items or adjustments change
  useEffect(() => {
    calculateSummary();
  }, [items, adjustments]);

  const calculateSummary = () => {
    // Calculate item totals
    const itemCount = items.length;
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const itemsGross = items.reduce((sum, item) => sum + item.net, 0);

    // Calculate adjustment totals
    const totalAdd = adjustments.reduce((sum, adj) => sum + adj.addAmount, 0);
    const totalLess = adjustments.reduce((sum, adj) => sum + adj.lessAmount, 0);

    // Calculate totals
    const totalGross = itemsGross;
    const totalDiscount = 0; // Placeholder for now
    const totalBillValue = totalGross - totalDiscount + totalAdd - totalLess;
    const ledgerBalance = 0; // Placeholder for now

    setSummary({
      itemCount,
      totalQty,
      totalGross,
      totalDiscount,
      totalAdd,
      totalLess,
      totalBillValue,
      ledgerBalance,
    });
  };

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

  const handleAddItem = (newItem) => {
    setItems([...items, newItem]);
    setShowAddItemModal(false);
    Alert.alert(
      'Item Added Successfully! ✓',
      `${newItem.productName}\nQty: ${newItem.quantity} × ₹${newItem.rate.toFixed(2)} = ₹${newItem.net.toFixed(2)}`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteItem = (itemId) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setItems(items.filter((item) => item.id !== itemId));
          },
        },
      ]
    );
  };

  const handleAddAdjustment = (newAdjustment) => {
    setAdjustments([...adjustments, newAdjustment]);
    setShowAddAdjustmentModal(false);
    const amountType = newAdjustment.addAmount > 0 ? 'Add' : 'Less';
    const amount = newAdjustment.addAmount > 0 ? newAdjustment.addAmount : newAdjustment.lessAmount;
    Alert.alert(
      'Adjustment Added Successfully! ✓',
      `${newAdjustment.accountName}\n${amountType}: ₹${amount.toFixed(2)}`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAdjustment = (adjustmentId) => {
    Alert.alert(
      'Delete Adjustment',
      'Are you sure you want to delete this adjustment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAdjustments(adjustments.filter((adj) => adj.id !== adjustmentId));
          },
        },
      ]
    );
  };

  const handlePreviewInvoice = () => {
    // Validate that invoice has items
    if (items.length === 0) {
      Alert.alert(
        'No Items',
        'Please add at least one item to preview the invoice.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowPreviewModal(true);
  };

  const handleSendWhatsApp = () => {
    // Validate that invoice has items
    if (items.length === 0) {
      Alert.alert(
        'No Items',
        'Please add at least one item before sending the invoice.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Build a concise but complete invoice message
    let msg = `*EMPLOYEE SALES INVOICE*\n`;
    msg += `===========================\n\n`;
    
    // Transaction & Voucher
    msg += `*Invoice:* ${voucherDetails.voucherNo}\n`;
    msg += `*Date:* ${transactionDetails.date}\n`;
    msg += `*TXN ID:* ${transactionDetails.transactionId}\n\n`;
    
    // Customer
    msg += `*Customer Details*\n`;
    msg += `ID: ${customerData.customerId || 'Walk-in'}\n`;
    msg += `Mobile: ${customerData.mobileNo || 'N/A'}\n`;
    if (customerData.customerType) {
      msg += `Type: ${customerData.customerType}\n`;
    }
    msg += `\n`;
    
    // Items
    msg += `*Items (${items.length})*\n`;
    msg += `---------------------------\n`;
    items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.productName}\n`;
      msg += `   ${item.quantity} × ₹${item.rate.toFixed(2)} = ₹${item.net.toFixed(2)}\n`;
    });
    msg += `\n`;
    
    // Adjustments (if any)
    if (adjustments.length > 0) {
      msg += `*Adjustments*\n`;
      adjustments.forEach((adj) => {
        if (adj.addAmount > 0) {
          msg += `• ${adj.accountName}: +₹${adj.addAmount.toFixed(2)}\n`;
        }
        if (adj.lessAmount > 0) {
          msg += `• ${adj.accountName}: -₹${adj.lessAmount.toFixed(2)}\n`;
        }
      });
      msg += `\n`;
    }
    
    // Summary
    msg += `*SUMMARY*\n`;
    msg += `---------------------------\n`;
    msg += `Items: ${summary.itemCount} | Qty: ${summary.totalQty}\n`;
    msg += `Gross: ₹${summary.totalGross.toFixed(2)}\n`;
    
    if (summary.totalAdd > 0) {
      msg += `Add: +₹${summary.totalAdd.toFixed(2)}\n`;
    }
    if (summary.totalLess > 0) {
      msg += `Less: -₹${summary.totalLess.toFixed(2)}\n`;
    }
    
    msg += `\n*TOTAL BILL: ₹${summary.totalBillValue.toFixed(2)}*\n`;
    
    // Collections
    const totalCollected = (parseFloat(collectedCash) || 0) + 
                          (parseFloat(collectedCard) || 0) + 
                          (parseFloat(collectedUpi) || 0);
    const balance = summary.totalBillValue - totalCollected;
    
    if (totalCollected > 0) {
      msg += `\n*PAYMENT RECEIVED*\n`;
      if (parseFloat(collectedCash) > 0) {
        msg += `Cash: ₹${parseFloat(collectedCash).toFixed(2)}\n`;
      }
      if (parseFloat(collectedCard) > 0) {
        msg += `Card: ₹${parseFloat(collectedCard).toFixed(2)}\n`;
      }
      if (parseFloat(collectedUpi) > 0) {
        msg += `UPI: ₹${parseFloat(collectedUpi).toFixed(2)}\n`;
      }
      msg += `*Balance: ₹${balance.toFixed(2)}*\n`;
    }
    
    msg += `\n===========================\n`;
    msg += `Thank you for your business! 🙏`;

    // URL encode for WhatsApp
    const encodedMessage = encodeURIComponent(msg);
    
    // Try to send via WhatsApp with customer's WhatsApp number if available
    const phoneNumber = customerData.whatsappNo || customerData.mobileNo || '';
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    const whatsappUrl = cleanPhone 
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`
      : `whatsapp://send?text=${encodedMessage}`;

    console.log('WhatsApp URL length:', whatsappUrl.length);
    console.log('Message preview:', msg.substring(0, 200));

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert(
            'WhatsApp Not Available',
            'WhatsApp is not installed on this device. Please install WhatsApp to send invoices.',
            [{ text: 'OK' }]
          );
        }
      })
      .catch((error) => {
        console.error('Error opening WhatsApp:', error);
        Alert.alert(
          'Error',
          'Could not open WhatsApp. Please make sure it is installed and try again.',
          [{ text: 'OK' }]
        );
      });
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

      {/* ITEM BODY SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ITEM BODY</Text>
        
        {/* Add Item Button */}
        <TouchableOpacity
          style={styles.addItemButton}
          onPress={() => setShowAddItemModal(true)}
        >
          <Text style={styles.addItemButtonText}>+ Add Item</Text>
        </TouchableOpacity>

        {/* Items List */}
        {items.length > 0 ? (
          <View style={styles.itemsContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>S.No</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Product Name</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.8, textAlign: 'right' }]}>Qty</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Gross</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Net</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.6 }]}></Text>
            </View>

            {/* Items List with FlatList */}
            <FlatList
              data={items}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.itemRow}>
                  <Text style={[styles.itemCell, { flex: 0.5 }]}>{index + 1}</Text>
                  <Text style={[styles.itemCell, { flex: 2 }]} numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text style={[styles.itemCell, { flex: 0.8, textAlign: 'right' }]}>
                    {item.quantity}
                  </Text>
                  <Text style={[styles.itemCell, { flex: 1, textAlign: 'right' }]}>
                    ₹{item.rate.toFixed(2)}
                  </Text>
                  <Text style={[styles.itemCell, { flex: 1, textAlign: 'right' }]}>
                    ₹{item.gross.toFixed(2)}
                  </Text>
                  <Text style={[styles.itemCell, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>
                    ₹{item.net.toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.itemCell, { flex: 0.6, alignItems: 'center' }]}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />

            {/* Summary Row */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Items: {items.length}</Text>
              <Text style={styles.summaryAmount}>
                Total: ₹{items.reduce((sum, item) => sum + item.net, 0).toFixed(2)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📦</Text>
            <Text style={styles.emptyStateText}>No items added yet</Text>
            <Text style={styles.emptyStateSubtext}>Tap "Add Item" button to get started</Text>
          </View>
        )}
      </View>

      {/* ADJUSTMENTS BODY SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADJUSTMENTS BODY</Text>
        
        {/* Add Adjustment Button */}
        <TouchableOpacity
          style={styles.addAdjustmentButton}
          onPress={() => setShowAddAdjustmentModal(true)}
        >
          <Text style={styles.addAdjustmentButtonText}>+ Add Adjustment</Text>
        </TouchableOpacity>

        {/* Adjustments List */}
        {adjustments.length > 0 ? (
          <View style={styles.itemsContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>S.No</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Account</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Add</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Less</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Comments1</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.6 }]}></Text>
            </View>

            {/* Adjustments List with FlatList */}
            <FlatList
              data={adjustments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.itemRow}>
                  <Text style={[styles.itemCell, { flex: 0.5 }]}>{index + 1}</Text>
                  <Text style={[styles.itemCell, { flex: 2 }]} numberOfLines={2}>
                    {item.accountName}
                  </Text>
                  <Text
                    style={[
                      styles.itemCell,
                      { flex: 1, textAlign: 'right', color: '#4CAF50', fontWeight: 'bold' },
                    ]}
                  >
                    {item.addAmount > 0 ? `₹${item.addAmount.toFixed(2)}` : '-'}
                  </Text>
                  <Text
                    style={[
                      styles.itemCell,
                      { flex: 1, textAlign: 'right', color: '#f44336', fontWeight: 'bold' },
                    ]}
                  >
                    {item.lessAmount > 0 ? `₹${item.lessAmount.toFixed(2)}` : '-'}
                  </Text>
                  <Text style={[styles.itemCell, { flex: 1.5, fontSize: 11 }]} numberOfLines={2}>
                    {item.comments || '-'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.itemCell, { flex: 0.6, alignItems: 'center' }]}
                    onPress={() => handleDeleteAdjustment(item.id)}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />

            {/* Summary Row */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Adjustments: {adjustments.length}</Text>
              <View style={styles.adjustmentTotals}>
                <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
                  Add: ₹
                  {adjustments
                    .reduce((sum, adj) => sum + adj.addAmount, 0)
                    .toFixed(2)}
                </Text>
                <Text style={[styles.summaryAmount, { color: '#f44336', marginLeft: 12 }]}>
                  Less: ₹
                  {adjustments
                    .reduce((sum, adj) => sum + adj.lessAmount, 0)
                    .toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💰</Text>
            <Text style={styles.emptyStateText}>No adjustments added yet</Text>
            <Text style={styles.emptyStateSubtext}>Tap "Add Adjustment" to add discounts, taxes, etc.</Text>
          </View>
        )}
      </View>

      {/* SUMMARY SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUMMARY</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Count:</Text>
            <Text style={styles.summaryValue}>{summary.itemCount}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Qty:</Text>
            <Text style={styles.summaryValue}>{summary.totalQty}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Gross:</Text>
            <Text style={styles.summaryValue}>₹{summary.totalGross.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Discount:</Text>
            <Text style={styles.summaryValue}>₹{summary.totalDiscount.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Add:</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              +₹{summary.totalAdd.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Less:</Text>
            <Text style={[styles.summaryValue, { color: '#f44336' }]}>
              -₹{summary.totalLess.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalBillRow]}>
            <Text style={styles.totalBillLabel}>Total Bill Value:</Text>
            <Text style={styles.totalBillValue}>₹{summary.totalBillValue.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ledger Balance:</Text>
            <Text style={styles.summaryValue}>₹{summary.ledgerBalance.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* COLLECTIONS SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>COLLECTIONS</Text>
        
        {/* Cash Input */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Cash</Text>
          <TextInput
            style={styles.input}
            value={collectedCash}
            onChangeText={setCollectedCash}
            placeholder="Enter cash amount"
            keyboardType="numeric"
          />
        </View>

        {/* Card Input */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Card</Text>
          <TextInput
            style={styles.input}
            value={collectedCard}
            onChangeText={setCollectedCard}
            placeholder="Enter card amount"
            keyboardType="numeric"
          />
        </View>

        {/* UPI Input */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>UPI</Text>
          <TextInput
            style={styles.input}
            value={collectedUpi}
            onChangeText={setCollectedUpi}
            placeholder="Enter UPI amount"
            keyboardType="numeric"
          />
        </View>

        {/* Balance Calculation */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance:</Text>
          <Text style={styles.balanceValue}>
            ₹
            {(
              summary.totalBillValue -
              (parseFloat(collectedCash) || 0) -
              (parseFloat(collectedCard) || 0) -
              (parseFloat(collectedUpi) || 0)
            ).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.previewButton]}
          onPress={handlePreviewInvoice}
        >
          <Text style={styles.actionButtonText}>📄 Preview Invoice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.whatsappButton]}
          onPress={handleSendWhatsApp}
        >
          <Text style={styles.actionButtonText}>💬 Send WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isVisible={showScanner}
        onScan={handleScannedQr}
        onClose={() => setShowScanner(false)}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isVisible={showAddItemModal}
        onAddItem={handleAddItem}
        onClose={() => setShowAddItemModal(false)}
      />

      {/* Add Adjustment Modal */}
      <AddAdjustmentModal
        isVisible={showAddAdjustmentModal}
        onAddAdjustment={handleAddAdjustment}
        onClose={() => setShowAddAdjustmentModal(false)}
      />

      {/* Preview Invoice Modal */}
      <PreviewInvoiceModal
        isVisible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        transactionDetails={transactionDetails}
        voucherDetails={voucherDetails}
        customerData={customerData}
        items={items}
        adjustments={adjustments}
        summary={summary}
        collections={{
          cash: parseFloat(collectedCash) || 0,
          card: parseFloat(collectedCard) || 0,
          upi: parseFloat(collectedUpi) || 0,
          balance: summary.totalBillValue - 
                  (parseFloat(collectedCash) || 0) - 
                  (parseFloat(collectedCard) || 0) - 
                  (parseFloat(collectedUpi) || 0),
        }}
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
  addItemButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addItemButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemsContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  itemCell: {
    fontSize: 12,
    color: '#333',
  },
  deleteIcon: {
    fontSize: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e3f2fd',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 2,
    borderTopColor: '#2196F3',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  addAdjustmentButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addAdjustmentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  adjustmentTotals: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryGrid: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  totalBillRow: {
    backgroundColor: '#e3f2fd',
    marginHorizontal: -12,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: '#2196F3',
  },
  totalBillLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalBillValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#FFD54F',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  previewButton: {
    backgroundColor: '#2196F3',
    marginRight: 8,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default InvoiceScreen;
