import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
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
import { API_ENDPOINTS, apiCall } from '../config/api';
import SmartSuiteFormScreen from '../components/SmartSuiteFormScreen';
import AccordionSection from '../components/AccordionSection';
import ItemTable from '../components/ItemTable';
import QRScannerModal from '../components/QRScannerModal';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import AddAdjustmentModal from '../components/AddAdjustmentModal';
import PDFPreviewModal from '../components/PDFPreviewModal';
import SerialNoSelectionModal from '../components/SerialNoSelectionModal';
import { sharePDFViaWhatsApp, sharePDFViaSMS, generateInvoicePDF, openWhatsAppContact, openSMSContact } from '../utils/pdfUtils';
import useScreenDraft from '../hooks/useScreenDraft';
import withScreenPermission from '../components/withScreenPermission';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { getBranchShortName } from '../utils/branchMapping';
import { getDisplayTime } from '../utils/timeUtils';

const { width } = Dimensions.get('window');

const EmployeeSaleInvoiceScreen = () => {
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const [isLoadingExecutiveData, setIsLoadingExecutiveData] = useState(false);
  
  // Check if user is supervisor - supervisors get blank, editable fields
  const isSupervisor = currentUser?.role === 'supervisor';

  // Transaction state - use blank values for supervisors
  const [transactionData, setTransactionData] = useState(
    isSupervisor 
      ? { date: '', time: '', branch: '', location: '', employeeLocation: '', username: '' }
      : transactionDetails
  );
  
  // Voucher state - use blank values for supervisors
  const [voucherData, setVoucherData] = useState(
    isSupervisor
      ? { voucherSeries: '', voucherNo: '', voucherDatetime: '' }
      : voucherDetails
  );
  
  // Customer state - use blank values for supervisors
  const blankCustomer = {
    date: '',
    billerName: '',
    party: '',
    employeeName: '',
    customerId: '',
    mobileNo: '',
    customerType: '',
    whatsappNo: '',
    readingA4: '',
    readingA3: '',
    machineType: '',
    remarks: '',
    gstBill: false,
  };
  const [customerData, setCustomerData] = useState(
    isSupervisor ? blankCustomer : initialCustomer
  );
  const [gstBill, setGstBill] = useState(isSupervisor ? false : initialCustomer.gstBill);
  
  // Barcode state (integrated into ITEM BODY)
  const [barcode, setBarcode] = useState('');
  
  // Items state with extended fields
  const [items, setItems] = useState([]);

  const normalizeItems = (list) =>
    list.map((item, index) => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const net = quantity * rate;
      return {
        ...item,
        quantity,
        rate,
        net,
        barcode: item.barcode || '',
        sno: String(index + 1),
      };
    });

  const commitItems = (list) => {
    setItems(normalizeItems(list));
  };
  
  // Modals state
  const [showScanner, setShowScanner] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showAddAdjustmentModal, setShowAddAdjustmentModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showMobileSearchModal, setShowMobileSearchModal] = useState(false);
  const [showSerialNoModal, setShowSerialNoModal] = useState(false);
  const [issuedProductsData, setIssuedProductsData] = useState(null);
  const [pendingProductData, setPendingProductData] = useState(null);
  
  // Loading states
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [savedInvoiceID, setSavedInvoiceID] = useState(null); // Track saved invoice ID for updates
  
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

  // Auto-populate executive data on mount (skip for supervisors)
  useEffect(() => {
    const loadExecutiveData = async () => {
      // Skip loading executive data for supervisors - they get blank fields
      if (isSupervisor) {
        console.log('👤 Supervisor logged in - skipping executive data load, using blank fields');
        // Initialize with completely blank values for supervisor (no prefilled data)
        setTransactionData({
          date: '',
          time: '',
          branch: '',
          location: '',
          employeeLocation: '',
          username: '',
        });
        
        setVoucherData({
          voucherSeries: '',
          voucherNo: '',
          voucherDatetime: '',
        });
        
        setCustomerData({
          date: '',
          billerName: '',
          party: '',
          employeeName: '',
          customerId: '',
          mobileNo: '',
          customerType: '',
          whatsappNo: '',
          readingA4: '',
          readingA3: '',
          machineType: '',
          remarks: '',
          gstBill: false,
        });
        setGstBill(false);
        return;
      }
      
      if (currentUser?.username) {
        setIsLoadingExecutiveData(true);
        try {
          console.log(`🔍 Fetching executive data for username: ${currentUser.username}`);
          console.log(`   User role: ${currentUser.role}`);
          console.log(`   API URL: ${API_ENDPOINTS.GET_EXECUTIVE_DATA(currentUser.username)}`);
          
          const result = await apiCall(API_ENDPOINTS.GET_EXECUTIVE_DATA(currentUser.username));
          
          console.log(`📥 Executive data response:`, result);
          
          if (result.success && result.data) {
            const execData = result.data;
            console.log(`✅ Executive data received:`, {
              username: execData.transactionDetails?.username,
              employeeName: execData.header?.employeeName,
            });
            
            // Ensure username matches the logged-in user (not supervisor)
            const fetchedUsername = execData.transactionDetails?.username || currentUser.username;
            if (fetchedUsername !== currentUser.username) {
              console.warn(`⚠️ Username mismatch! Expected: ${currentUser.username}, Got: ${fetchedUsername}`);
            }
            
            // Populate transaction details (all fields)
            setTransactionData({
              // transactionId and status removed - not stored in database
              date: execData.transactionDetails?.date || '',
              time: execData.transactionDetails?.time || '',
              branch: execData.transactionDetails?.branch || '',
              location: execData.transactionDetails?.location || '',
              employeeLocation: execData.transactionDetails?.employeeLocation || '', // Hidden from UI but kept in database
              username: currentUser.username, // Always use logged-in username, not API response
            });
            // Populate voucher details (all fields)
            // Ensure we have valid voucher data
            const voucherSeries = execData.voucherDetails?.voucherSeries || 'ESI';
            const voucherNo = execData.voucherDetails?.voucherNo || '';
            const voucherDatetime = execData.voucherDetails?.voucherDatetime || '';
            
            if (!voucherSeries || !voucherNo || !voucherDatetime) {
              console.warn('⚠️ Incomplete voucher data from API:', execData.voucherDetails);
              // Generate fallback if API data is incomplete
              const now = new Date();
              const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const datetimeStr = `${dateStr} ${timeStr}`;
              
              setVoucherData({
                voucherSeries: voucherSeries || 'ESI',
                voucherNo: voucherNo || `TEMP-${Date.now()}`,
                voucherDatetime: voucherDatetime || datetimeStr,
              });
            } else {
              setVoucherData({
                voucherSeries: voucherSeries,
                voucherNo: voucherNo,
                voucherDatetime: voucherDatetime,
              });
            }
            // Populate header (customer data) - but keep existing customer data if already loaded
            setCustomerData(prev => ({
              ...prev,
              date: execData.header?.date || prev.date,
              billerName: execData.header?.billerName || prev.billerName,
              employeeName: execData.header?.employeeName || currentUser.username, // Use API employee name, fallback to username
              party: execData.header?.employeeName || currentUser.username, // Use API employee name, fallback to username
              // Don't overwrite customer data if already loaded from QR
              customerId: prev.customerId || execData.header?.customerId || '',
              customerName: prev.customerName || execData.header?.customerName || '',
              mobileNo: prev.mobileNo || execData.header?.mobileNo || '',
              whatsappNo: prev.whatsappNo || execData.header?.whatsappNo || '',
              customerType: prev.customerType || execData.header?.customerType || '',
              readingA4: prev.readingA4 || execData.header?.readingA4 || '',
              readingA3: prev.readingA3 || execData.header?.readingA3 || '',
              machineType: prev.machineType || execData.header?.machineType || '',
              remarks: prev.remarks || execData.header?.remarks || '',
              gstBill: execData.header?.gstBill !== undefined ? execData.header.gstBill : prev.gstBill,
            }));
            setGstBill(execData.header?.gstBill || false);
          }
        } catch (error) {
          console.error('Error loading executive data:', error);
          // Use fallback values if API fails - don't break the app
          if (currentUser?.username) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const datetimeStr = `${dateStr} ${timeStr}`;
            // transactionId and status removed - not stored in database
            
            // Set transaction details with fallback values
            setTransactionData({
              // transactionId and status removed - not stored in database
              date: dateStr,
              time: timeStr,
              branch: 'Head Office', // Default branch
              location: 'Moorthy Location', // Default location
              employeeLocation: 'Moorthy Location', // Hidden from UI but kept in database
              username: currentUser.username,
            });
            
            // Set voucher details with fallback values
            // Use ESI as default series (Employee Sale Invoice)
            setVoucherData({
              voucherSeries: 'ESI', // Default series
              voucherNo: `TEMP-${Date.now()}`, // Temporary voucher number
              voucherDatetime: datetimeStr,
            });
            
            // Set header with fallback values
            setCustomerData(prev => ({
              ...prev,
              date: dateStr,
              billerName: prev.billerName || '',
              employeeName: currentUser.username,
              party: currentUser.username,
            }));
            
            // Silently continue - don't show error to user for executive data
            // The app will work with default values
          }
        } finally {
          setIsLoadingExecutiveData(false);
        }
      }
    };
    
    loadExecutiveData();
  }, [currentUser?.username, isSupervisor]);

  // Calculate summary whenever items or adjustments change
  useEffect(() => {
    calculateSummary();
  }, [items, adjustments]);

  const calculateSummary = () => {
    // Calculate item totals
    const itemCount = items.length;
    const totalQty = items.reduce((sum, item) => sum + item.quantity + (parseFloat(item.freeQty) || 0), 0);
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

  const handleScannedQr = async (data) => {
    console.log('QR Data received:', data);
    
    setIsLoadingCustomer(true);
    
    try {
      const trimmedData = data.trim();
      
      // Step 1: Try to fetch by CustomerID first (primary method)
      let customerFound = false;
      let networkErrorOccurred = false;
      
      try {
        // URL encode CustomerID to handle special characters
        const encodedCustomerId = encodeURIComponent(trimmedData);
        const result = await apiCall(API_ENDPOINTS.CUSTOMER_BY_ID(encodedCustomerId));
        
        if (result.success && result.data) {
          const customer = result.data;
          setCustomerData(prev => ({
            ...prev,
            customerId: customer.CustomerID,
            customerName: customer.CustomerName,
            mobileNo: customer.MobileNo,
            whatsappNo: customer.WhatsAppNo || customer.MobileNo,
            customerType: customer.CustomerType,
            // Preserve employee name from executive data
            employeeName: prev.employeeName || customer.CustomerName,
            party: prev.party || prev.employeeName || customer.CustomerName,
          }));
        
        Alert.alert(
          'Customer Details Loaded',
            `Customer ID: ${customer.CustomerID}\nName: ${customer.CustomerName}\nMobile: ${customer.MobileNo}\nType: ${customer.CustomerType}`,
          [{ text: 'OK' }]
        );
          customerFound = true;
        }
      } catch (error) {
        console.log('CustomerID lookup failed:', error.message);
        // Check if it's a network error - if so, don't try mobile fallback
        if (error.message.includes('Cannot connect to server')) {
          networkErrorOccurred = true;
          throw error; // Re-throw to show network error immediately
        }
      }
      
      // Step 2: If CustomerID fails and it's not a network error, try mobile number (fallback)
      if (!customerFound && !networkErrorOccurred) {
        // Extract mobile number from QR code
        const parts = trimmedData.split(',');
        let mobileNo = null;
        
        // Try to find mobile number in QR data
        if (parts.length >= 2) {
          // If comma-separated, try second part as mobile
          mobileNo = parts[1]?.trim();
        }
        
        // If no comma or second part doesn't work, try whole string
        if (!mobileNo || mobileNo.length < 10) {
          mobileNo = trimmedData;
        }
        
        // Clean mobile number (remove non-numeric)
        mobileNo = mobileNo.replace(/\D/g, '');
        
        if (mobileNo && mobileNo.length >= 10) {
          try {
            const result = await apiCall(API_ENDPOINTS.CUSTOMER_BY_MOBILE(mobileNo));
            
            if (result.success && result.data) {
              const customer = result.data;
              setCustomerData(prev => ({
                ...prev,
                customerId: customer.CustomerID,
                customerName: customer.CustomerName,
                mobileNo: customer.MobileNo,
                whatsappNo: customer.WhatsAppNo || customer.MobileNo,
                customerType: customer.CustomerType,
                // Preserve employee name from executive data
                employeeName: prev.employeeName || customer.CustomerName,
                party: prev.party || prev.employeeName || customer.CustomerName,
              }));
              
        Alert.alert(
                'Customer Details Loaded',
                `Customer ID: ${customer.CustomerID}\nName: ${customer.CustomerName}\nMobile: ${customer.MobileNo}\nType: ${customer.CustomerType}`,
                [{ text: 'OK' }]
              );
              customerFound = true;
            }
          } catch (error) {
            console.error('Mobile number lookup failed:', error.message);
            // If it's a network error, show it immediately
            if (error.message.includes('Cannot connect to server')) {
              throw error;
            }
          }
        }
      }
      
      // Step 3: If both fail, show error and offer mobile search
      if (!customerFound) {
        Alert.alert(
          'Customer Not Found',
          `Could not find customer with:\nQR Code: ${trimmedData}\n\nWould you like to search by mobile number?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Search by Mobile', onPress: () => setShowMobileSearchModal(true) }
          ]
        );
      }
      
    } catch (error) {
      console.error('Error parsing QR data:', error);
      // Show network error immediately
      if (error.message.includes('Cannot connect to server')) {
        Alert.alert(
          'Connection Error',
          error.message + '\n\nPlease check:\n1. Backend server is running\n2. API_BASE_URL in api.js is correct\n3. Phone and computer on same Wi-Fi',
          [
            { text: 'OK', style: 'default' },
            { text: 'Search by Mobile', onPress: () => setShowMobileSearchModal(true) }
          ]
        );
      } else {
      Alert.alert(
        'QR Scan Error',
          `Error: ${error.message}\n\nWould you like to search by mobile number?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Search by Mobile', onPress: () => setShowMobileSearchModal(true) }
        ]
      );
      }
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  // Handle mobile number search (fallback if QR fails)
  const handleSearchByMobile = async (mobileNumber) => {
    if (!mobileNumber || mobileNumber.trim().length < 10) {
      throw new Error('Please enter a valid 10-digit mobile or WhatsApp number');
    }

    // Clean mobile number (remove non-numeric characters)
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    
    if (cleanMobile.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile or WhatsApp number');
    }

    setIsLoadingCustomer(true);
    
    try {
      const result = await apiCall(API_ENDPOINTS.CUSTOMER_BY_MOBILE(cleanMobile));
      
      if (result.success && result.data) {
        const customer = result.data;
        setCustomerData(prev => ({
          ...prev,
          customerId: customer.CustomerID,
          customerName: customer.CustomerName,
          mobileNo: customer.MobileNo,
          whatsappNo: customer.WhatsAppNo || customer.MobileNo,
          customerType: customer.CustomerType,
          // Preserve employee name from executive data
          employeeName: prev.employeeName || customer.CustomerName,
          party: prev.party || prev.employeeName || customer.CustomerName,
        }));

    setShowMobileSearchModal(false);

    Alert.alert(
      'Customer Found',
          `Customer ID: ${customer.CustomerID}\nName: ${customer.CustomerName}\nMobile: ${customer.MobileNo}\nType: ${customer.CustomerType}`,
      [{ text: 'OK' }]
    );
      } else {
        throw new Error('Customer not found in database');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      // Re-throw error so modal can display it
      throw error;
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  // Handle scanned barcode from camera
  const handleScannedBarcode = (scannedData) => {
    console.log('Barcode scanned from camera:', scannedData);
    
    // Close the barcode scanner first
    setShowBarcodeScanner(false);
    
    // Set the barcode value and automatically trigger the get logic
    setBarcode(scannedData);
    
    // Use setTimeout to ensure state is updated before processing
    setTimeout(async () => {
      await processBarcode(scannedData);
    }, 100);
  };

  // Barcode processing logic - Fetches product from API
  // IMPORTANT: Each unique barcode (serial no) is tracked individually
  const processBarcode = async (barcodeData) => {
    if (!barcodeData || !barcodeData.trim()) {
      Alert.alert('Error', 'Invalid barcode data', [{ text: 'OK' }]);
      return;
    }

    const trimmedBarcode = barcodeData.trim();
    console.log(`Processing barcode: ${trimmedBarcode} (length: ${trimmedBarcode.length})`);

    try {
      // Fetch product from API
      const result = await apiCall(API_ENDPOINTS.GET_PRODUCT_BY_BARCODE(trimmedBarcode));
      
      if (!result.success || !result.data) {
        throw new Error('Product not found');
    }
    
      const product = {
        id: result.data.productId,
        name: result.data.productName,
        rate: result.data.rate,
        hasUniqueSerialNo: result.data.hasUniqueSerialNo || false,
      };

    // CRITICAL LOGIC: Handle barcode scanning based on product.hasUniqueSerialNo from API
    // Case 1: Product HAS productSerialNo (hasUniqueSerialNo: true) → Always add new row (even if same barcode scanned twice)
    // Case 2: Product DOES NOT HAVE productSerialNo (hasUniqueSerialNo: false) → Increment quantity if same product exists
    
    console.log(`🔍 Scanning barcode: ${trimmedBarcode}`);
    console.log(`   Product: ${product.name}`);
    console.log(`   hasUniqueSerialNo: ${product.hasUniqueSerialNo}`);

    if (product.hasUniqueSerialNo) {
      // CASE 1: Product HAS productSerialNo → Check for issued products first
      console.log(`✅ Product has unique serial number - Checking for issued products`);
      
      // Get employee name from customerData or transactionData
      const employeeName = customerData.employeeName || transactionData.username || '';
      
      console.log(`👤 Employee name for issued products check: "${employeeName}"`);
      console.log(`📦 Checking issued products for barcode: "${trimmedBarcode}"`);
      
      if (employeeName) {
        try {
          // Check for issued products for this employee
          const issuedResult = await apiCall(
            API_ENDPOINTS.GET_ISSUED_PRODUCTS_BY_BARCODE(trimmedBarcode, employeeName)
          );
          
          console.log(`📥 Issued products API response:`, JSON.stringify(issuedResult, null, 2));
          
          if (issuedResult.success && 
              issuedResult.data && 
              issuedResult.data.issuedProducts) {
            // Found issued products - show selection modal
            const products = issuedResult.data.issuedProducts || [];
            console.log(`📦 Found ${products.length} issued products`);
            console.log('📦 Issued products data:', JSON.stringify(products, null, 2));
            console.log('📦 Products is array?', Array.isArray(products));
            console.log('📦 First product:', products[0]);
            
            // Set data first, then open modal after a small delay to ensure state is updated
            setPendingProductData({
              product: product,
              barcode: trimmedBarcode,
              result: result,
            });
            setIssuedProductsData(products);
            
            // Use setTimeout to ensure state is updated before opening modal
            setTimeout(() => {
              setShowSerialNoModal(true);
            }, 100);
            
            // Clear barcode input after processing
            setTimeout(() => setBarcode(''), 500);
            return; // Exit early, modal will handle adding items
          }
        } catch (error) {
          console.log('Could not fetch issued products, proceeding with normal flow:', error.message);
          // Continue with normal flow if issued products check fails
        }
      }
      
      // No issued products found or employee name not available - proceed with normal flow
      // Use SerialNo from API if available, otherwise use barcode
      const serialNo = result.data.productSerialNo || trimmedBarcode;
      
        const newItem = {
          id: Date.now(),
          productId: product.id,
          productName: product.name,
          barcode: trimmedBarcode,
          quantity: 1,
          rate: product.rate || 0, // Rate is 0, user will enter manually
          net: 0, // Will be recalculated when rate is entered
          comments1: '',
          freeQty: '',
          productSerialNo: serialNo, // Use SerialNo from database if available
        };
        
        commitItems([...items, newItem]);
        
        const rateMessage = product.rate > 0 
          ? `Rate: ₹${product.rate.toFixed(2)}` 
          : `Rate: Please enter manually`;
        
        Alert.alert(
          'New Item Added',
        `${product.name}\nSerial No: ${serialNo}\n${rateMessage}\n\nProduct has serial number - added as new row`,
          [{ text: 'OK' }]
        );
    } else {
      // CASE 2: Product DOES NOT HAVE productSerialNo → Check if same product with null serial exists
      console.log(`❌ Product does not have serial number - Checking for existing product with null serial`);
      const existingProductIndex = items.findIndex(
        (item) => item.productId === product.id && 
                  (item.productSerialNo === null || item.productSerialNo === undefined || item.productSerialNo === '')
      );

      if (existingProductIndex !== -1) {
        // Same product exists with null serial - Increment quantity
        console.log(`✅ Found same product with null serial - Incrementing quantity`);
        const updatedItems = [...items];
        const existingItem = { ...updatedItems[existingProductIndex] };
        existingItem.quantity += 1;
        existingItem.productSerialNo = null; // Ensure it's null for database
        // Recalculate net
        existingItem.net = existingItem.quantity * existingItem.rate;
        updatedItems[existingProductIndex] = existingItem;
        commitItems(updatedItems);
        
        Alert.alert(
          'Quantity Updated',
          `${product.name}\nBarcode: ${trimmedBarcode}\nNew Qty: ${existingItem.quantity}\n\nProduct has no serial number - quantity incremented`,
          [{ text: 'OK' }]
        );
      } else {
        // No item with null serial exists - Add new row with null serial
        console.log(`❌ No item with null serial found - Adding new row with null serial`);
      const newItem = {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        barcode: trimmedBarcode,
        quantity: 1,
        rate: product.rate || 0, // Rate is 0, user will enter manually
        net: 0, // Will be recalculated when rate is entered
        comments1: '',
        freeQty: '',
        productSerialNo: null, // Set to null when product has no serial number
      };
      
      commitItems([...items, newItem]);
      
      const rateMessage = product.rate > 0 
        ? `Rate: ₹${product.rate.toFixed(2)}` 
        : `Rate: Please enter manually`;
      
      Alert.alert(
        'New Item Added',
          `${product.name}\nBarcode: ${trimmedBarcode}\n${rateMessage}\n\nProduct has no serial number - added as new row`,
        [{ text: 'OK' }]
      );
      }
    }

    // Clear barcode input after processing
    setTimeout(() => setBarcode(''), 500);
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      Alert.alert(
        'Product Not Found',
        `No product found with barcode: ${trimmedBarcode}\n\nError: ${error.message}\n\nPlease try again or add product manually.`,
        [{ text: 'OK' }]
      );
    }
  };

  // Barcode Get Handler - Main logic for manual barcode entry
  const handleBarcodeGet = async () => {
    if (!barcode.trim()) {
      Alert.alert('Error', 'Please enter or scan a barcode', [{ text: 'OK' }]);
      return;
    }

    await processBarcode(barcode);
  };


  const handleUpdateItemField = (itemId, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    });
    commitItems(updatedItems);
  };

  const handleAddAdjustment = (newAdjustment) => {
    setAdjustments([...adjustments, newAdjustment]);
    setShowAddAdjustmentModal(false);
    const amountType = newAdjustment.addAmount > 0 ? 'Add' : 'Less';
    const amount = newAdjustment.addAmount > 0 ? newAdjustment.addAmount : newAdjustment.lessAmount;
    Alert.alert(
      'Adjustment Added Successfully',
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

  const handleDeleteAdjustmentRow = (rowIndex) => {
    const adjustment = adjustments[rowIndex];
    if (adjustment) {
      handleDeleteAdjustment(adjustment.id);
    }
  };

  const handleAdjustmentTableCellChange = (rowIndex, field, value) => {
    const updatedAdjustments = adjustments.map((adj, index) => {
      if (index !== rowIndex) return adj;
      
      let parsedValue = value;
      if (field === 'addAmount' || field === 'lessAmount') {
        parsedValue = parseFloat(value) || 0;
      } else if (field === 'accountName') {
        // When account changes, update accountId and accountType
        const account = adjustmentsList.find(a => a.name === value);
        if (account) {
          return {
            ...adj,
            accountName: value,
            accountId: account.id,
            accountType: account.type,
            // Clear opposite amount based on account type
            ...(account.type === 'add' ? { lessAmount: 0 } : { addAmount: 0 }),
          };
        }
      }
      
      return { ...adj, [field]: parsedValue };
    });
    
    setAdjustments(updatedAdjustments);
  };

  const getInvoiceData = useCallback(() => ({
    title: 'Employee Sales Invoice',
    transactionDetails: transactionData,
    voucherDetails: voucherData,
    customerData: customerData,
    items: items,
    adjustments: adjustments,
    summary: summary,
    collections: {
      cash: parseFloat(collectedCash) || 0,
      card: parseFloat(collectedCard) || 0,
      upi: parseFloat(collectedUpi) || 0,
      balance:
        summary.totalBillValue -
        (parseFloat(collectedCash) || 0) -
        (parseFloat(collectedCard) || 0) -
        (parseFloat(collectedUpi) || 0),
    },
  }), [transactionData, voucherData, customerData, items, adjustments, summary, collectedCash, collectedCard, collectedUpi]);

  // Save invoice to backend API
  const handleSaveInvoice = async () => {
    // Validate required fields
    if (items.length === 0) {
      Alert.alert(
        'No Items',
        'Please add at least one item before saving the invoice.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!customerData.customerName || customerData.customerName.trim() === '') {
      Alert.alert(
        'Missing Customer',
        'Please select or enter a customer name before saving the invoice.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate voucher data - generate if missing
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const datetimeStr = `${dateStr} ${timeStr}`;

    // Ensure voucher data exists - validate and generate if missing
    let finalVoucherData = { ...voucherData };
    
    if (!finalVoucherData.voucherSeries || !finalVoucherData.voucherNo || !finalVoucherData.voucherDatetime) {
      // Generate fallback voucher data
      finalVoucherData = {
        voucherSeries: finalVoucherData.voucherSeries || 'ESI',
        voucherNo: finalVoucherData.voucherNo || `TEMP-${Date.now()}`,
        voucherDatetime: finalVoucherData.voucherDatetime || datetimeStr,
      };
      
      // Update state
      setVoucherData(finalVoucherData);
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsSavingInvoice(true);
    
    try {
      const invoiceData = getInvoiceData();
      
      // Validate required voucher fields one more time
      const voucherSeries = invoiceData.voucherDetails.voucherSeries;
      const voucherNo = invoiceData.voucherDetails.voucherNo;
      const voucherDatetime = invoiceData.voucherDetails.voucherDatetime;
      
      console.log('📋 Voucher data before save:', { voucherSeries, voucherNo, voucherDatetime });
      
      if (!voucherSeries || !voucherNo || !voucherDatetime) {
        console.error('❌ Missing voucher data:', { voucherSeries, voucherNo, voucherDatetime });
        throw new Error('Voucher information is missing. Please refresh the screen and try again.');
      }
      
      // Prepare data for API
      // For EmployeeSaleInvoiceScreen, backend will construct the full format: RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName}
      // Example: RS25-26PAT-Mo
      // The backend uses "RS" as fixed prefix and constructs the full format, so we just send "RS"
      const baseVoucherSeries = 'RS'; // Fixed prefix for EmployeeSaleInvoiceScreen
      
      const apiData = {
        invoiceID: savedInvoiceID, // Include invoiceID if updating existing invoice
        voucherSeries: baseVoucherSeries, // Send "RS" - backend will construct full format
        voucherNo: voucherNo,
        voucherDatetime: voucherDatetime,
        transactionDetails: {
          // transactionId and status removed - not stored in database
          date: invoiceData.transactionDetails.date,
          time: invoiceData.transactionDetails.time,
          branch: invoiceData.transactionDetails.branch,
          location: invoiceData.transactionDetails.location,
          employeeLocation: invoiceData.transactionDetails.employeeLocation, // Hidden from UI but kept in database
          username: invoiceData.transactionDetails.username,
        },
        header: {
          date: invoiceData.customerData.date,
          billerName: invoiceData.customerData.billerName,
          employeeName: invoiceData.customerData.employeeName,
          customerId: invoiceData.customerData.customerId,
          customerName: invoiceData.customerData.customerName || invoiceData.customerData.employeeName,
          readingA4: invoiceData.customerData.readingA4,
          readingA3: invoiceData.customerData.readingA3,
          machineType: invoiceData.customerData.machineType,
          remarks: invoiceData.customerData.remarks,
          gstBill: gstBill || false,
        },
        collections: invoiceData.collections,
        items: invoiceData.items.map((item, index) => ({
          sno: index + 1,
          productId: item.productId || null,
          productName: item.productName || '',
          barcode: item.barcode || '',
          productSerialNo: item.productSerialNo === null ? null : (item.productSerialNo || ''),
          quantity: item.quantity || 0,
          freeQty: item.freeQty || 0,
          rate: item.rate || 0,
          net: item.net || 0,
          comments1: item.comments1 || '',
        })),
        adjustments: invoiceData.adjustments.map((adj) => ({
          accountId: adj.accountId || null,
          accountName: adj.accountName || '',
          accountType: adj.accountType || 'add',
          addAmount: adj.addAmount || 0,
          lessAmount: adj.lessAmount || 0,
          comments: adj.comments || '',
        })),
        summary: invoiceData.summary,
      };

      console.log('📤 Sending invoice data:', { 
        invoiceID: savedInvoiceID, 
        voucherSeries, 
        voucherNo,
        hasInvoiceID: !!savedInvoiceID 
      });

      const result = await apiCall(API_ENDPOINTS.CREATE_INVOICE, {
        method: 'POST',
        body: JSON.stringify(apiData),
      });

      if (result.success) {
        // Mark invoice as saved and store invoice ID
        setIsInvoiceSaved(true);
        const newInvoiceID = result.data.invoiceID;
        setSavedInvoiceID(newInvoiceID); // Store invoice ID for future updates
        setHasPreviewed(false); // Reset preview flag after save
        
        const action = savedInvoiceID ? 'updated' : 'saved';
        console.log(`✅ Invoice ${action}: ID=${newInvoiceID}, Voucher=${result.data.voucherSeries}-${result.data.voucherNo}`);
        
        Alert.alert(
          'Success',
          `Invoice ${action} successfully!\n\nVoucher: ${result.data.voucherSeries}-${result.data.voucherNo}\nInvoice ID: ${result.data.invoiceID}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'Unknown error occurred';
      
      // Check for gateway errors (502, 503) - backend not reachable
      if (error.message.includes('502') || error.message.includes('503') || 
          error.message.includes('Backend server is not reachable')) {
        errorMessage = 
          'Cannot connect to backend server.\n\n' +
          'Please check:\n' +
          '1. Backend server is running (npm start in backend folder)\n' +
          '2. Ngrok tunnel is active (check ngrok terminal)\n' +
          '3. Restart ngrok if tunnel expired\n' +
          '4. Verify ngrok URL matches app.json config';
      } else if (error.message.includes('Network request failed') || 
                 error.message.includes('Cannot connect to server')) {
        errorMessage = 
          'Network connection failed.\n\n' +
          'Please check:\n' +
          '1. Your internet connection\n' +
          '2. Backend server is running\n' +
          '3. API URL is correct';
      }
      
      Alert.alert(
        'Save Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSavingInvoice(false);
    }
  };

  // Keep local draft save for offline support
  const { handleSave, isSaving } = useScreenDraft('EmployeeSaleInvoice', getInvoiceData, {
    successMessage: 'Employee sale invoice draft saved locally.',
  });

  // Combined save handler (local + API)
  const handleSaveCombined = async () => {
    // Prevent duplicate saves - check if already saving
    if (isSavingInvoice) {
      console.log('⚠️ Save already in progress, skipping duplicate save');
      Alert.alert(
        'Save In Progress',
        'A save operation is already in progress. Please wait for it to complete.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // If invoice is already saved, it will be updated (not duplicated)
    // No need to show confirmation - just update the existing record
    
    // Save locally first (for offline support)
    handleSave();
    // Then save to API
    await handleSaveInvoice();
  };

  // Handle exit with save reminder
  const handleExit = () => {
    // Check if there are unsaved changes
    const hasUnsavedChanges = items.length > 0 && !isInvoiceSaved;
    
    if (hasUnsavedChanges || hasPreviewed) {
      Alert.alert(
        'Unsaved Changes',
        hasPreviewed 
          ? 'You have previewed the invoice. Please save the invoice before exiting to ensure it is saved to the database.'
          : 'You have unsaved changes. Are you sure you want to exit without saving?',
        [
          { 
            text: 'Save & Exit', 
            onPress: async () => {
              try {
                await handleSaveCombined();
                // Reset flags after successful save
                setIsInvoiceSaved(true);
                setHasPreviewed(false);
                // Wait a moment for save to complete, then exit
                setTimeout(() => {
                  navigation.goBack();
                }, 500);
              } catch (error) {
                // If save fails, don't exit
                console.error('Save failed on exit:', error);
              }
            },
            style: 'default'
          },
          { 
            text: 'Exit Without Saving', 
            onPress: () => {
              setIsInvoiceSaved(false);
              setSavedInvoiceID(null); // Reset invoice ID
              setHasPreviewed(false);
              navigation.goBack();
            },
            style: 'destructive'
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      // No unsaved changes, allow normal exit
      navigation.goBack();
    }
  };

  const itemColumns = [
    { key: 'sno', label: 'S.No', width: 70, editable: false },
    { key: 'barcode', label: 'Barcode', width: 150 },
    { key: 'productName', label: 'Product / Description', width: 200 },
    { key: 'productSerialNo', label: 'Product Serial No', width: 160 },
    { key: 'quantity', label: 'Qty', width: 90, keyboardType: 'numeric' },
    { key: 'freeQty', label: 'Free Qty', width: 100, keyboardType: 'numeric' },
    { key: 'rate', label: 'Rate', width: 110, keyboardType: 'numeric' },
    { key: 'net', label: 'Net Amount', width: 130, keyboardType: 'numeric', editable: false },
    { key: 'comments1', label: 'Comments1', width: 150 },
  ];

  const adjustmentColumns = [
    { key: 'sno', label: 'S.No', width: 70, editable: false },
    { 
      key: 'accountName', 
      label: 'Account', 
      width: 200, 
      type: 'dropdown',
      options: adjustmentsList.map(acc => ({ label: acc.name, value: acc.name })),
    },
    { key: 'addAmount', label: 'Add', width: 120, keyboardType: 'numeric' },
    { key: 'lessAmount', label: 'Less', width: 120, keyboardType: 'numeric' },
    { key: 'comments', label: 'Comments1', width: 200 },
  ];

  const handleItemTableCellChange = (rowIndex, field, value) => {
    // Special handling for productSerialNo: Manual entry always adds new row
    if (field === 'productSerialNo' && value && value.trim() !== '') {
      const trimmedSerialNo = value.trim().toUpperCase();
      const currentItem = items[rowIndex];
      
      // Manual entry of productSerialNo → Always add new row (Case 1 logic)
      console.log(`✅ Manual entry of serial number - Adding new row`);
      const newItem = {
        id: Date.now(),
        productId: currentItem.productId || null,
        productName: currentItem.productName || '',
        barcode: currentItem.barcode || '',
        quantity: 1,
        rate: currentItem.rate || 0,
        net: currentItem.rate || 0,
        comments1: currentItem.comments1 || '',
        freeQty: currentItem.freeQty || '',
        productSerialNo: trimmedSerialNo,
      };
      
      commitItems([...items, newItem]);
      
      Alert.alert(
        'New Item Added',
        `Serial No: ${trimmedSerialNo}\nAdded as new row\n\nSerial number entered - added as new row`,
        [{ text: 'OK' }]
      );
      return;
    }

    // For all other fields, update normally
    const updatedItems = items.map((item, index) => {
      if (index !== rowIndex) return item;
      let parsedValue = value;
      if (field === 'quantity' || field === 'rate') {
        parsedValue = Number(value) || 0;
        // Recalculate net when quantity or rate changes
        const quantity = field === 'quantity' ? parsedValue : item.quantity;
        const rate = field === 'rate' ? parsedValue : item.rate;
        const net = quantity * rate;
        return { ...item, [field]: parsedValue, net };
      }
      return { ...item, [field]: parsedValue };
    });
    commitItems(updatedItems);
  };

  const handleDeleteItemRow = (rowIndex) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedItems = items.filter((_, index) => index !== rowIndex);
            commitItems(updatedItems);
          },
        },
      ]
    );
  };

  const summaryFields = [
    { label: 'Item Count', value: summary.itemCount, editable: false },
    { label: 'Total Quantity', value: summary.totalQty, editable: false },
    { label: 'Total Gross', value: summary.totalGross.toFixed(2), editable: false },
    { label: 'Total Discount', value: summary.totalDiscount.toFixed(2), editable: false },
    { label: 'Total Add', value: summary.totalAdd.toFixed(2), editable: false },
    { label: 'Total Less', value: summary.totalLess.toFixed(2), editable: false },
    { label: 'Bill Value', value: summary.totalBillValue.toFixed(2), editable: false },
    { label: 'Ledger Balance', value: summary.ledgerBalance.toFixed(2), editable: false },
  ];

  const handlePreviewInvoice = () => {
    // Validate required fields before preview
    if (items.length === 0) {
      Alert.alert(
        'No Items',
        'Please add at least one item to preview the invoice.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!customerData.customerName || customerData.customerName.trim() === '') {
      Alert.alert(
        'Missing Customer',
        'Please select or enter a customer name before previewing the invoice.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Mark that user has previewed
    setHasPreviewed(true);
    setShowPDFPreview(true);
  };

  const handleSendWhatsApp = async () => {
    if (items.length === 0) {
      Alert.alert(
        'No Items',
        'Please add at least one item before sending the invoice.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (!customerData.whatsappNo) {
      Alert.alert(
        'WhatsApp Number Required',
        'Please add a customer with a WhatsApp number to send via WhatsApp.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      // Generate PDF and share via WhatsApp
      const { uri } = await generateInvoicePDF(getInvoiceData());
      await sharePDFViaWhatsApp(uri, customerData.whatsappNo);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      Alert.alert('Error', 'Failed to send via WhatsApp. Please try again.');
    }
  };

  const handleSendSMS = async () => {
    if (!customerData.mobileNo) {
      Alert.alert(
        'Mobile Number Required',
        'Please add a customer with a mobile number to open SMS.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      // Open SMS directly with the contact number
      await openSMSContact(customerData.mobileNo);
    } catch (error) {
      console.error('Error opening SMS:', error);
      Alert.alert('Error', 'Failed to open SMS. Please try again.');
    }
  };


  return (
    <>
    <SmartSuiteFormScreen
      title="EMPLOYEE SALE INVOICE"
      summaryFields={summaryFields}
      onPreview={handlePreviewInvoice}
      onWhatsApp={handleSendWhatsApp}
      onSMS={handleSendSMS}
      actionBarActions={{ 
        onSave: handleSaveCombined,
        onClose: handleExit
      }}
      isSaving={isSaving || isSavingInvoice}
    >

      <AccordionSection title="TRANSACTION DETAILS" defaultExpanded={true}>
        
        {/* Date and Time */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={transactionData.date}
                onChangeText={(value) => handleTransactionChange('date', value)}
                placeholder="Enter date"
              />
            ) : (
              <View style={styles.displayBox}>
                <Text style={styles.displayText}>{transactionData.date}</Text>
              </View>
            )}
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Time</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={transactionData.time}
                onChangeText={(value) => handleTransactionChange('time', value)}
                placeholder="Enter time"
              />
            ) : (
              <View style={styles.displayBox}>
                <Text style={styles.displayText}>{getDisplayTime(transactionData.time)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Branch */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Branch</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={transactionData.branch}
              onChangeText={(value) => handleTransactionChange('branch', value)}
              placeholder="Enter branch"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {transactionData.branch || 'Loading...'}
              </Text>
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Location</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={transactionData.location}
              onChangeText={(value) => handleTransactionChange('location', value)}
              placeholder="Enter location"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {transactionData.location || 'Loading...'}
              </Text>
            </View>
          )}
        </View>

        {/* Username */}
        {/* Employee Location is hidden from UI but kept in database */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Username</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={transactionData.username}
              onChangeText={(value) => handleTransactionChange('username', value)}
              placeholder="Enter username"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {transactionData.username || 'Loading...'}
              </Text>
            </View>
          )}
        </View>
      </AccordionSection>

      <AccordionSection title="VOUCHER" defaultExpanded={true}>
        
        {/* Voucher Series, No, Datetime */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Voucher Series</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={voucherData.voucherSeries}
                onChangeText={(value) => setVoucherData({ ...voucherData, voucherSeries: value })}
                placeholder="Enter voucher series"
              />
            ) : (
              <View style={styles.displayBox}>
                <Text style={styles.displayText}>{voucherData.voucherSeries}</Text>
              </View>
            )}
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Voucher No</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={voucherData.voucherNo}
                onChangeText={(value) => setVoucherData({ ...voucherData, voucherNo: value })}
                placeholder="Enter voucher number"
              />
            ) : (
              <View style={styles.displayBox}>
                <Text style={styles.displayText}>{voucherData.voucherNo}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Voucher Datetime</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={voucherData.voucherDatetime}
              onChangeText={(value) => setVoucherData({ ...voucherData, voucherDatetime: value })}
              placeholder="Enter voucher datetime"
            />
          ) : (
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>
                {voucherData.voucherDatetime 
                  ? (() => {
                      // Extract date from voucherDatetime and combine with transaction time
                      const dateMatch = voucherData.voucherDatetime.match(/^(\d{2}\/\d{2}\/\d{4})/);
                      const date = dateMatch ? dateMatch[1] : transactionData.date || '';
                      const time = getDisplayTime(transactionData.time);
                      return date ? `${date} ${time}` : voucherData.voucherDatetime;
                    })()
                  : `${transactionData.date || ''} ${getDisplayTime(transactionData.time)}`}
              </Text>
            </View>
          )}
        </View>
      </AccordionSection>

      <AccordionSection title="HEADER" defaultExpanded={true}>
        
        {/* Date and Biller Name */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={customerData.date}
                onChangeText={(value) => handleInputChange('date', value)}
                placeholder="Enter date"
              />
            ) : (
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>
                  {customerData.date || 'Loading...'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Biller Name</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={customerData.billerName}
                onChangeText={(value) => handleInputChange('billerName', value)}
                placeholder="Enter biller name"
              />
            ) : (
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>
                  {customerData.billerName || 'Loading...'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Employee Name */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Employee Name</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={customerData.employeeName || customerData.party}
              onChangeText={(value) => {
                handleInputChange('employeeName', value);
                handleInputChange('party', value);
              }}
              placeholder="Enter employee name"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {customerData.employeeName || customerData.party || 'Loading...'}
              </Text>
            </View>
          )}
        </View>

        {/* Customer ID with QR Scanner */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Customer ID</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={customerData.customerId}
              onChangeText={(value) => handleInputChange('customerId', value)}
              placeholder="Enter customer ID"
            />
          ) : (
            <>
              <View style={styles.inputWithIcon}>
                <View style={[styles.input, styles.readOnlyInput, { flex: 1, marginRight: 8 }]}>
                  {isLoadingCustomer ? (
                    <ActivityIndicator size="small" color="#2196F3" />
                  ) : (
                  <Text style={styles.readOnlyText}>
                    {customerData.customerId || 'Scan QR Code to load customer'}
                  </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowScanner(true)}
                  disabled={isLoadingCustomer}
                >
                  <MaterialIcons name="qr-code-scanner" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, { marginLeft: 4, backgroundColor: '#30302d' }]}
                  onPress={() => setShowMobileSearchModal(true)}
                  disabled={isLoadingCustomer}
                >
                  <MaterialIcons name="search" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                {isLoadingCustomer ? 'Loading customer...' : 'Scan QR or use search icon to search by mobile number'}
              </Text>
            </>
          )}
        </View>

        {/* Customer Name */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Customer Name</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={customerData.customerName}
              onChangeText={(value) => handleInputChange('customerName', value)}
              placeholder="Enter customer name"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {customerData.customerName || 'filled from QR'}
              </Text>
            </View>
          )}
        </View>

        {/* Mobile No and WhatsApp No */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Mobile No</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={customerData.mobileNo}
                onChangeText={(value) => handleInputChange('mobileNo', value)}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
              />
            ) : (
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>
                  {customerData.mobileNo || 'From QR'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>WhatsApp No</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={customerData.whatsappNo}
                onChangeText={(value) => handleInputChange('whatsappNo', value)}
                placeholder="Enter WhatsApp number"
                keyboardType="phone-pad"
              />
            ) : (
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>
                  {customerData.whatsappNo || 'From QR'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Customer Type */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Customer Type</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={customerData.customerType}
              onChangeText={(value) => handleInputChange('customerType', value)}
              placeholder="Enter customer type"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {customerData.customerType || 'From QR code'}
              </Text>
            </View>
          )}
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

        {/* Machine Type */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Machine Type</Text>
          <TextInput
            style={styles.input}
            value={customerData.machineType}
            onChangeText={(value) => handleInputChange('machineType', value)}
            placeholder="Enter machine type"
          />
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
      </AccordionSection>

      <AccordionSection title="ITEM BODY" defaultExpanded={true}>
        
        {/* Barcode Input (Integrated into ITEM BODY) */}
        <View style={styles.barcodeSection}>
          <Text style={styles.label}>Barcode</Text>
          <View style={styles.barcodeInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Enter or Scan"
            />
            <TouchableOpacity
              style={styles.scanBarcodeButton}
              onPress={() => setShowBarcodeScanner(true)}
            >
              <Image
                source={require('../../assets/barcode-scanner.png')}
                style={styles.barcodeScannerIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.getButton}
              onPress={handleBarcodeGet}
            >
              <Text style={styles.getButtonText}>Get</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Scan barcode with camera or enter manually, then click "Get" to add/update item.
          </Text>
        </View>

        <ItemTable
          columns={itemColumns}
          data={items}
          onDeleteRow={handleDeleteItemRow}
          onCellChange={handleItemTableCellChange}
        />

        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No items added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Scan a barcode to add items
            </Text>
          </View>
        )}
      </AccordionSection>

      <AccordionSection title="ADJUSTMENTS" defaultExpanded={true}>
        <ItemTable
          columns={adjustmentColumns}
          data={adjustments.map((adj, index) => ({
            ...adj,
            sno: String(index + 1),
          }))}
          onAddRow={() => setShowAddAdjustmentModal(true)}
          onDeleteRow={handleDeleteAdjustmentRow}
          onCellChange={handleAdjustmentTableCellChange}
        />
      </AccordionSection>

      {/* SUMMARY SECTION removed in favor of SmartSuite summary */}

      <AccordionSection title="COLLECTIONS" defaultExpanded={true}>
        
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
      </AccordionSection>

    </SmartSuiteFormScreen>

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


    <AddAdjustmentModal
      isVisible={showAddAdjustmentModal}
      onAddAdjustment={handleAddAdjustment}
      onClose={() => setShowAddAdjustmentModal(false)}
    />

    <PDFPreviewModal
      isVisible={showPDFPreview}
      onClose={() => {
        setShowPDFPreview(false);
        // Show reminder to save after previewing
        if (hasPreviewed && !isInvoiceSaved && !isSavingInvoice) {
          setTimeout(() => {
            Alert.alert(
              'Reminder: Save Invoice',
              'You have previewed the invoice. Please remember to click the "Save" button to save the invoice to the database.',
              [
                { 
                  text: 'Save Now', 
                  onPress: async () => {
                    // Prevent duplicate saves - check flags before saving
                    if (!isSavingInvoice && !isInvoiceSaved) {
                      await handleSaveCombined();
                    } else if (isInvoiceSaved) {
                      Alert.alert(
                        'Already Saved',
                        'This invoice has already been saved.',
                        [{ text: 'OK' }]
                      );
                    }
                  }, 
                  style: 'default' 
                },
                { text: 'Later', style: 'cancel' }
              ]
            );
          }, 500);
        }
      }}
      invoiceData={getInvoiceData()}
    />

    <SerialNoSelectionModal
      isVisible={showSerialNoModal}
      onClose={() => {
        setShowSerialNoModal(false);
        setIssuedProductsData(null);
        setPendingProductData(null);
      }}
      productName={pendingProductData?.product?.name || ''}
      issuedProducts={issuedProductsData || []}
      existingItems={items}
      onConfirm={(newSerialNos, removeSerialNos = []) => {
        if (!pendingProductData) return;
        
        const { product, barcode } = pendingProductData;
        
        // Add new items
        const itemsToAdd = newSerialNos.map((serialNo) => {
          // Find the issued product data for this serial number
          const issuedProduct = issuedProductsData.find(
            ip => ip.productSerialNo === serialNo
          );
          
          return {
            id: Date.now() + Math.random(), // Unique ID
            productId: product.id,
            productName: product.name,
            barcode: barcode || '',
            quantity: issuedProduct?.quantity || 1,
            rate: product.rate || 0, // Rate is 0, user will enter manually
            net: 0, // Will be recalculated when rate is entered
            comments1: '',
            freeQty: '',
            productSerialNo: serialNo,
          };
        });
        
        // Remove items with selected serial numbers
        const updatedItems = items.filter(item => {
          // Keep items that don't have a serial number to remove
          if (!item.productSerialNo) return true;
          // Remove items whose serial number is in the remove list
          return !removeSerialNos.includes(item.productSerialNo.trim());
        });
        
        // Add new items
        commitItems([...updatedItems, ...itemsToAdd]);
        
        // Show appropriate message
        let message = '';
        if (itemsToAdd.length > 0 && removeSerialNos.length > 0) {
          message = `${itemsToAdd.length} item(s) added and ${removeSerialNos.length} item(s) removed`;
        } else if (itemsToAdd.length > 0) {
          message = `${itemsToAdd.length} item(s) added with selected Serial Numbers`;
        } else if (removeSerialNos.length > 0) {
          message = `${removeSerialNos.length} item(s) removed`;
        }
        
        Alert.alert(
          'Items Updated',
          message,
          [{ text: 'OK' }]
        );
        
        setShowSerialNoModal(false);
        setIssuedProductsData(null);
        setPendingProductData(null);
      }}
    />

    <MobileSearchModal
      isVisible={showMobileSearchModal}
      onSearch={handleSearchByMobile}
      onClose={() => setShowMobileSearchModal(false)}
    />
    </>
  );
};

// Mobile Search Modal Component (Inline)
const MobileSearchModal = ({ isVisible, onSearch, onClose }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!mobileNumber || mobileNumber.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile or WhatsApp number');
      return;
    }

    setIsSearching(true);
    setError('');
    
    try {
      await onSearch(mobileNumber);
      // Only clear if search was successful (modal will close)
    setMobileNumber('');
    } catch (error) {
      // Error is handled in parent component, but show it here too
      setError(error.message || 'Failed to search customer');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={mobileSearchStyles.modalOverlay}>
        <View style={mobileSearchStyles.modalContainer}>
          <Text style={mobileSearchStyles.modalTitle}>Search Customer by Mobile/WhatsApp Number</Text>
          <Text style={mobileSearchStyles.modalSubtitle}>
            Enter mobile or WhatsApp number to fetch customer details from database
          </Text>

          <TextInput
            style={[mobileSearchStyles.input, error && mobileSearchStyles.inputError]}
            value={mobileNumber}
            onChangeText={(text) => {
              setMobileNumber(text);
              setError(''); // Clear error when user types
            }}
            placeholder="Enter mobile or WhatsApp number"
            keyboardType="phone-pad"
            maxLength={10}
            autoFocus
            editable={!isSearching}
          />

          {error ? (
            <Text style={mobileSearchStyles.errorText}>{error}</Text>
          ) : null}

          <View style={mobileSearchStyles.buttonRow}>
            <TouchableOpacity
              style={[mobileSearchStyles.button, mobileSearchStyles.cancelButton]}
              onPress={() => {
                setMobileNumber('');
                setError('');
                onClose();
              }}
              disabled={isSearching}
            >
              <Text style={mobileSearchStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                mobileSearchStyles.button, 
                mobileSearchStyles.searchButton,
                isSearching && mobileSearchStyles.searchButtonDisabled
              ]}
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
              <Text style={mobileSearchStyles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const mobileSearchStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#9e9e9e',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(240, 240, 240, 0.6)',
    color: '#000',
    fontWeight: '600',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: '#d32f2f',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 235, 238, 0.6)',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 10,
    paddingHorizontal: 4,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: 'rgb(89, 87, 87)',
    borderWidth: 1,
    borderColor: '#9e9e9e',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#388E3C',
  },
  searchButtonDisabled: {
    backgroundColor: '#81C784',
    opacity: 0.7,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    padding: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 2.5,
    borderBottomColor: '#1976D2',
    letterSpacing: 0.5,
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
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgb(255, 255, 255)',
    borderWidth: 1,
    borderColor: '#9e9e9e',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  readOnlyInput: {
    backgroundColor: 'rgba(236, 239, 241, 0.85)',
    borderColor: '#B0B0B0',
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
    fontStyle: 'normal',
  },
  helperText: {
    fontSize: 10,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  displayBox: {
    backgroundColor: 'rgba(236, 239, 241, 0.85)',
    borderWidth: 1,
    borderColor: '#B0B0B0',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  displayText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderRadius: 6,
    backgroundColor: 'rgba(240, 240, 240, 0.6)',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    backgroundColor: '#1976D2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    color: '#1976D2',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
  },
  barcodeSection: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(167, 200, 238, 0.42)',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#567cb3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  barcodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  scanBarcodeButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  barcodeScannerIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  getButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  getButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25, 118, 210, 0.85)',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 0,
    marginBottom: 0,
    elevation: 2,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E3F2FD',
    alignItems: 'center',
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  itemCell: {
    fontSize: 12,
    color: '#0D47A1',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  deleteIcon: {
    fontSize: 22,
    textAlign: 'center',
    color: '#D32F2F',
    padding: 4,
  },
  adjustmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(227, 242, 253, 0.5)',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#BBDEFB',
    alignItems: 'center',
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  adjustmentCell: {
    fontSize: 12,
    color: '#1565C0',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#90CAF9',
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#BBDEFB',
    marginTop: 4,
    fontWeight: '500',
  },
  extendedFieldsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2.5,
    borderTopColor: '#E0E0E0',
  },
  extendedFieldsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  extendedFieldsContainer: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: 'rgba(240, 240, 240, 0.4)',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  extendedFieldsLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  summaryGrid: {
    backgroundColor: '#2A3B4D',
    padding: 18,
    borderRadius: 0,
    borderWidth: 0,
    elevation: 4,
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(187, 222, 251, 0.2)',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#BBDEFB',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  totalRow: {
    backgroundColor: 'rgba(25, 118, 210, 0.2)',
    marginTop: 12,
    borderRadius: 0,
    borderBottomWidth: 0,
    borderWidth: 0,
    borderTopWidth: 2,
    borderTopColor: 'rgba(187, 222, 251, 0.4)',
    paddingTop: 16,
    paddingBottom: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  totalValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  balanceText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(76, 175, 80, 0.5)',
  },
});

export default withScreenPermission('EmployeeSaleInvoice')(EmployeeSaleInvoiceScreen);
