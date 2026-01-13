import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import SmartSuiteFormScreen from '../components/SmartSuiteFormScreen';
import AccordionSection from '../components/AccordionSection';
import ItemTable from '../components/ItemTable';
import QRScannerModal from '../components/QRScannerModal';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import AddAdjustmentModal from '../components/AddAdjustmentModal';
import PDFPreviewModal from '../components/PDFPreviewModal';
import SerialNoSelectionModal from '../components/SerialNoSelectionModal';
import { branches, employeeUsernames, productOptions, adjustmentAccounts, machineTypes, adjustmentsList, initialCustomer } from '../data/mockData';
import { sharePDFViaWhatsApp, sharePDFViaSMS, generateInvoicePDF } from '../utils/pdfUtils';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { useAuth } from '../context/AuthContext';
import useScreenDraft from '../hooks/useScreenDraft';
import withScreenPermission from '../components/withScreenPermission';
import { getBranchShortName } from '../utils/branchMapping';
import { getDisplayTime } from '../utils/timeUtils';

const RentalServiceScreen = () => {
  const { currentUser } = useAuth();
  const navigation = useNavigation();

  // Transaction state
  const [transactionData, setTransactionData] = useState({
    date: '',
    time: '',
    branch: '',
    location: '',
    username: '',
  });

  // Voucher state
  const [voucherData, setVoucherData] = useState({
    voucherSeries: '',
    voucherNo: '',
    voucherDatetime: '',
  });

  // Check if user is supervisor - supervisors get blank, editable fields
  const isSupervisor = currentUser?.role === 'supervisor';

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
  const [gstBill, setGstBill] = useState(isSupervisor ? false : (initialCustomer.gstBill || false));
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
  const [savedInvoiceID, setSavedInvoiceID] = useState(null);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  // Readings state - use blank values for supervisors
  const [readings, setReadings] = useState(
    isSupervisor
      ? { in: '', out: '', testedCopies: '', ia4: '', a4: '', a4Copies: '', ia3: '', a3: '', a3Copies: '' }
      : { in: '0', out: '0', testedCopies: '0', ia4: '0', a4: '0', a4Copies: '0', ia3: '0', a3: '0', a3Copies: '0' }
  );

  // Barcode state
  const [barcode, setBarcode] = useState('0');

  // Auto-populate executive data on mount and when screen comes into focus
  // This ensures we always have the latest LastVoucherNumber and correct voucher format when navigating between screens
  useFocusEffect(
    useCallback(() => {
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
          
          setReadings({
            in: '',
            out: '',
            testedCopies: '',
            ia4: '',
            a4: '',
            a4Copies: '',
            ia3: '',
            a3: '',
            a3Copies: '',
          });
          
          setGstBill(false);
          return;
        }
        
        if (currentUser?.username) {
          try {
            // Clear voucher data first to avoid showing stale data
            setVoucherData({
              voucherSeries: '',
              voucherNo: '',
              voucherDatetime: '',
            });
            
            console.log(`🔍 Fetching executive data for RentalService - username: ${currentUser.username}`);

            // Pass screen=RentalService to get correct voucher format (RS-25PAT-Mo)
            const apiEndpoint = API_ENDPOINTS.GET_EXECUTIVE_DATA(currentUser.username, 'RentalService');
            console.log(`   API Endpoint URL: ${apiEndpoint}`);
            console.log(`   Screen parameter should be: "RentalService"`);
            
            const result = await apiCall(apiEndpoint);

            console.log(`📥 Executive data response:`, result);
            console.log(`   Voucher series in response: ${result.data?.voucherDetails?.voucherSeries}`);

          if (result.success && result.data) {
            const execData = result.data;

            // Populate transaction details
            setTransactionData({
              date: execData.transactionDetails?.date || '',
              time: execData.transactionDetails?.time || '',
              branch: execData.transactionDetails?.branch || '',
              location: execData.transactionDetails?.location || '',
              username: currentUser.username,
            });

            // Populate customer data with employee info
            setCustomerData(prev => ({
              ...prev,
              date: execData.transactionDetails?.date || prev.date,
              billerName: execData.header?.billerName || prev.billerName,
              employeeName: execData.header?.employeeName || currentUser.username,
              party: execData.header?.party || currentUser.username,
            }));

            // Populate voucher details - backend should return RS-25PAT-Mo format for RentalService
            const voucherSeries = execData.voucherDetails?.voucherSeries || 'RS';
            const voucherNo = execData.voucherDetails?.voucherNo || '';
            const voucherDatetime = execData.voucherDetails?.voucherDatetime || '';

            console.log(`📋 Voucher series received from API: "${voucherSeries}"`);
            console.log(`   Expected format: RS-{Year}{Branch}-{Employee} (e.g., RS-25PAT-Mo)`);
            console.log(`   Received format: ${voucherSeries}`);

            if (!voucherSeries || !voucherNo || !voucherDatetime) {
              console.warn('⚠️ Incomplete voucher data from API:', execData.voucherDetails);
              const now = new Date();
              const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const datetimeStr = `${dateStr} ${timeStr}`;

              setVoucherData({
                voucherSeries: 'RS',
                voucherNo: `TEMP-${Date.now()}`,
                voucherDatetime: datetimeStr,
              });
            } else {
              console.log(`✅ Setting voucher data: series="${voucherSeries}", no="${voucherNo}", datetime="${voucherDatetime}"`);
              
              // Validate the format - should be RS-{Year}{Branch}-{Employee} for RentalService
              if (!voucherSeries.startsWith('RS-')) {
                console.error(`❌ ERROR: Voucher series format is incorrect!`);
                console.error(`   Expected: RS-{Year}{Branch}-{Employee} (e.g., RS-25PAT-Mo)`);
                console.error(`   Received: ${voucherSeries}`);
                console.error(`   This indicates the backend is not detecting RentalService screen correctly.`);
              }
              
              setVoucherData({
                voucherSeries: voucherSeries,
                voucherNo: voucherNo,
                voucherDatetime: voucherDatetime,
              });
              console.log(`   Voucher data set successfully`);
            }
          }
        } catch (error) {
          console.error('Error loading executive data:', error);
          // Use fallback values if API fails
          if (currentUser?.username) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const datetimeStr = `${dateStr} ${timeStr}`;

            setTransactionData({
              date: dateStr,
              time: timeStr,
              branch: 'Head Office',
              location: 'Default Location',
              username: currentUser.username,
            });

            setCustomerData(prev => ({
              ...prev,
              date: dateStr,
              employeeName: currentUser.username,
              party: currentUser.username,
            }));

            setVoucherData({
              voucherSeries: 'RS',
              voucherNo: `TEMP-${Date.now()}`,
              voucherDatetime: datetimeStr,
            });
          }
        }
      }
      };

      loadExecutiveData();
    }, [currentUser?.username, isSupervisor])
  );

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

  // Items state
  const [items, setItems] = useState([]);

  // Normalize items helper function
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

  // Commit items helper function
  const commitItems = (list) => {
    setItems(normalizeItems(list));
  };

  // Adjustments state
  const [adjustments, setAdjustments] = useState([]);

  // Calculate summary whenever items or adjustments change
  useEffect(() => {
    calculateSummary();
  }, [items, adjustments]);

  const calculateSummary = () => {
    const itemCount = items.length;
    const totalQty = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0) + (parseInt(item.freeQty) || 0), 0);
    const itemsGross = items.reduce((sum, item) => sum + (parseFloat(item.net) || 0), 0);

    const totalAdd = adjustments.reduce((sum, adj) => sum + (parseFloat(adj.addAmount) || 0), 0);
    const totalLess = adjustments.reduce((sum, adj) => sum + (parseFloat(adj.lessAmount) || 0), 0);

    const totalGross = itemsGross;
    const totalDiscount = 0;
    const totalBillValue = totalGross + totalAdd - totalLess;
    const ledgerBalance = 0;

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

  // Handle QR code scanned
  const handleScannedQr = async (data) => {
    console.log('QR Data received:', data);
    setIsLoadingCustomer(true);
    setShowScanner(false);
    
    try {
      const trimmedData = data.trim();
      let customerFound = false;
      
      try {
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
            employeeName: prev.employeeName,
            party: prev.party || prev.employeeName,
          }));
          
          Alert.alert(
            'Customer Details Loaded! ✓',
            `Customer ID: ${customer.CustomerID}\nName: ${customer.CustomerName}\nMobile: ${customer.MobileNo}\nType: ${customer.CustomerType}`,
            [{ text: 'OK' }]
          );
          customerFound = true;
        }
      } catch (error) {
        console.log('CustomerID lookup failed:', error.message);
        if (error.message.includes('Cannot connect to server')) {
          throw error;
        }
      }
      
      if (!customerFound) {
        const parts = trimmedData.split(',');
        let mobileNo = parts.length >= 2 ? parts[1]?.trim() : trimmedData;
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
                employeeName: prev.employeeName,
                party: prev.party || prev.employeeName,
              }));
              Alert.alert(
                'Customer Details Loaded! ✓',
                `Customer ID: ${customer.CustomerID}\nName: ${customer.CustomerName}\nMobile: ${customer.MobileNo}\nType: ${customer.CustomerType}`,
                [{ text: 'OK' }]
              );
              customerFound = true;
            }
          } catch (error) {
            console.error('Mobile number lookup failed:', error.message);
            if (error.message.includes('Cannot connect to server')) {
              throw error;
            }
          }
        }
      }
      
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

  // Handle mobile number search
  const handleSearchByMobile = async (mobileNumber) => {
    if (!mobileNumber || mobileNumber.trim().length < 10) {
      throw new Error('Please enter a valid 10-digit mobile or WhatsApp number');
    }

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
          employeeName: prev.employeeName,
          party: prev.party || prev.employeeName,
        }));

        setShowMobileSearchModal(false);

        Alert.alert(
          'Customer Found! ✓',
          `Customer ID: ${customer.CustomerID}\nName: ${customer.CustomerName}\nMobile: ${customer.MobileNo}\nType: ${customer.CustomerType}`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Customer not found in database');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  // Handle scanned barcode from camera
  const handleScannedBarcode = (scannedData) => {
    console.log('Barcode scanned from camera:', scannedData);
    setShowBarcodeScanner(false);
    setBarcode(scannedData);
    setTimeout(async () => {
      await processBarcode(scannedData);
    }, 100);
  };

  // Barcode processing logic - Fetches product from API
  const processBarcode = async (barcodeData) => {
    if (!barcodeData || !barcodeData.trim()) {
      Alert.alert('Error', 'Invalid barcode data', [{ text: 'OK' }]);
      return;
    }

    const trimmedBarcode = barcodeData.trim();
    console.log(`Processing barcode: ${trimmedBarcode}`);

    try {
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

      if (product.hasUniqueSerialNo) {
        const employeeName = customerData.employeeName || transactionData?.username || '';
        
        if (employeeName) {
          try {
            const issuedResult = await apiCall(
              API_ENDPOINTS.GET_ISSUED_PRODUCTS_BY_BARCODE(trimmedBarcode, employeeName)
            );
            
            if (issuedResult.success && issuedResult.data?.issuedProducts) {
              const products = issuedResult.data.issuedProducts || [];
              setPendingProductData({ product, barcode: trimmedBarcode, result });
              setIssuedProductsData(products);
              setTimeout(() => setShowSerialNoModal(true), 100);
              setTimeout(() => setBarcode(''), 500);
              return;
            }
          } catch (error) {
            console.log('Could not fetch issued products, proceeding with normal flow:', error.message);
          }
        }
        
        const serialNo = result.data.productSerialNo || trimmedBarcode;
        const newItem = {
          id: Date.now(),
          productId: product.id,
          productName: product.name,
          barcode: trimmedBarcode,
          quantity: 1,
          rate: product.rate || 0,
          net: product.rate || 0,
      comments1: '',
          freeQty: 0,
          productSerialNo: serialNo,
        };
        
        commitItems([...items, newItem]);
        
        Alert.alert(
          'New Item Added! ✓',
          `${product.name}\nSerial No: ${serialNo}\nRate: ₹${(product.rate || 0).toFixed(2)}`,
          [{ text: 'OK' }]
        );
      } else {
        const existingProductIndex = items.findIndex(
          (item) => item.productId === product.id && 
                    (item.productSerialNo === null || item.productSerialNo === undefined || item.productSerialNo === '')
        );

        if (existingProductIndex !== -1) {
          const updatedItems = [...items];
          const existingItem = { ...updatedItems[existingProductIndex] };
          existingItem.quantity += 1;
          existingItem.productSerialNo = null;
          existingItem.net = existingItem.quantity * existingItem.rate;
          updatedItems[existingProductIndex] = existingItem;
          commitItems(updatedItems);
          
          Alert.alert(
            'Quantity Updated! ✓',
            `${product.name}\nBarcode: ${trimmedBarcode}\nNew Qty: ${existingItem.quantity}`,
            [{ text: 'OK' }]
          );
        } else {
          const newItem = {
            id: Date.now(),
            productId: product.id,
            productName: product.name,
            barcode: trimmedBarcode,
            quantity: 1,
            rate: product.rate || 0,
            net: product.rate || 0,
            comments1: '',
            freeQty: 0,
            productSerialNo: null,
          };
          
          commitItems([...items, newItem]);
          
          Alert.alert(
            'New Item Added! ✓',
            `${product.name}\nBarcode: ${trimmedBarcode}\nRate: ₹${(product.rate || 0).toFixed(2)}`,
            [{ text: 'OK' }]
          );
        }
      }

      setTimeout(() => setBarcode(''), 500);
    } catch (error) {
      console.error('Error fetching product by barcode:', error);
      Alert.alert(
        'Product Not Found',
        `No product found with barcode: ${trimmedBarcode}\n\nError: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Barcode Get Handler
  const handleBarcodeGet = async () => {
    if (!barcode.trim()) {
      Alert.alert('Error', 'Please enter or scan a barcode', [{ text: 'OK' }]);
      return;
    }
    await processBarcode(barcode);
  };

  // Handle add adjustment from modal
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

  const itemColumns = [
    { key: 'sno', label: 'S.No', width: 60, editable: false },
    { key: 'barcode', label: 'Barcode', width: 120 },
    { key: 'productName', label: 'Product/Description', width: 200 },
    { key: 'productSerialNo', label: 'ProductSerialNo', width: 130 },
    { key: 'quantity', label: 'Qty', width: 80, keyboardType: 'numeric' },
    { key: 'freeQty', label: 'FreeQty', width: 100, keyboardType: 'numeric' },
    { key: 'rate', label: 'Rate', width: 100, keyboardType: 'numeric' },
    { key: 'net', label: 'Net amount', width: 120, keyboardType: 'numeric', editable: false },
    { key: 'comments1', label: 'Comments1', width: 120 },
  ];

  const adjustmentColumns = [
    { key: 'sno', label: 'S.No', width: 60, editable: false },
    { key: 'accountName', label: 'Account', width: 200, type: 'dropdown', options: adjustmentsList.map(a => ({ label: a.name, value: a.name })) },
    { key: 'addAmount', label: 'Add', width: 120, keyboardType: 'numeric' },
    { key: 'lessAmount', label: 'Less', width: 120, keyboardType: 'numeric' },
    { key: 'comments', label: 'Comments', width: 150 },
  ];

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

  const getRentalServiceData = useCallback(() => ({
    title: 'Rental Service',
    transactionDetails: transactionData,
    voucherDetails: voucherData,
    customerData: customerData,
    readings: readings,
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
  }), [transactionData, voucherData, customerData, readings, items, adjustments, summary, collectedCash, collectedCard, collectedUpi]);

  // Keep local draft save for offline support
  const { handleSave, isSaving } = useScreenDraft('RentalService', getRentalServiceData, {
    successMessage: 'Rental service draft saved locally.',
  });

  // Save invoice to backend API
  const handleSaveInvoice = async () => {
    if (items.length === 0) {
      Alert.alert('No Items', 'Please add at least one item before saving.', [{ text: 'OK' }]);
      return;
    }

    if (!customerData.customerName || customerData.customerName.trim() === '') {
      Alert.alert('Missing Customer', 'Please select a customer before saving.', [{ text: 'OK' }]);
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const datetimeStr = `${dateStr} ${timeStr}`;

    let finalVoucherData = { ...voucherData };
    if (!finalVoucherData.voucherSeries || !finalVoucherData.voucherNo || !finalVoucherData.voucherDatetime) {
      finalVoucherData = {
        voucherSeries: finalVoucherData.voucherSeries || 'RS',
        voucherNo: finalVoucherData.voucherNo || `TEMP-${Date.now()}`,
        voucherDatetime: finalVoucherData.voucherDatetime || datetimeStr,
      };
      setVoucherData(finalVoucherData);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsSavingInvoice(true);
    
    try {
      const invoiceData = getRentalServiceData();
      const voucherSeries = invoiceData.voucherDetails.voucherSeries;
      const voucherNo = invoiceData.voucherDetails.voucherNo;
      const voucherDatetime = invoiceData.voucherDetails.voucherDatetime;
      
      if (!voucherSeries || !voucherNo || !voucherDatetime) {
        throw new Error('Voucher information is missing. Please refresh the screen and try again.');
      }
      
      // Use the full voucher series format (e.g., RS-25PAT-Mo) from voucherData
      // This ensures the backend can detect it's RentalService format
      const fullVoucherSeries = voucherSeries;
      
      const apiData = {
        invoiceID: savedInvoiceID,
        voucherSeries: fullVoucherSeries,
        voucherNo: voucherNo,
        voucherDatetime: voucherDatetime,
        transactionDetails: {
          date: invoiceData.transactionDetails.date,
          time: invoiceData.transactionDetails.time,
          branch: invoiceData.transactionDetails.branch,
          location: invoiceData.transactionDetails.location,
          username: invoiceData.transactionDetails.username,
        },
        header: {
          date: invoiceData.customerData.date,
          billerName: invoiceData.customerData.billerName,
          employeeName: invoiceData.customerData.employeeName,
          customerId: invoiceData.customerData.customerId,
          customerName: invoiceData.customerData.customerName,
          machineType: invoiceData.customerData.machineType,
          remarks: invoiceData.customerData.remarks,
          gstBill: gstBill || false,
        },
        readings: invoiceData.readings,
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

      const result = await apiCall(API_ENDPOINTS.CREATE_INVOICE, {
        method: 'POST',
        body: JSON.stringify(apiData),
      });

      if (result.success) {
        setIsInvoiceSaved(true);
        const newInvoiceID = result.data.invoiceID;
        setSavedInvoiceID(newInvoiceID);
        setHasPreviewed(false);
        
        if (result.data.voucherSeries && result.data.voucherNo) {
          setVoucherData({
            voucherSeries: result.data.voucherSeries,
            voucherNo: result.data.voucherNo,
            voucherDatetime: result.data.voucherDatetime || voucherData.voucherDatetime,
          });
        }
        
        const action = savedInvoiceID ? 'updated' : 'saved';
        Alert.alert(
          'Success! ✓',
          `Invoice ${action} successfully!\n\nVoucher: ${result.data.voucherSeries}-${result.data.voucherNo}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      let errorMessage = error.message || 'Unknown error occurred';
      if (error.message.includes('502') || error.message.includes('503')) {
        errorMessage = 'Cannot connect to backend server. Please check your connection.';
      }
      Alert.alert('Save Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsSavingInvoice(false);
    }
  };

  // Combined save handler (local + API)
  const handleSaveCombined = async () => {
    await handleSaveInvoice();
    await handleSave();
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

  const handlePreviewInvoice = async () => {
    if (items.length === 0) {
      Alert.alert('No Items', 'Please add at least one item to preview the service.', [{ text: 'OK' }]);
      return;
    }
    try {
      const data = getRentalServiceData();
      setHasPreviewed(true);
      setShowPDFPreview(true);
    } catch (error) {
      console.error('Error previewing service:', error);
      Alert.alert('Error', `Failed to preview: ${error.message}`);
    }
  };

  const handleSendWhatsApp = async () => {
    if (items.length === 0) {
      Alert.alert('No Items', 'Please add at least one item before sending the service.', [{ text: 'OK' }]);
      return;
    }
    if (!customerData.customerName || customerData.customerName.trim() === '') {
      Alert.alert('No Customer', 'Please select a customer before sending.', [{ text: 'OK' }]);
      return;
    }
    try {
      const data = getRentalServiceData();
      const { uri } = await generateInvoicePDF(data);
      await sharePDFViaWhatsApp(uri, customerData.whatsappNo || customerData.mobileNo);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      Alert.alert('Error', `Failed to send WhatsApp: ${error.message}`);
    }
  };

  const handleSendSMS = async () => {
    if (items.length === 0) {
      Alert.alert('No Items', 'Please add at least one item before sending SMS.', [{ text: 'OK' }]);
      return;
    }
    if (!customerData.customerName || customerData.customerName.trim() === '') {
      Alert.alert('No Customer', 'Please select a customer before sending SMS.', [{ text: 'OK' }]);
      return;
    }
    try {
      const data = getRentalServiceData();
      const { uri } = await generateInvoicePDF(data);
      await sharePDFViaSMS(uri, customerData.mobileNo || customerData.whatsappNo);
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert('Error', `Failed to send SMS: ${error.message}`);
    }
  };

  return (
    <SmartSuiteFormScreen
      title="Rental Service"
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
                value={transactionData?.date || ''}
                onChangeText={(value) => setTransactionData({ ...transactionData, date: value })}
                placeholder="Enter date"
              />
            ) : (
              <View style={styles.displayBox}>
                <Text style={styles.displayText}>{transactionData?.date || 'Loading...'}</Text>
            </View>
            )}
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Time</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={transactionData?.time || ''}
                onChangeText={(value) => setTransactionData({ ...transactionData, time: value })}
                placeholder="Enter time"
              />
            ) : (
              <View style={styles.displayBox}>
                <Text style={styles.displayText}>{getDisplayTime(transactionData?.time)}</Text>
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
              value={transactionData?.branch || ''}
              onChangeText={(value) => setTransactionData({ ...transactionData, branch: value })}
              placeholder="Enter branch"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {transactionData?.branch || 'Loading...'}
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
              value={transactionData?.location || ''}
              onChangeText={(value) => setTransactionData({ ...transactionData, location: value })}
              placeholder="Enter location"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {transactionData?.location || 'Loading...'}
              </Text>
            </View>
          )}
        </View>

        {/* Username/Executive */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Username</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={transactionData?.username || ''}
              onChangeText={(value) => setTransactionData({ ...transactionData, username: value })}
              placeholder="Enter username"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {transactionData?.username || 'Loading...'}
              </Text>
            </View>
          )}
        </View>
      </AccordionSection>

      <AccordionSection title="VOUCHER" defaultExpanded={false}>
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
                <Text style={styles.displayText}>{voucherData.voucherSeries || 'Loading...'}</Text>
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
                <Text style={styles.displayText}>{voucherData.voucherNo || 'Loading...'}</Text>
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
              <Text style={styles.displayText}>{voucherData.voucherDatetime || `${transactionData?.date || ''} ${transactionData?.time || ''}`}</Text>
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
              value={customerData.customerId || ''}
              onChangeText={(value) => handleInputChange('customerId', value)}
              placeholder="Enter customer ID"
            />
          ) : (
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
                <MaterialIcons name="qr-code-scanner" size={24} color="#30302d" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { marginLeft: 4, backgroundColor: '#30302d' }]}
                onPress={() => setShowMobileSearchModal(true)}
                disabled={isLoadingCustomer}
              >
                <MaterialIcons name="search" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {!isSupervisor && (
            <Text style={styles.helperText}>
              {isLoadingCustomer ? 'Loading customer...' : 'Scan QR or use search icon to search by mobile number'}
            </Text>
          )}
        </View>

        {/* Customer Name */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Customer Name</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={customerData.customerName || ''}
              onChangeText={(value) => handleInputChange('customerName', value)}
              placeholder="Enter customer name"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {customerData.customerName || 'Will be filled from QR code'}
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
                value={customerData.mobileNo || ''}
                onChangeText={(value) => handleInputChange('mobileNo', value)}
                placeholder="Enter mobile no"
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
                value={customerData.whatsappNo || ''}
                onChangeText={(value) => handleInputChange('whatsappNo', value)}
                placeholder="Enter WhatsApp no"
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
              value={customerData.customerType || ''}
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

        {/* Machine Type - TextInput for both supervisor and executive */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Machine Type</Text>
          <TextInput
            style={styles.input}
            value={customerData.machineType || ''}
            onChangeText={(value) => handleInputChange('machineType', value)}
            placeholder="Enter machine type"
          />
        </View>

        {/* Remarks */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={styles.input}
            value={customerData.remarks || ''}
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
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>OUT</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.out}
                onChangeText={(text) => setReadings({ ...readings, out: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>Tested Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.testedCopies}
                onChangeText={(text) => setReadings({ ...readings, testedCopies: text })}
                keyboardType="numeric"
                placeholder="0"
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
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>A4</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.a4}
                onChangeText={(text) => setReadings({ ...readings, a4: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>A4 Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.a4Copies}
                onChangeText={(text) => setReadings({ ...readings, a4Copies: text })}
                keyboardType="numeric"
                placeholder="0"
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
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>A3</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.a3}
                onChangeText={(text) => setReadings({ ...readings, a3: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>A3 Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.a3Copies}
                onChangeText={(text) => setReadings({ ...readings, a3Copies: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
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
              placeholder="Enter or scan barcode"
            />
            <TouchableOpacity
              style={styles.scanBarcodeButton}
              onPress={() => setShowBarcodeScanner(true)}
            >
              <MaterialIcons name="qr-code-scanner" size={24} color="#fff" />
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
          onDeleteRow={(index) => {
            const updatedItems = items.filter((_, i) => i !== index);
            commitItems(updatedItems.map((item, i) => ({ ...item, sno: String(i + 1) })));
          }}
          onCellChange={(rowIndex, columnKey, value) => {
            const updatedItems = items.map((item, index) => {
              if (index !== rowIndex) return item;
              const updated = { ...item, [columnKey]: value };
              // Recalculate net if quantity or rate changes
              if (columnKey === 'quantity' || columnKey === 'rate') {
                const qty = parseFloat(updated.quantity) || 0;
                const rate = parseFloat(updated.rate) || 0;
                updated.net = qty * rate;
              }
              return updated;
            });
            commitItems(updatedItems);
          }}
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

      <AccordionSection title="ADJUSTMENTS" defaultExpanded={false}>
        <ItemTable
          columns={adjustmentColumns}
          data={adjustments.map((adj, index) => ({
            ...adj,
            sno: String(index + 1),
          }))}
          onAddRow={() => setShowAddAdjustmentModal(true)}
          onDeleteRow={(rowIndex) => {
            const adjustment = adjustments[rowIndex];
            if (adjustment) {
              Alert.alert(
                'Delete Adjustment',
                'Are you sure you want to delete this adjustment?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      setAdjustments(adjustments.filter((adj) => adj.id !== adjustment.id));
                    },
                  },
                ]
              );
            }
          }}
          onCellChange={(rowIndex, field, value) => {
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
          }}
        />
      </AccordionSection>

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
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.balanceText}>
                ₹{(
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

      {/* Modals */}
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
        invoiceData={getRentalServiceData()}
        onClose={() => setShowPDFPreview(false)}
      />
      <MobileSearchModal
        isVisible={showMobileSearchModal}
        onSearch={handleSearchByMobile}
        onClose={() => setShowMobileSearchModal(false)}
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
          
          const itemsToAdd = newSerialNos.map((serialNo) => {
            const issuedProduct = issuedProductsData.find(
              ip => ip.productSerialNo === serialNo
            );
            
            return {
              id: Date.now() + Math.random(),
              productId: product.id,
              productName: product.name,
              barcode: barcode || '',
              quantity: issuedProduct?.quantity || 1,
              rate: product.rate || 0,
              net: 0,
              comments1: '',
              freeQty: 0,
              productSerialNo: serialNo,
            };
          });
          
          const updatedItems = items.filter(item => {
            if (!item.productSerialNo) return true;
            return !removeSerialNos.includes(item.productSerialNo.trim());
          });
          
          commitItems([...updatedItems, ...itemsToAdd]);
          
          let message = '';
          if (itemsToAdd.length > 0 && removeSerialNos.length > 0) {
            message = `${itemsToAdd.length} item(s) added and ${removeSerialNos.length} item(s) removed`;
          } else if (itemsToAdd.length > 0) {
            message = `${itemsToAdd.length} item(s) added with selected Serial Numbers`;
          } else if (removeSerialNos.length > 0) {
            message = `${removeSerialNos.length} item(s) removed`;
          }
          
          Alert.alert('Items Updated! ✓', message, [{ text: 'OK' }]);
          
          setShowSerialNoModal(false);
          setIssuedProductsData(null);
          setPendingProductData(null);
        }}
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
    marginBottom: 12,
  },
  readingField: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '32%',
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
  displayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
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
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#999',
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
  helperText: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

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
                <Text style={mobileSearchStyles.searchButtonText}>🔍 Search</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={mobileSearchStyles.note}>
            💡 Searches both Mobile Number and WhatsApp Number
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
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#d32f2f',
    borderWidth: 2,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 10,
    paddingHorizontal: 4,
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
  searchButtonDisabled: {
    backgroundColor: '#90CAF9',
    opacity: 0.7,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default withScreenPermission('RentalService')(RentalServiceScreen);


