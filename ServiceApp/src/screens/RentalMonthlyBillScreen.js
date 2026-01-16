import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import SmartSuiteFormScreen from '../components/SmartSuiteFormScreen';
import AccordionSection from '../components/AccordionSection';
import ItemTable from '../components/ItemTable';
import QRScannerModal from '../components/QRScannerModal';
import AddAdjustmentModal from '../components/AddAdjustmentModal';
import PDFPreviewModal from '../components/PDFPreviewModal';
import { branches, employeeUsernames, adjustmentAccounts, machineTypes, accountsList, adjustmentsList } from '../data/mockData';
import { sharePDFViaWhatsApp, sharePDFViaSMS, generateInvoicePDF, openWhatsAppContact, openSMSContact } from '../utils/pdfUtils';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { getBranchShortName } from '../utils/branchMapping';
import useScreenDraft from '../hooks/useScreenDraft';
import withScreenPermission from '../components/withScreenPermission';
import { getDisplayTime } from '../utils/timeUtils';

const RentalMonthlyBillScreen = () => {
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
    customerName: '',
    mobileNo: '',
    customerType: '',
    whatsappNo: '',
    machineType: '',
    remarks: '',
    gstBill: false,
  };
  const [customerData, setCustomerData] = useState(
    isSupervisor ? blankCustomer : {
      date: '',
      billerName: '',
      party: '',
      employeeName: '',
      customerId: '',
      customerName: '',
      mobileNo: '',
      customerType: '',
      whatsappNo: '',
      machineType: '',
      remarks: '',
      gstBill: false,
    }
  );
  const [gstBill, setGstBill] = useState(isSupervisor ? false : false);

  // Auto-populate executive data on mount and when screen comes into focus
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
          
          setCustomerData(blankCustomer);
          
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
            
            console.log(`🔍 Fetching executive data for RentalMonthlyBill - username: ${currentUser.username}`);

            // Pass screen=RentalMonthlyBill to get correct voucher format (RMB-25NAM-JD)
            const apiEndpoint = API_ENDPOINTS.GET_EXECUTIVE_DATA(currentUser.username, 'RentalMonthlyBill');
            console.log(`   API Endpoint URL: ${apiEndpoint}`);
            console.log(`   Screen parameter should be: "RentalMonthlyBill"`);
            
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

              // Populate voucher details - backend should return RMB-25NAM-JD format for RentalMonthlyBill
              const voucherSeries = execData.voucherDetails?.voucherSeries || 'RMB';
              const voucherNo = execData.voucherDetails?.voucherNo || '';
              const voucherDatetime = execData.voucherDetails?.voucherDatetime || '';

              console.log(`📋 Voucher series received from API: "${voucherSeries}"`);
              console.log(`   Expected format: RMB-{Year}{Branch}-{Employee} (e.g., RMB-25NAM-JD)`);
              console.log(`   Received format: ${voucherSeries}`);

              if (!voucherSeries || !voucherNo || !voucherDatetime) {
                console.warn('⚠️ Incomplete voucher data from API:', execData.voucherDetails);
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const datetimeStr = `${dateStr} ${timeStr}`;

                setVoucherData({
                  voucherSeries: 'RMB',
                  voucherNo: `TEMP-${Date.now()}`,
                  voucherDatetime: datetimeStr,
                });
              } else {
                console.log(`✅ Setting voucher data: series="${voucherSeries}", no="${voucherNo}", datetime="${voucherDatetime}"`);
                
                // Validate the format - should be RMB-{Year}{Branch}-{Employee} for RentalMonthlyBill
                if (!voucherSeries.startsWith('RMB-')) {
                  console.error(`❌ ERROR: Voucher series format is incorrect!`);
                  console.error(`   Expected: RMB-{Year}{Branch}-{Employee} (e.g., RMB-25NAM-JD)`);
                  console.error(`   Received: ${voucherSeries}`);
                  console.error(`   This indicates the backend is not detecting RentalMonthlyBill screen correctly.`);
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
                voucherSeries: 'RMB',
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

  const [salesAccount, setSalesAccount] = useState('Sales'); // Default to Sales account
  const [machinePurchasedDate, setMachinePurchasedDate] = useState('');
  const [contractExpiredOn, setContractExpiredOn] = useState('');
  const [remainingDays, setRemainingDays] = useState('0');
  const [remainingCopies, setRemainingCopies] = useState('0');
  
  // Loading states
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showMobileSearchModal, setShowMobileSearchModal] = useState(false);
  const [showAddAdjustmentModal, setShowAddAdjustmentModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
  const [savedInvoiceID, setSavedInvoiceID] = useState(null);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  
  // Calculate remaining days automatically when dates change
  useEffect(() => {
    if (machinePurchasedDate && contractExpiredOn) {
      try {
        // Parse dates in DD-MM-YYYY format
        const parseDate = (dateStr) => {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
          }
          return null;
        };
        
        const purchasedDate = parseDate(machinePurchasedDate);
        const expiredDate = parseDate(contractExpiredOn);
        
        if (purchasedDate && expiredDate && !isNaN(purchasedDate.getTime()) && !isNaN(expiredDate.getTime())) {
          const diffTime = expiredDate.getTime() - purchasedDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setRemainingDays(diffDays >= 0 ? String(diffDays) : '0');
        } else {
          setRemainingDays('0');
        }
      } catch (error) {
        console.error('Error calculating remaining days:', error);
        setRemainingDays('0');
      }
    } else {
      setRemainingDays('0');
    }
  }, [machinePurchasedDate, contractExpiredOn]);
  
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
            'Customer Details Loaded',
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
                'Customer Details Loaded',
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
          'Customer Found',
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

  // Adjustments state
  const [adjustments, setAdjustments] = useState([]);

  // Collections state
  const [collectedCash, setCollectedCash] = useState('');
  const [collectedCard, setCollectedCard] = useState('');
  const [collectedUpi, setCollectedUpi] = useState('');

  // Summary state
  const [summary, setSummary] = useState({
    totalFreeCopies: 0,
    chargeableCopiesAmt: 0,
    totalMonthlyCharges: 0,
    totalChargeableCopies: 0,
    chargeableCopies: 0,
    totalAdd: 0,
    totalLess: 0,
    totalGross: 0,
    totalValue: 0,
    ledgerBalance: 0,
  });

  // Calculate summary whenever readings or adjustments change
  const calculateSummary = useCallback(() => {
    const totalFreeCopies = parseFloat(readings.freeCopies) || 0;
    const chargeableCopies = parseFloat(readings.chargeableCopies) || 0;
    const totalMonthlyCharges = parseFloat(readings.monthlyCharges) || 0;
    const contractCharges = parseFloat(readings.contractCharges) || 0;
    
    // Calculate chargeable copies amount (simplified calculation)
    // TODO: This might need actual rate calculation based on business logic
    const chargeableCopiesAmt = chargeableCopies * 0;
    
    const totalAdd = adjustments.reduce((sum, adj) => sum + (parseFloat(adj.addAmount) || 0), 0);
    const totalLess = adjustments.reduce((sum, adj) => sum + (parseFloat(adj.lessAmount) || 0), 0);
    
    const totalGross = totalMonthlyCharges + contractCharges;
    const totalValue = totalGross + totalAdd - totalLess;
    const ledgerBalance = 0;

    setSummary({
      totalFreeCopies,
      chargeableCopiesAmt,
      totalMonthlyCharges,
      totalChargeableCopies: chargeableCopies,
      chargeableCopies,
      totalAdd,
      totalLess,
      totalGross,
      totalValue,
      ledgerBalance,
    });
  }, [readings, adjustments]);

  useEffect(() => {
    calculateSummary();
  }, [calculateSummary]);

  // Handle add adjustment from modal
  const handleAddAdjustment = (newAdjustment) => {
    const adjustmentWithId = {
      ...newAdjustment,
      id: newAdjustment.id || Date.now() + Math.random(),
    };
    setAdjustments([...adjustments, adjustmentWithId]);
    setShowAddAdjustmentModal(false);
    const amountType = newAdjustment.addAmount > 0 ? 'Add' : 'Less';
    const amount = newAdjustment.addAmount > 0 ? newAdjustment.addAmount : newAdjustment.lessAmount;
    Alert.alert(
      'Adjustment Added Successfully',
      `${newAdjustment.accountName}\n${amountType}: ₹${amount.toFixed(2)}`,
      [{ text: 'OK' }]
    );
  };

  const adjustmentColumns = [
    { key: 'sno', label: 'S.No', width: 60, editable: false },
    { key: 'accountName', label: 'Account', width: 200, type: 'dropdown', options: adjustmentsList.map(a => ({ label: a.name, value: a.name })) },
    { key: 'addAmount', label: 'Add', width: 120, keyboardType: 'numeric' },
    { key: 'lessAmount', label: 'Less', width: 120, keyboardType: 'numeric' },
    { key: 'comments', label: 'Comments', width: 150 },
  ];

  // Summary fields for display - computed from summary state
  const summaryFields = useCallback(() => [
    { label: 'Total Free Copies', value: summary.totalFreeCopies.toFixed(0), editable: false },
    { label: 'Chargeable Copies Amt', value: summary.chargeableCopiesAmt.toFixed(2), editable: false },
    { label: 'Total Monthly Charges', value: summary.totalMonthlyCharges.toFixed(2), editable: false },
    { label: 'Total Chargeable Copies', value: summary.totalChargeableCopies.toFixed(0), editable: false },
    { label: 'Chargeable Copies', value: summary.chargeableCopies.toFixed(0), editable: false },
    { label: 'TotalAdd', value: summary.totalAdd.toFixed(2), editable: false },
    { label: 'TotalLess', value: summary.totalLess.toFixed(2), editable: false },
    { label: 'Total Gross', value: summary.totalGross.toFixed(2), editable: false },
    { label: 'Total Value', value: summary.totalValue.toFixed(2), editable: false },
    { label: 'Ledger Balance', value: summary.ledgerBalance.toFixed(2), editable: false },
  ], [summary]);

  const getMonthlyBillData = useCallback(() => {
    return {
      title: 'Rental Monthly Bill',
      voucherDetails: voucherData,
      transactionDetails: transactionData,
      customerData: {
        ...customerData,
        salesAccount,
        machineType: customerData.machineType,
        machinePurchasedDate,
        contractExpiredOn,
        remainingDays,
        remainingCopies,
        gstBill: gstBill || customerData.gstBill || false,
      },
      readings,
      adjustments,
      summary: summary,
      collections: {
        cash: parseFloat(collectedCash) || 0,
        card: parseFloat(collectedCard) || 0,
        upi: parseFloat(collectedUpi) || 0,
        balance: summary.totalValue - (parseFloat(collectedCash) || 0) - (parseFloat(collectedCard) || 0) - (parseFloat(collectedUpi) || 0),
      },
    };
  }, [
    voucherData,
    transactionData,
    customerData,
    salesAccount,
    machinePurchasedDate,
    contractExpiredOn,
    remainingDays,
    remainingCopies,
    gstBill,
    readings,
    adjustments,
    summary,
    collectedCash,
    collectedCard,
    collectedUpi,
  ]);

  const { handleSave, isSaving } = useScreenDraft('RentalMonthlyBill', getMonthlyBillData, {
    successMessage: 'Rental monthly bill draft saved.',
  });

  // Save invoice to backend API
  const handleSaveInvoice = async () => {
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
        voucherSeries: finalVoucherData.voucherSeries || 'RMB',
        voucherNo: finalVoucherData.voucherNo || `TEMP-${Date.now()}`,
        voucherDatetime: finalVoucherData.voucherDatetime || datetimeStr,
      };
      setVoucherData(finalVoucherData);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsSavingInvoice(true);
    
    try {
      const invoiceData = getMonthlyBillData();
      const voucherSeries = invoiceData.voucherDetails.voucherSeries;
      const voucherNo = invoiceData.voucherDetails.voucherNo;
      const voucherDatetime = invoiceData.voucherDetails.voucherDatetime;
      
      if (!voucherSeries || !voucherNo || !voucherDatetime) {
        throw new Error('Voucher information is missing. Please refresh the screen and try again.');
      }
      
      // Use the full voucher series format (e.g., RMB-25NAM-JD) from voucherData
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
          machinePurchasedDate: invoiceData.customerData.machinePurchasedDate,
          contractExpiredOn: invoiceData.customerData.contractExpiredOn,
          remainingDays: invoiceData.customerData.remainingDays,
          remainingCopies: invoiceData.customerData.remainingCopies,
          salesAccount: invoiceData.customerData.salesAccount,
          remarks: invoiceData.customerData.remarks,
          gstBill: invoiceData.customerData.gstBill || false,
        },
        readings: invoiceData.readings,
        collections: invoiceData.collections,
        adjustments: invoiceData.adjustments.map((adj) => ({
          accountId: adj.accountId || null,
          accountName: adj.accountName || '',
          accountType: adj.accountType || 'add',
          addAmount: adj.addAmount || 0,
          lessAmount: adj.lessAmount || 0,
          comments: adj.comments || '',
        })),
        summary: {
          ...invoiceData.summary,
          totalBillValue: invoiceData.summary.totalValue, // Map totalValue to totalBillValue for backend
        },
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
        console.log(`✅ Invoice ${action}: ID=${newInvoiceID}, Voucher=${result.data.voucherSeries}-${result.data.voucherNo}`);
        
        Alert.alert(
          'Success',
          `Invoice ${action} successfully!\n\nVoucher: ${result.data.voucherSeries}-${result.data.voucherNo}\nInvoice ID: ${result.data.invoiceID}`,
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

  const handlePreviewInvoice = async () => {
    if (!customerData.customerName || !customerData.customerId) {
      Alert.alert('Missing Data', 'Please fill in customer details to preview the bill.', [{ text: 'OK' }]);
      return;
    }
    try {
      const data = getMonthlyBillData();
      setHasPreviewed(true);
      setShowPDFPreview(true);
    } catch (error) {
      console.error('Error previewing bill:', error);
      Alert.alert('Error', `Failed to preview: ${error.message}`);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!customerData.customerName || !customerData.customerId) {
      Alert.alert('Missing Data', 'Please fill in customer details before sending the bill.', [{ text: 'OK' }]);
      return;
    }
    const whatsappNumber = customerData.whatsappNo || customerData.mobileNo;
    if (!whatsappNumber) {
      Alert.alert('WhatsApp Number Required', 'The customer does not have a WhatsApp or mobile number. Please add a customer with a WhatsApp number to send via WhatsApp.', [{ text: 'OK' }]);
      return;
    }
    try {
      // Generate PDF and share via WhatsApp
      const data = getMonthlyBillData();
      const { uri } = await generateInvoicePDF(data);
      await sharePDFViaWhatsApp(uri, whatsappNumber);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      Alert.alert('Error', `Failed to send WhatsApp: ${error.message}`);
    }
  };

  const handleSendSMS = async () => {
    if (!customerData.customerName || !customerData.customerId) {
      Alert.alert('Missing Data', 'Please fill in customer details before opening SMS.', [{ text: 'OK' }]);
      return;
    }
    const mobileNumber = customerData.mobileNo || customerData.whatsappNo;
    if (!mobileNumber) {
      Alert.alert('Mobile Number Required', 'The customer does not have a mobile or WhatsApp number. Please add a customer with a mobile number to open SMS.', [{ text: 'OK' }]);
      return;
    }
    try {
      // Open SMS directly with the contact number
      await openSMSContact(mobileNumber);
    } catch (error) {
      console.error('Error opening SMS:', error);
      Alert.alert('Error', `Failed to open SMS: ${error.message}`);
    }
  };

  // Handle exit with save reminder
  const handleExit = () => {
    // Check if there are unsaved changes
    const hasUnsavedChanges = (customerData.customerName && customerData.customerName.trim() !== '') && !isInvoiceSaved;
    
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

  return (
      <SmartSuiteFormScreen
      title="RENTAL MONTHLY BILL"
      summaryFields={summaryFields()}
      onPreview={handlePreviewInvoice}
      onWhatsApp={handleSendWhatsApp}
      onSMS={handleSendSMS}
      actionBarActions={{ 
        onSave: handleSave,
        onClose: handleExit
      }}
      isSaving={isSaving}
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
              <Text style={styles.displayText}>
                {voucherData.voucherDatetime 
                  ? (() => {
                      // Extract date from voucherDatetime and combine with transaction time
                      const dateMatch = voucherData.voucherDatetime.match(/^(\d{2}\/\d{2}\/\d{4})/);
                      const date = dateMatch ? dateMatch[1] : transactionData?.date || '';
                      const time = getDisplayTime(transactionData?.time);
                      return date ? `${date} ${time}` : voucherData.voucherDatetime;
                    })()
                  : `${transactionData?.date || ''} ${getDisplayTime(transactionData?.time)}`}
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

        {/* Sales Account */}
        <View style={styles.fullWidthField}>
          <Text style={styles.label}>
            Sales Account <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>
              {salesAccount || 'Sales'}
            </Text>
          </View>
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

        {/* Machine Purchased Date */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Machine Purchased Date</Text>
            <TextInput
              style={styles.input}
              value={machinePurchasedDate}
              onChangeText={setMachinePurchasedDate}
              placeholder="DD-MM-YYYY"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contract Expired On</Text>
            <TextInput
              style={styles.input}
              value={contractExpiredOn}
              onChangeText={setContractExpiredOn}
              placeholder="DD-MM-YYYY"
            />
          </View>
        </View>

        {/* Remaining Days (calculated automatically) and Remaining Copies */}
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Remaining Days</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {remainingDays || '0'} days
              </Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Remaining Copies</Text>
            <TextInput
              style={styles.input}
              value={remainingCopies}
              onChangeText={setRemainingCopies}
              keyboardType="numeric"
              placeholder="Enter remaining copies"
            />
          </View>
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
            onPress={() => {
              const newGstBill = !gstBill;
              setGstBill(newGstBill);
              handleInputChange('gstBill', newGstBill);
            }}
          >
            <Text style={styles.checkboxIcon}>{gstBill ? '☑' : '☐'}</Text>
            <Text style={styles.checkboxLabel}>GST Bill</Text>
          </TouchableOpacity>
        </View>
      </AccordionSection>

      <AccordionSection title="READINGS" defaultExpanded={true}>
        <View style={styles.readingsGrid}>
          {/* Row 1: Current Reading, Previous Reading */}
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>Current Reading</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.currentReading}
                onChangeText={(text) => setReadings({ ...readings, currentReading: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>Previous Reading</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.previousReading}
                onChangeText={(text) => setReadings({ ...readings, previousReading: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          {/* Row 2: A4, TotalA4 */}
          <View style={styles.readingRow}>
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
              <Text style={styles.label}>TotalA4</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.totalA4}
                onChangeText={(text) => setReadings({ ...readings, totalA4: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          {/* Row 3: A3, TotalA3 */}
          <View style={styles.readingRow}>
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
              <Text style={styles.label}>TotalA3</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.totalA3}
                onChangeText={(text) => setReadings({ ...readings, totalA3: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          {/* Row 4: CA4, CA3 */}
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>CA4</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.ca4}
                onChangeText={(text) => setReadings({ ...readings, ca4: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>CA3</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.ca3}
                onChangeText={(text) => setReadings({ ...readings, ca3: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          {/* Row 5: Months */}
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>Months</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.months}
                onChangeText={(text) => setReadings({ ...readings, months: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          {/* Row 6: Monthly Charges, Contract Charges */}
          <View style={styles.readingRow}>
            <View style={styles.readingField}>
              <Text style={styles.label}>Monthly Charges</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.monthlyCharges}
                onChangeText={(text) => setReadings({ ...readings, monthlyCharges: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.readingField}>
              <Text style={styles.label}>Contract Charges</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.contractCharges}
                onChangeText={(text) => setReadings({ ...readings, contractCharges: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          {/* Row 7: Chargeable Copies, Tested Copies, Free Copies (3 columns) */}
          <View style={styles.readingRow}>
            <View style={[styles.readingFieldThreeCol, styles.readingFieldWide]}>
              <Text style={styles.label}>Chargeable Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.chargeableCopies}
                onChangeText={(text) => setReadings({ ...readings, chargeableCopies: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.readingFieldThreeCol}>
              <Text style={styles.label}>Tested Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.testedCopies}
                onChangeText={(text) => setReadings({ ...readings, testedCopies: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.readingFieldThreeCol}>
              <Text style={styles.label}>Free Copies</Text>
              <TextInput
                style={styles.readingInput}
                value={readings.freeCopies}
                onChangeText={(text) => setReadings({ ...readings, freeCopies: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        </View>
      </AccordionSection>

      <AccordionSection title="ADJUSTMENTS" defaultExpanded={true}>
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
                  summary.totalValue -
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
      <AddAdjustmentModal
        isVisible={showAddAdjustmentModal}
        onAddAdjustment={handleAddAdjustment}
        onClose={() => setShowAddAdjustmentModal(false)}
      />
      <PDFPreviewModal
        isVisible={showPDFPreview}
        invoiceData={getMonthlyBillData()}
        onClose={() => setShowPDFPreview(false)}
      />
      <MobileSearchModal
        isVisible={showMobileSearchModal}
        onSearch={handleSearchByMobile}
        onClose={() => setShowMobileSearchModal(false)}
      />
    </SmartSuiteFormScreen>
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
  required: {
    color: '#f44336',
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
  readingsGrid: {
    gap: 12,
  },
  readingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
    width: '100%',
  },
  readingField: {
    flex: 1,
    minWidth: 0,
    maxWidth: '48%',
  },
  readingFieldThreeCol: {
    flex: 1,
    minWidth: 0,
  },
  readingFieldWide: {
    flex: 1.5,
  },
  readingInput: {
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
  balanceText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(76, 175, 80, 0.5)',
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
});

export default withScreenPermission('RentalMonthlyBill')(RentalMonthlyBillScreen);


