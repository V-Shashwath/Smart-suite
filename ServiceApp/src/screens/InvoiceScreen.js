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
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  transactionDetails,
  voucherDetails,
  initialCustomer,
  branches,
  locations,
  employeeUsernames,
  machineTypes,
  products,
  adjustmentAccounts,
  adjustmentsList,
} from '../data/mockData';
import QRScannerModal from '../components/QRScannerModal';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import AddItemModal from '../components/AddItemModal';
import AddAdjustmentModal from '../components/AddAdjustmentModal';
import PreviewInvoiceModal from '../components/PreviewInvoiceModal';

const { width } = Dimensions.get('window');

const InvoiceScreen = () => {
  // Transaction state
  const [transactionData, setTransactionData] = useState(transactionDetails);
  
  // Voucher state
  const [voucherData, setVoucherData] = useState(voucherDetails);
  
  // Customer state
  const [customerData, setCustomerData] = useState(initialCustomer);
  const [gstBill, setGstBill] = useState(initialCustomer.gstBill);
  
  // Barcode state (integrated into ITEM BODY)
  const [barcode, setBarcode] = useState('');
  
  // Items state with extended fields
  const [items, setItems] = useState([]);
  
  // Modals state
  const [showScanner, setShowScanner] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddAdjustmentModal, setShowAddAdjustmentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showMobileSearchModal, setShowMobileSearchModal] = useState(false);
  
  // Adjustments state
  const [adjustments, setAdjustments] = useState([]);
  
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

  const handleTransactionChange = (field, value) => {
    setTransactionData({
      ...transactionData,
      [field]: value,
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
    
    try {
      const parts = data.split(',');
      
      if (parts.length >= 4) {
        const [customerId, mobileNo, customerType, whatsappNo, employeeName] = parts;
        
        setCustomerData({
          ...customerData,
          customerId: customerId.trim(),
          mobileNo: mobileNo.trim(),
          customerType: customerType.trim(),
          whatsappNo: whatsappNo.trim(),
          employeeName: employeeName?.trim() || customerData.employeeName,
        });
        
        Alert.alert(
          'Customer Details Loaded! ✓',
          `Customer ID: ${customerId.trim()}\nMobile: ${mobileNo.trim()}\nType: ${customerType.trim()}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Invalid QR Code',
          'QR code format is incorrect. Please use "Search by Mobile" option.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Search by Mobile', onPress: () => setShowMobileSearchModal(true) }
          ]
        );
      }
    } catch (error) {
      console.error('Error parsing QR data:', error);
      Alert.alert(
        'QR Scan Error',
        'Could not read QR code. Would you like to search by mobile number?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Search by Mobile', onPress: () => setShowMobileSearchModal(true) }
        ]
      );
    }
  };

  // Handle mobile number search (fallback if QR fails)
  const handleSearchByMobile = (mobileNumber) => {
    if (!mobileNumber || mobileNumber.trim().length < 10) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    // TODO: In production, fetch customer from backend API
    // For now, using mock data simulation
    // Example API call:
    // fetch(`${API_BASE_URL}/customers/search?mobile=${mobileNumber}`)
    //   .then(response => response.json())
    //   .then(result => { ... })

    // Mock customer data for testing
    const mockCustomer = {
      customerId: 'CUST-' + mobileNumber.slice(-4),
      mobileNo: mobileNumber,
      customerType: 'Regular',
      whatsappNo: mobileNumber,
      employeeName: 'Satya',
    };

    setCustomerData({
      ...customerData,
      ...mockCustomer,
    });

    setShowMobileSearchModal(false);

    Alert.alert(
      'Customer Found! ✓',
      `Customer ID: ${mockCustomer.customerId}\nMobile: ${mockCustomer.mobileNo}\nType: ${mockCustomer.customerType}\n\n⚠️ Note: Connect to backend for real customer data`,
      [{ text: 'OK' }]
    );
  };

  // Handle scanned barcode from camera
  const handleScannedBarcode = (scannedData) => {
    console.log('Barcode scanned from camera:', scannedData);
    
    // Set the barcode value and automatically trigger the get logic
    setBarcode(scannedData);
    
    // Use setTimeout to ensure state is updated before processing
    setTimeout(() => {
      processBarcode(scannedData);
    }, 100);
  };

  // Barcode processing logic (supports various barcode formats: 7-8, 10-12 digits/characters)
  // IMPORTANT: Each unique barcode (serial no) is tracked individually
  // TODO: Integrate with backend API - fetch(`${API_BASE_URL}/products/barcode/${barcode}`)
  const processBarcode = (barcodeData) => {
    if (!barcodeData || !barcodeData.trim()) {
      Alert.alert('Error', 'Invalid barcode data', [{ text: 'OK' }]);
      return;
    }

    const trimmedBarcode = barcodeData.trim();
    console.log(`Processing barcode: ${trimmedBarcode} (length: ${trimmedBarcode.length})`);

    // Support various barcode formats (7-8, 10-12 characters)
    // For now, map barcode to product ID (simple mapping for demo)
    // TODO: Replace with backend API call to fetch product by barcode from database
    
    let product = null;
    
    // Try to find product by ID (for testing with numeric barcodes 1-12)
    const numericBarcode = parseInt(trimmedBarcode);
    if (!isNaN(numericBarcode) && numericBarcode > 0 && numericBarcode <= products.length) {
      product = products.find((p) => p.id === numericBarcode);
    }
    
    // If not found by numeric ID, try to match by barcode string
    // (In production, products would have a 'barcode' field)
    if (!product) {
      // For demo: use barcode length to select different products
      // This simulates different barcode standards
      const barcodeLength = trimmedBarcode.length;
      if (barcodeLength >= 7 && barcodeLength <= 8) {
        product = products[0]; // First product for 7-8 char barcodes
      } else if (barcodeLength >= 10 && barcodeLength <= 12) {
        product = products[1]; // Second product for 10-12 char barcodes
      } else if (barcodeLength === 13) {
        product = products[2]; // Third product for 13 char barcodes (EAN-13)
      }
    }

    if (!product) {
      Alert.alert(
        'Product Not Found',
        `No product found with barcode: ${trimmedBarcode}\n\nLength: ${trimmedBarcode.length} characters\n\nFor testing: Use barcodes 1-12 or any 7-13 character barcode.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // CRITICAL LOGIC: Check if product has unique serial numbers
    // Scenario 1: Product with unique serial (iPhone, electronics) → Check by barcode, increment if same
    // Scenario 2: Product without unique serial (generic items) → Always add new row
    // Scenario 3: Manually added without barcode → Always add new row
    
    const hasUniqueSerialNo = product.hasUniqueSerialNo === true;

    if (hasUniqueSerialNo) {
      // SCENARIO 1: Product tracks unique serial numbers (e.g., iPhone IMEI)
      // Check if this EXACT barcode already exists
      const existingItemIndex = items.findIndex(
        (item) => item.productSerialNo === trimmedBarcode && item.productSerialNo !== ''
      );

      if (existingItemIndex !== -1) {
        // SAME UNIQUE BARCODE EXISTS - Increment quantity
        const updatedItems = [...items];
        const existingItem = updatedItems[existingItemIndex];
        existingItem.quantity += 1;
        existingItem.gross = existingItem.rate * existingItem.quantity;
        existingItem.net = existingItem.gross;
        
        setItems(updatedItems);
        
        Alert.alert(
          'Same Serial No - Quantity Updated! ✓',
          `${product.name}\nSerial No: ${trimmedBarcode}\nNew Qty: ${existingItem.quantity}`,
          [{ text: 'OK' }]
        );
      } else {
        // DIFFERENT UNIQUE BARCODE - Add as NEW row
        const newItem = {
          id: Date.now(),
          productId: product.id,
          productName: product.name,
          quantity: 1,
          rate: product.rate,
          gross: product.rate,
          net: product.rate,
          comments1: '',
          salesMan: '',
          freeQty: '',
          productSerialNo: trimmedBarcode, // Store unique serial number
          comments6: '',
        };
        
        setItems([...items, newItem]);
        
        Alert.alert(
          'New Item Added! ✓',
          `${product.name}\nUnique Serial: ${trimmedBarcode}\nRate: ₹${product.rate.toFixed(2)}`,
          [{ text: 'OK' }]
        );
      }
    } else {
      // SCENARIO 2 & 3: Product does NOT have unique serial numbers (generic barcode)
      // OR manually added without barcode
      // ALWAYS add as NEW row (never increment)
      const newItem = {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        rate: product.rate,
        gross: product.rate,
        net: product.rate,
        comments1: '',
        salesMan: '',
        freeQty: '',
        productSerialNo: trimmedBarcode, // Store barcode even if not unique (for reference)
        comments6: '',
      };
      
      setItems([...items, newItem]);
      
      Alert.alert(
        'New Item Added! ✓',
        `${product.name}\nBarcode: ${trimmedBarcode}\nRate: ₹${product.rate.toFixed(2)}\n\nNote: Generic barcode - each scan creates new row`,
        [{ text: 'OK' }]
      );
    }

    // Clear barcode input after processing
    setTimeout(() => setBarcode(''), 500);
  };

  // Barcode Get Handler - Main logic for manual barcode entry
  const handleBarcodeGet = () => {
    if (!barcode.trim()) {
      Alert.alert('Error', 'Please enter or scan a barcode', [{ text: 'OK' }]);
      return;
    }

    processBarcode(barcode);
  };

  const handleAddItem = (newItem) => {
    // SCENARIO 3: Manually added items (without barcode/serial)
    // Check if same product already exists without serial number
    const existingItemIndex = items.findIndex(
      (item) => item.productId === newItem.productId && 
                item.productSerialNo === ''
    );

    if (existingItemIndex !== -1) {
      // Same product exists without serial - INCREMENT QUANTITY
      const updatedItems = [...items];
      const existingItem = updatedItems[existingItemIndex];
      existingItem.quantity += newItem.quantity;
      existingItem.gross = existingItem.rate * existingItem.quantity;
      existingItem.net = existingItem.gross;
      
      setItems(updatedItems);
      setShowAddItemModal(false);
      
      Alert.alert(
        'Quantity Updated! ✓',
        `${newItem.productName}\nNew Qty: ${existingItem.quantity}\n(Manually added items merged)`,
        [{ text: 'OK' }]
      );
    } else {
      // First time or different product - ADD NEW ROW
      const extendedItem = {
        ...newItem,
        comments1: '',
        salesMan: '',
        freeQty: '',
        productSerialNo: '', // Empty serial for manual adds
        comments6: '',
      };
      
      setItems([...items, extendedItem]);
      setShowAddItemModal(false);
      
      Alert.alert(
        'Item Added Successfully! ✓',
        `${newItem.productName}\nQty: ${newItem.quantity} × ₹${newItem.rate.toFixed(2)} = ₹${newItem.net.toFixed(2)}`,
        [{ text: 'OK' }]
      );
    }
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

  const handleUpdateItemField = (itemId, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updatedItems);
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
    if (items.length === 0) {
      Alert.alert(
        'No Items',
        'Please add at least one item before sending the invoice.',
        [{ text: 'OK' }]
      );
      return;
    }

    let msg = `*EMPLOYEE SALES INVOICE*\n`;
    msg += `===========================\n\n`;
    
    msg += `*Invoice:* ${voucherData.voucherNo}\n`;
    msg += `*Date:* ${transactionData.date}\n`;
    msg += `*TXN ID:* ${transactionData.transactionId}\n\n`;
    
    msg += `*Customer Details*\n`;
    msg += `ID: ${customerData.customerId || 'Walk-in'}\n`;
    msg += `Mobile: ${customerData.mobileNo || 'N/A'}\n`;
    if (customerData.customerType) {
      msg += `Type: ${customerData.customerType}\n`;
    }
    msg += `\n`;
    
    msg += `*Items (${items.length})*\n`;
    msg += `---------------------------\n`;
    items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.productName}\n`;
      msg += `   ${item.quantity} × ₹${item.rate.toFixed(2)} = ₹${item.net.toFixed(2)}\n`;
    });
    msg += `\n`;
    
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

    const encodedMessage = encodeURIComponent(msg);
    
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

  const renderItemRow = ({ item, index }) => (
    <View style={styles.itemRow}>
      <Text style={[styles.itemCell, { flex: 0.5 }]}>{index + 1}</Text>
      <Text style={[styles.itemCell, { flex: 2 }]}>{item.productName}</Text>
      <Text style={[styles.itemCell, { flex: 1 }]}>{item.quantity}</Text>
      <Text style={[styles.itemCell, { flex: 1 }]}>₹{item.rate.toFixed(2)}</Text>
      <Text style={[styles.itemCell, { flex: 1 }]}>₹{item.gross.toFixed(2)}</Text>
      <Text style={[styles.itemCell, { flex: 1 }]}>₹{item.net.toFixed(2)}</Text>
      <TouchableOpacity
        style={[styles.itemCell, { flex: 0.7 }]}
        onPress={() => handleDeleteItem(item.id)}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAdjustmentRow = ({ item, index }) => (
    <View style={styles.adjustmentRow}>
      <Text style={[styles.adjustmentCell, { flex: 0.5 }]}>{index + 1}</Text>
      <Text style={[styles.adjustmentCell, { flex: 2 }]}>{item.accountName}</Text>
      <Text style={[styles.adjustmentCell, { flex: 1 }]}>
        {item.addAmount > 0 ? `₹${item.addAmount.toFixed(2)}` : '-'}
      </Text>
      <Text style={[styles.adjustmentCell, { flex: 1 }]}>
        {item.lessAmount > 0 ? `₹${item.lessAmount.toFixed(2)}` : '-'}
      </Text>
      <Text style={[styles.adjustmentCell, { flex: 1.5 }]}>{item.comments || '-'}</Text>
      <TouchableOpacity
        style={[styles.adjustmentCell, { flex: 0.7 }]}
        onPress={() => handleDeleteAdjustment(item.id)}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Employee Sales Invoice</Text>
      </View>

      {/* TRANSACTION DETAILS SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TRANSACTION DETAILS</Text>
        
        {/* Transaction ID and Date */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Transaction ID</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{transactionData.transactionId}</Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{transactionData.date}</Text>
            </View>
          </View>
        </View>

        {/* Time and Status */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Time</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{transactionData.time}</Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Status</Text>
            <View style={[styles.displayBox, styles.statusBox]}>
              <Text style={styles.statusText}>{transactionData.status}</Text>
            </View>
          </View>
        </View>

        {/* Branch Picker */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Branch</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={transactionData.branch}
              onValueChange={(value) => handleTransactionChange('branch', value)}
              style={styles.picker}
            >
              {branches.map((branch, idx) => (
                <Picker.Item key={idx} label={branch} value={branch} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Location Picker */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={transactionData.location}
              onValueChange={(value) => handleTransactionChange('location', value)}
              style={styles.picker}
            >
              {locations.map((location, idx) => (
                <Picker.Item key={idx} label={location} value={location} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Employee Location Picker */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Employee Location</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={transactionData.employeeLocation}
              onValueChange={(value) => handleTransactionChange('employeeLocation', value)}
              style={styles.picker}
            >
              {locations.map((location, idx) => (
                <Picker.Item key={idx} label={location} value={location} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Username Picker */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={transactionData.username}
              onValueChange={(value) => handleTransactionChange('username', value)}
              style={styles.picker}
            >
              {employeeUsernames.map((username, idx) => (
                <Picker.Item key={idx} label={username} value={username} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* VOUCHER SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VOUCHER</Text>
        
        {/* Voucher Series, No, Datetime */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Voucher Series</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{voucherData.voucherSeries}</Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Voucher No</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>{voucherData.voucherNo}</Text>
            </View>
          </View>
        </View>

        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Voucher Datetime</Text>
          <View style={styles.displayBox}>
            <Text style={styles.displayText}>{voucherData.voucherDatetime}</Text>
          </View>
        </View>
      </View>

      {/* HEADER SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HEADER</Text>
        
        {/* Date and Biller Name */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={customerData.date}
              onChangeText={(value) => handleInputChange('date', value)}
              placeholder="Enter date"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Biller Name</Text>
            <TextInput
              style={styles.input}
              value={customerData.billerName}
              onChangeText={(value) => handleInputChange('billerName', value)}
              placeholder="Enter biller name"
            />
          </View>
        </View>

        {/* Party */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Party</Text>
          <TextInput
            style={styles.input}
            value={customerData.party}
            onChangeText={(value) => handleInputChange('party', value)}
            placeholder="Enter party name"
          />
        </View>

        {/* Customer ID with QR Scanner - READ ONLY */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Customer ID 🔒</Text>
          <View style={styles.inputWithIcon}>
            <View style={[styles.input, styles.readOnlyInput, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.readOnlyText}>
                {customerData.customerId || 'Scan QR Code to load customer'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowScanner(true)}
            >
              <Text style={styles.iconButtonText}>📷 QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { marginLeft: 4, backgroundColor: '#2196F3' }]}
              onPress={() => setShowMobileSearchModal(true)}
            >
              <Text style={styles.iconButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>Scan QR or use 🔍 to search by mobile number</Text>
        </View>

        {/* Employee Name - READ ONLY (auto-filled from QR) */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Employee Name 🔒</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>
              {customerData.employeeName || 'Will be filled from QR code'}
            </Text>
          </View>
        </View>

        {/* Mobile No and WhatsApp No - READ ONLY */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Mobile No 🔒</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {customerData.mobileNo || 'From QR'}
              </Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>WhatsApp No 🔒</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {customerData.whatsappNo || 'From QR'}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Type - READ ONLY */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Customer Type 🔒</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>
              {customerData.customerType || 'From QR code'}
            </Text>
          </View>
        </View>

        {/* Reading A4 and A3 */}
        <View style={styles.row}>
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
        </View>

        {/* Machine Type Picker */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Machine Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={customerData.machineType}
              onValueChange={(value) => handleInputChange('machineType', value)}
              style={styles.picker}
            >
              {machineTypes.map((type, idx) => (
                <Picker.Item key={idx} label={type} value={type} />
              ))}
            </Picker>
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
            onPress={() => setGstBill(!gstBill)}
          >
            <Text style={styles.checkboxIcon}>{gstBill ? '☑' : '☐'}</Text>
            <Text style={styles.checkboxLabel}>GST Bill</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ITEM BODY SECTION WITH INTEGRATED BARCODE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ITEM BODY</Text>
        
        {/* Barcode Input (Integrated into ITEM BODY) */}
        <View style={styles.barcodeSection}>
          <Text style={styles.label}>Barcode</Text>
          <View style={styles.barcodeInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Enter or scan barcode"
            />
            <TouchableOpacity
              style={styles.scanBarcodeButton}
              onPress={() => setShowBarcodeScanner(true)}
            >
              <Text style={styles.scanBarcodeButtonText}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.getButton}
              onPress={handleBarcodeGet}
            >
              <Text style={styles.getButtonText}>Get</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            📷 Scan barcode with camera or enter manually, then click "Get" to add/update item.
          </Text>
        </View>

        {/* Add Item Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddItemModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Item Manually</Text>
        </TouchableOpacity>

        {/* Items Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>Sno</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Product</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Qty</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Rate</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Gross</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Net</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.7 }]}>Action</Text>
        </View>

        {/* Items List */}
        {items.length > 0 ? (
          <FlatList
            data={items}
            renderItem={renderItemRow}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No items added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Scan a barcode or use "Add Item" button
            </Text>
          </View>
        )}

        {/* Extended Item Fields (shown when items exist) */}
        {items.length > 0 && (
          <View style={styles.extendedFieldsSection}>
            <Text style={styles.extendedFieldsTitle}>Additional Item Details (Optional)</Text>
            {items.map((item, index) => (
              <View key={item.id} style={styles.extendedFieldsContainer}>
                <Text style={styles.extendedFieldsLabel}>Item {index + 1}: {item.productName}</Text>
                
                <View style={styles.row}>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Comments1</Text>
                    <TextInput
                      style={styles.input}
                      value={item.comments1}
                      onChangeText={(value) => handleUpdateItemField(item.id, 'comments1', value)}
                      placeholder="Comments"
                    />
                  </View>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Sales Man</Text>
                    <TextInput
                      style={styles.input}
                      value={item.salesMan}
                      onChangeText={(value) => handleUpdateItemField(item.id, 'salesMan', value)}
                      placeholder="Sales person"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Free Qty</Text>
                    <TextInput
                      style={styles.input}
                      value={item.freeQty}
                      onChangeText={(value) => handleUpdateItemField(item.id, 'freeQty', value)}
                      placeholder="Free quantity"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Product Serial No</Text>
                    <TextInput
                      style={styles.input}
                      value={item.productSerialNo}
                      onChangeText={(value) => handleUpdateItemField(item.id, 'productSerialNo', value)}
                      placeholder="Serial number"
                    />
                  </View>
                </View>

                <View style={styles.fullWidthField}>
                  <Text style={styles.label}>Comments6</Text>
                  <TextInput
                    style={styles.input}
                    value={item.comments6}
                    onChangeText={(value) => handleUpdateItemField(item.id, 'comments6', value)}
                    placeholder="Additional comments"
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ADJUSTMENTS BODY SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADJUSTMENTS BODY</Text>
        
        {/* Add Adjustment Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddAdjustmentModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Adjustment</Text>
        </TouchableOpacity>

        {/* Adjustments Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 0.5 }]}>Sno</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Account</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Add</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Less</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Comments1</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.7 }]}>Action</Text>
        </View>

        {/* Adjustments List */}
        {adjustments.length > 0 ? (
          <FlatList
            data={adjustments}
            renderItem={renderAdjustmentRow}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No adjustments added</Text>
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
            <Text style={styles.summaryValue}>₹{summary.totalAdd.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Less:</Text>
            <Text style={styles.summaryValue}>₹{summary.totalLess.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Bill Value:</Text>
            <Text style={styles.totalValue}>₹{summary.totalBillValue.toFixed(2)}</Text>
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
        
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Cash</Text>
            <TextInput
              style={styles.input}
              value={collectedCash}
              onChangeText={setCollectedCash}
              placeholder="Enter cash amount"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Card</Text>
            <TextInput
              style={styles.input}
              value={collectedCard}
              onChangeText={setCollectedCard}
              placeholder="Enter card amount"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>UPI</Text>
            <TextInput
              style={styles.input}
              value={collectedUpi}
              onChangeText={setCollectedUpi}
              placeholder="Enter UPI amount"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Balance</Text>
            <View style={styles.displayBox}>
              <Text style={styles.balanceText}>
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

      {/* Spacing at bottom */}
      <View style={{ height: 40 }} />

      {/* MODALS */}
      <QRScannerModal
        isVisible={showScanner}
        onScan={handleScannedQr}
        onClose={() => setShowScanner(false)}
      />

      <BarcodeScannerModal
        isVisible={showBarcodeScanner}
        onScan={handleScannedBarcode}
        onClose={() => setShowBarcodeScanner(false)}
      />

      <AddItemModal
        isVisible={showAddItemModal}
        onAddItem={handleAddItem}
        onClose={() => setShowAddItemModal(false)}
      />

      <AddAdjustmentModal
        isVisible={showAddAdjustmentModal}
        onAddAdjustment={handleAddAdjustment}
        onClose={() => setShowAddAdjustmentModal(false)}
      />

      <PreviewInvoiceModal
        isVisible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        transactionDetails={transactionData}
        voucherDetails={voucherData}
        customerData={customerData}
        items={items}
        adjustments={adjustments}
        summary={summary}
        collections={{
          cash: parseFloat(collectedCash) || 0,
          card: parseFloat(collectedCard) || 0,
          upi: parseFloat(collectedUpi) || 0,
          balance:
            summary.totalBillValue -
            (parseFloat(collectedCash) || 0) -
            (parseFloat(collectedCard) || 0) -
            (parseFloat(collectedUpi) || 0),
        }}
      />

      {/* Mobile Search Modal (Fallback if QR fails) */}
      <MobileSearchModal
        isVisible={showMobileSearchModal}
        onSearch={handleSearchByMobile}
        onClose={() => setShowMobileSearchModal(false)}
      />
    </ScrollView>
  );
};

// Mobile Search Modal Component (Inline)
const MobileSearchModal = ({ isVisible, onSearch, onClose }) => {
  const [mobileNumber, setMobileNumber] = useState('');

  const handleSearch = () => {
    onSearch(mobileNumber);
    setMobileNumber('');
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={mobileSearchStyles.modalOverlay}>
        <View style={mobileSearchStyles.modalContainer}>
          <Text style={mobileSearchStyles.modalTitle}>Search Customer by Mobile Number</Text>
          <Text style={mobileSearchStyles.modalSubtitle}>
            Enter mobile number to fetch customer details from database
          </Text>

          <TextInput
            style={mobileSearchStyles.input}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            placeholder="Enter 10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            autoFocus
          />

          <View style={mobileSearchStyles.buttonRow}>
            <TouchableOpacity
              style={[mobileSearchStyles.button, mobileSearchStyles.cancelButton]}
              onPress={() => {
                setMobileNumber('');
                onClose();
              }}
            >
              <Text style={mobileSearchStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[mobileSearchStyles.button, mobileSearchStyles.searchButton]}
              onPress={handleSearch}
            >
              <Text style={mobileSearchStyles.searchButtonText}>🔍 Search</Text>
            </TouchableOpacity>
          </View>

          <Text style={mobileSearchStyles.note}>
            ⚠️ Note: Connect backend API for real-time customer data
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const mobileSearchStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#2196F3',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 11,
    color: '#FF9800',
    marginTop: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenHeader: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    borderColor: '#bbb',
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
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
    backgroundColor: '#fff3e0',
    borderColor: '#FF9800',
  },
  statusText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 20,
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxIcon: {
    fontSize: 24,
    marginRight: 8,
    color: '#2196F3',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  barcodeSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  barcodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  scanBarcodeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  scanBarcodeButtonText: {
    fontSize: 20,
  },
  getButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  helperText: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#34495e',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  itemCell: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },
  deleteIcon: {
    fontSize: 18,
    textAlign: 'center',
  },
  adjustmentRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  adjustmentCell: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  extendedFieldsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  extendedFieldsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
  },
  extendedFieldsContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  extendedFieldsLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryGrid: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  totalRow: {
    backgroundColor: '#e3f2fd',
    marginTop: 8,
    borderRadius: 4,
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  balanceText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  previewButton: {
    backgroundColor: '#673AB7',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default InvoiceScreen;
