import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SmartSuiteFormScreen from '../components/SmartSuiteFormScreen';
import AccordionSection from '../components/AccordionSection';
import ItemTable from '../components/ItemTable';
import QRScannerModal from '../components/QRScannerModal';
import { sharePDFViaWhatsApp, sharePDFViaSMS, generateInvoicePDF, openWhatsAppContact, openSMSContact } from '../utils/pdfUtils';
import PDFPreviewModal from '../components/PDFPreviewModal';
import useScreenDraft from '../hooks/useScreenDraft';
import withScreenPermission from '../components/withScreenPermission';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { getBranchShortName } from '../utils/branchMapping';
import { getDisplayTime } from '../utils/timeUtils';

const CashReceiptsScreen = () => {
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const [isLoadingExecutiveData, setIsLoadingExecutiveData] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  
  // Voucher state
  const [voucherData, setVoucherData] = useState({
    voucherSeries: '',
    voucherNo: '',
    voucherDatetime: '',
  });
  
  // Transaction state
  const [transactionData, setTransactionData] = useState({
    date: '',
    time: '',
    branch: '',
    employeeName: '',
    username: '',
  });
  
  // Header state
  const [headerData, setHeaderData] = useState({
    date: '',
    cashAccount: 'Cash', // Default to Cash account
  });
  
  // Customer state (for account field)
  const [customerData, setCustomerData] = useState({
    customerId: '',
    customerName: '',
    mobileNo: '',
    whatsappNo: '',
  });
  
  const [remarks, setRemarks] = useState('');
  const [bodyItems, setBodyItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState('0.00');
  const [totalDiscount, setTotalDiscount] = useState('0.00');
  const [totalValue, setTotalValue] = useState('0.00');
  const [ledgerBalance, setLedgerBalance] = useState('0.00');
  
  // Calculate summary from bodyItems
  useEffect(() => {
    const totalAmt = bodyItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalDisc = bodyItems.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
    const totalVal = totalAmt - totalDisc;
    const ledgerBal = 0; // Can be calculated based on business logic
    
    setTotalAmount(totalAmt.toFixed(2));
    setTotalDiscount(totalDisc.toFixed(2));
    setTotalValue(totalVal.toFixed(2));
    setLedgerBalance(ledgerBal.toFixed(2));
  }, [bodyItems]);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showMobileSearchModal, setShowMobileSearchModal] = useState(false);
  
  // Save state
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [savedReceiptID, setSavedReceiptID] = useState(null);

  // Check if user is supervisor - supervisors get blank, editable fields
  const isSupervisor = currentUser?.role === 'supervisor';

  // Auto-populate executive data on mount
  // Auto-populate executive data on mount and when screen comes into focus
  // This ensures we always have the latest LastVoucherNumber when navigating between screens
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
            employeeName: '',
            username: '',
          });
          
          setVoucherData({
            voucherSeries: '',
            voucherNo: '',
            voucherDatetime: '',
          });
          
          setHeaderData({
            date: '',
            cashAccount: '',
          });
          
          setCustomerData({
            customerId: '',
            customerName: '',
            mobileNo: '',
            whatsappNo: '',
          });
          return;
        }
        
        if (currentUser?.username) {
          setIsLoadingExecutiveData(true);
          try {
            console.log(`🔍 Fetching executive data for Cash Receipts - username: ${currentUser.username}`);
            
            const result = await apiCall(API_ENDPOINTS.GET_EXECUTIVE_DATA(currentUser.username));
            
            if (result.success && result.data) {
              const execData = result.data;
              const employee = execData.transactionDetails || {};
              
              // Get current year last 2 digits
              const currentYear = new Date().getFullYear();
              const yearSuffix = String(currentYear).slice(-2);
              
              // Get branch short name
              const branchName = employee.branch || '';
              const branchShortName = getBranchShortName(branchName);
              
              // Get employee short name from API response
              const shortName = execData.header?.shortName || '';
              
              if (!shortName) {
                console.warn('⚠️ Employee ShortName not found in API response');
              }
              
              // Construct voucher series: CR-25PAT-JD
              // Format: CR-{Year}{BranchShortName}-{EmployeeShortName}
              let voucherSeries;
              if (branchShortName && shortName) {
                voucherSeries = `CR-${yearSuffix}${branchShortName}-${shortName}`;
              } else if (branchShortName) {
                voucherSeries = `CR-${yearSuffix}${branchShortName}`;
              } else if (shortName) {
                voucherSeries = `CR-${yearSuffix}-${shortName}`;
              } else {
                voucherSeries = `CR-${yearSuffix}`;
              }
              
              // Get current date/time
              const now = new Date();
              const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const datetimeStr = `${dateStr} ${timeStr}`;
              
              // Set transaction data
              setTransactionData({
                date: employee.date || dateStr,
                time: employee.time || timeStr,
                branch: employee.branch || '',
                employeeName: execData.header?.employeeName || currentUser.username,
                username: currentUser.username,
              });
              
              // Set voucher data (preview - use LastVoucherNumber from API)
              // The API returns the next preview number based on LastVoucherNumber
              const voucherNoPreview = execData.voucherDetails?.voucherNo || '1';
              setVoucherData({
                voucherSeries: voucherSeries,
                voucherNo: voucherNoPreview, // Use preview number from API (LastVoucherNumber + 1)
                voucherDatetime: execData.voucherDetails?.voucherDatetime || datetimeStr,
              });
            
            // Set header data
            setHeaderData({
              date: execData.header?.date || dateStr,
              cashAccount: 'Cash', // Default to Cash account
            });
          }
        } catch (error) {
          console.error('Error loading executive data:', error);
          // Use fallback values
          const now = new Date();
          const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const datetimeStr = `${dateStr} ${timeStr}`;
          
          setTransactionData({
            date: dateStr,
            time: timeStr,
            branch: 'Head Office',
            employeeName: currentUser.username,
            username: currentUser.username,
          });
          
          setVoucherData({
            voucherSeries: 'CR-25HO-MO',
            voucherNo: '1',
            voucherDatetime: datetimeStr,
          });
          
          setHeaderData({
            date: dateStr,
            cashAccount: 'Cash',
          });
          } finally {
            setIsLoadingExecutiveData(false);
          }
        }
      };
      
      loadExecutiveData();
    }, [currentUser?.username, isSupervisor])
  );

  const handleDeleteRow = (index) => {
    // For cash receipt, clearing the item means removing customer
    Alert.alert(
      'Clear Customer',
      'Are you sure you want to clear this customer? You can add a new customer by scanning QR or searching.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setBodyItems([]);
            setCustomerData({
              customerId: '',
              customerName: '',
              mobileNo: '',
              whatsappNo: '',
            });
          },
        },
      ]
    );
  };

  const handleCellChange = (rowIndex, columnKey, value) => {
    // Account field is read-only, don't allow changes
    if (columnKey === 'account') {
      return;
    }
    
    const newItems = [...bodyItems];
    newItems[rowIndex][columnKey] = value;
    setBodyItems(newItems);
  };

  // Handle QR scan
  const handleScannedQr = async (data) => {
    console.log('QR Data received:', data);
    setIsLoadingCustomer(true);
    setShowScanner(false);
    
    try {
      const trimmedData = data.trim();
      
      // Try to fetch by CustomerID first
      let customerFound = false;
      
      try {
        const encodedCustomerId = encodeURIComponent(trimmedData);
        const result = await apiCall(API_ENDPOINTS.CUSTOMER_BY_ID(encodedCustomerId));
        
        if (result.success && result.data) {
          const customer = result.data;
          setCustomerData({
            customerId: customer.CustomerID,
            customerName: customer.CustomerName,
            mobileNo: customer.MobileNo,
            whatsappNo: customer.WhatsAppNo || customer.MobileNo,
          });
          
          // Cash receipt is for only one person - replace existing item if any
          const newItem = {
            id: Date.now(),
            sno: '1',
            account: customer.CustomerName,
            amount: bodyItems.length > 0 ? bodyItems[0].amount : '0.00', // Preserve amount if exists
            discount: bodyItems.length > 0 ? bodyItems[0].discount : '', // Preserve discount if exists
            comments1: bodyItems.length > 0 ? bodyItems[0].comments1 : '', // Preserve comments if exists
          };
          setBodyItems([newItem]); // Always only one item
          
          Alert.alert(
            'Customer Added',
            `Customer: ${customer.CustomerName}\nMobile: ${customer.MobileNo}`,
            [{ text: 'OK' }]
          );
          customerFound = true;
        }
      } catch (error) {
        console.log('CustomerID lookup failed:', error.message);
      }
      
      // If CustomerID fails, try mobile number
      if (!customerFound) {
        const parts = trimmedData.split(',');
        let mobileNo = parts.length >= 2 ? parts[1]?.trim() : trimmedData;
        mobileNo = mobileNo.replace(/\D/g, '');
        
        if (mobileNo && mobileNo.length >= 10) {
          try {
            const result = await apiCall(API_ENDPOINTS.CUSTOMER_BY_MOBILE(mobileNo));
            
            if (result.success && result.data) {
              const customer = result.data;
              setCustomerData({
                customerId: customer.CustomerID,
                customerName: customer.CustomerName,
                mobileNo: customer.MobileNo,
                whatsappNo: customer.WhatsAppNo || customer.MobileNo,
              });
              
              // Cash receipt is for only one person - replace existing item if any
              const newItem = {
                id: Date.now(),
                sno: '1',
                account: customer.CustomerName,
                amount: bodyItems.length > 0 ? bodyItems[0].amount : '0.00', // Preserve amount if exists
                discount: bodyItems.length > 0 ? bodyItems[0].discount : '', // Preserve discount if exists
                comments1: bodyItems.length > 0 ? bodyItems[0].comments1 : '', // Preserve comments if exists
              };
              setBodyItems([newItem]); // Always only one item
              
              Alert.alert(
                'Customer Added',
                `Customer: ${customer.CustomerName}\nMobile: ${customer.MobileNo}`,
                [{ text: 'OK' }]
              );
              customerFound = true;
            }
          } catch (error) {
            console.error('Mobile number lookup failed:', error.message);
          }
        }
      }
      
      if (!customerFound) {
        Alert.alert(
          'Customer Not Found',
          `Could not find customer. Would you like to search by mobile number?`,
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
        `Error: ${error.message}\n\nWould you like to search by mobile number?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Search by Mobile', onPress: () => setShowMobileSearchModal(true) }
        ]
      );
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  // Handle mobile search
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
        setCustomerData({
          customerId: customer.CustomerID,
          customerName: customer.CustomerName,
          mobileNo: customer.MobileNo,
          whatsappNo: customer.WhatsAppNo || customer.MobileNo,
        });
        
        // Cash receipt is for only one person - replace existing item if any
        const newItem = {
          id: Date.now(),
          sno: '1',
          account: customer.CustomerName,
          amount: bodyItems.length > 0 ? bodyItems[0].amount : '0.00', // Preserve amount if exists
          discount: bodyItems.length > 0 ? bodyItems[0].discount : '', // Preserve discount if exists
          comments1: bodyItems.length > 0 ? bodyItems[0].comments1 : '', // Preserve comments if exists
        };
        setBodyItems([newItem]); // Always only one item

        setShowMobileSearchModal(false);

        Alert.alert(
          'Customer Added',
          `Customer: ${customer.CustomerName}\nMobile: ${customer.MobileNo}`,
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

  const bodyColumns = [
    { key: 'sno', label: 'S.No', width: 70, editable: false },
    { key: 'account', label: 'Account', width: 200, required: true, editable: isSupervisor },
    { key: 'amount', label: 'Amount', width: 120, keyboardType: 'numeric', required: true },
    { key: 'discount', label: 'Discount', width: 100, keyboardType: 'numeric' },
    { key: 'comments1', label: 'Comments1', width: 150 },
  ];

  const summaryFields = [
    { label: 'Total Amount', value: totalAmount },
    { label: 'Total Discount', value: totalDiscount },
    { label: 'Total Value', value: totalValue },
    { label: 'Ledger Balance', value: ledgerBalance },
  ];

  const getInvoiceData = useCallback(() => ({
    title: 'Cash Receipts',
    voucherDetails: {
      voucherSeries: voucherData.voucherSeries,
      voucherNo: voucherData.voucherNo,
      voucherDatetime: voucherData.voucherDatetime,
    },
    transactionDetails: {
      date: transactionData.date,
      time: transactionData.time,
      branch: transactionData.branch,
      username: transactionData.username,
    },
    customerData: {
      customerName: headerData.cashAccount,
      date: headerData.date,
      mobileNo: customerData.mobileNo,
      whatsappNo: customerData.whatsappNo,
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
  }), [voucherData, transactionData, headerData, customerData, bodyItems, totalAmount, totalDiscount, totalValue, ledgerBalance]);

  const { handleSave, isSaving } = useScreenDraft('CashReceipts', getInvoiceData, {
    successMessage: 'Cash receipt draft saved.',
  });

  const handleSaveInvoice = async () => {
    if (bodyItems.length === 0 || !bodyItems[0].account || bodyItems[0].account.trim() === '') {
      Alert.alert(
        'No Customer',
        'Please add a customer by scanning QR code or searching by mobile number before saving the receipt.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSavingInvoice(true);
    
    try {
      const invoiceData = getInvoiceData();
      const voucherSeries = invoiceData.voucherDetails.voucherSeries;
      const voucherNo = invoiceData.voucherDetails.voucherNo;
      const voucherDatetime = invoiceData.voucherDetails.voucherDatetime;
      
      if (!voucherSeries || !voucherNo || !voucherDatetime) {
        throw new Error('Voucher information is missing. Please refresh the screen and try again.');
      }

      // Map receipt bodyItems to invoice items format
      // For receipts, we'll use the account name as product name and amount as the item value
      const items = bodyItems.map((item, index) => ({
        sno: index + 1,
        productId: null,
        productName: item.account || '',
        barcode: '',
        productSerialNo: null,
        quantity: 1,
        freeQty: 0,
        rate: parseFloat(item.amount) || 0,
        net: (parseFloat(item.amount) || 0) - (parseFloat(item.discount) || 0),
        comments1: item.comments1 || '',
      }));

      const apiData = {
        invoiceID: savedReceiptID,
        voucherSeries: voucherSeries,
        voucherNo: voucherNo,
        voucherDatetime: voucherDatetime,
        transactionDetails: {
          date: invoiceData.transactionDetails.date,
          time: invoiceData.transactionDetails.time,
          branch: invoiceData.transactionDetails.branch,
          location: '',
          employeeLocation: '',
          username: invoiceData.transactionDetails.username,
        },
        header: {
          date: invoiceData.customerData.date,
          billerName: '',
          employeeName: transactionData.employeeName || transactionData.username,
          customerId: customerData.customerId || null,
          customerName: bodyItems[0]?.account || '',
          readingA4: '',
          readingA3: '',
          machineType: '',
          remarks: remarks || '',
          gstBill: false,
        },
        collections: invoiceData.collections,
        items: items,
        adjustments: [],
        summary: {
          itemCount: items.length,
          totalQty: items.length,
          totalGross: parseFloat(totalAmount) || 0,
          totalDiscount: parseFloat(totalDiscount) || 0,
          totalAdd: 0,
          totalLess: 0,
          totalBillValue: parseFloat(totalValue) || 0,
          ledgerBalance: parseFloat(ledgerBalance) || 0,
        },
      };

      const result = await apiCall(API_ENDPOINTS.CREATE_INVOICE, {
        method: 'POST',
        body: JSON.stringify(apiData),
      });

      if (result.success) {
        setIsInvoiceSaved(true);
        const newReceiptID = result.data.invoiceID;
        setSavedReceiptID(newReceiptID);
        setHasPreviewed(false);
        
        if (result.data.voucherSeries && result.data.voucherNo) {
          setVoucherData({
            voucherSeries: result.data.voucherSeries,
            voucherNo: result.data.voucherNo,
            voucherDatetime: result.data.voucherDatetime || voucherData.voucherDatetime,
          });
        }
        
        const action = savedReceiptID ? 'updated' : 'saved';
        console.log(`✅ Cash receipt ${action}: ID=${newReceiptID}, Voucher=${result.data.voucherSeries}-${result.data.voucherNo}`);
        
        Alert.alert(
          'Success',
          `Cash receipt ${action} successfully!\n\nVoucher: ${result.data.voucherSeries}-${result.data.voucherNo}\nReceipt ID: ${result.data.invoiceID}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      let errorMessage = error.message || 'Unknown error occurred';
      if (error.message.includes('502') || error.message.includes('503')) {
        errorMessage = 'Cannot connect to backend server. Please check your connection.';
      }
      Alert.alert('Error', `Failed to save receipt: ${errorMessage}`);
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleSaveCombined = async () => {
    handleSave();
    await handleSaveInvoice();
  };

  const handleExit = () => {
    const hasUnsavedChanges = bodyItems.length > 0 && bodyItems[0].account && bodyItems[0].account.trim() !== '' && !isInvoiceSaved;
    
    if (hasUnsavedChanges || hasPreviewed) {
      Alert.alert(
        'Unsaved Changes',
        hasPreviewed 
          ? 'You have previewed the receipt. Please save the receipt before exiting to ensure it is saved to the database.'
          : 'You have unsaved changes. Are you sure you want to exit without saving?',
        [
          { 
            text: 'Save & Exit', 
            onPress: async () => {
              try {
                await handleSaveCombined();
                setIsInvoiceSaved(true);
                setHasPreviewed(false);
                setTimeout(() => {
                  navigation.goBack();
                }, 500);
              } catch (error) {
                console.error('Save failed on exit:', error);
              }
            },
            style: 'default'
          },
          { 
            text: 'Exit Without Saving', 
            onPress: () => {
              setIsInvoiceSaved(false);
              setSavedReceiptID(null);
              setHasPreviewed(false);
              navigation.goBack();
            },
            style: 'destructive'
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handlePreviewInvoice = () => {
    if (bodyItems.length === 0 || !bodyItems[0].account || bodyItems[0].account.trim() === '') {
      Alert.alert(
        'No Customer',
        'Please add a customer by scanning QR code or searching by mobile number to preview the receipt.',
        [{ text: 'OK' }]
      );
      return;
    }
    setHasPreviewed(true);
    setShowPDFPreview(true);
  };

  const handleSendWhatsApp = async () => {
    if (bodyItems.length === 0 || !bodyItems[0].account || bodyItems[0].account.trim() === '') {
      Alert.alert(
        'No Customer',
        'Please add a customer by scanning QR code or searching by mobile number before sending the receipt.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (!customerData.whatsappNo) {
      Alert.alert(
        'WhatsApp Number Required',
        'The customer does not have a WhatsApp number. Please add a customer with a WhatsApp number to send via WhatsApp.',
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
    if (bodyItems.length === 0 || !bodyItems[0].account || bodyItems[0].account.trim() === '') {
      Alert.alert(
        'No Customer',
        'Please add a customer by scanning QR code or searching by mobile number before opening SMS.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (!customerData.mobileNo) {
      Alert.alert(
        'Mobile Number Required',
        'The customer does not have a mobile number. Please add a customer with a mobile number to open SMS.',
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
      title="CASH RECEIPTS"
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
      {/* VOUCHER Section */}
      <AccordionSection title="VOUCHER" defaultExpanded={true}>
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
                <Text style={styles.displayText}>
                  {isLoadingExecutiveData ? 'Loading...' : voucherData.voucherSeries || 'Loading...'}
                </Text>
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
                <Text style={styles.displayText}>
                  {isLoadingExecutiveData ? 'Loading...' : voucherData.voucherNo || 'Loading...'}
                </Text>
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
                {isLoadingExecutiveData ? 'Loading...' : 
                  voucherData.voucherDatetime 
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

      {/* TRANSACTION DETAILS Section */}
      <AccordionSection title="TRANSACTION DETAILS" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={transactionData.date}
                onChangeText={(value) => setTransactionData({ ...transactionData, date: value })}
                placeholder="Enter date"
              />
            ) : (
              <View style={styles.displayBox}>
                <Text style={styles.displayText}>
                  {isLoadingExecutiveData ? 'Loading...' : transactionData.date || 'Loading...'}
                </Text>
            </View>
            )}
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Time</Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={transactionData.time}
                onChangeText={(value) => setTransactionData({ ...transactionData, time: value })}
                placeholder="Enter time"
              />
            ) : (
              <View style={styles.displayBox}>
                <Text style={styles.displayText}>
                  {isLoadingExecutiveData ? 'Loading...' : getDisplayTime(transactionData.time)}
                </Text>
            </View>
            )}
          </View>
        </View>

        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Branch</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={transactionData.branch}
              onChangeText={(value) => setTransactionData({ ...transactionData, branch: value })}
              placeholder="Enter branch"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {isLoadingExecutiveData ? 'Loading...' : transactionData.branch || 'Loading...'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Employee Name</Text>
          {isSupervisor ? (
            <TextInput
              style={styles.input}
              value={transactionData.employeeName}
              onChangeText={(value) => setTransactionData({ ...transactionData, employeeName: value })}
              placeholder="Enter employee name"
            />
          ) : (
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {isLoadingExecutiveData ? 'Loading...' : transactionData.employeeName || 'Loading...'}
              </Text>
            </View>
          )}
        </View>
      </AccordionSection>

      {/* HEADER Section */}
      <AccordionSection title="HEADER" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date</Text>
            {isSupervisor ? (
            <TextInput
              style={styles.input}
                value={headerData.date}
                onChangeText={(value) => setHeaderData({ ...headerData, date: value })}
                placeholder="Enter date"
              />
            ) : (
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>
                  {isLoadingExecutiveData ? 'Loading...' : headerData.date || 'Loading...'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Cash Account <Text style={styles.required}>*</Text>
            </Text>
            {isSupervisor ? (
              <TextInput
                style={styles.input}
                value={headerData.cashAccount}
                onChangeText={(value) => setHeaderData({ ...headerData, cashAccount: value })}
                placeholder="Enter cash account"
              />
            ) : (
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>
                  {headerData.cashAccount || 'Cash'}
                </Text>
            </View>
            )}
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

      {/* BODY Section */}
      <AccordionSection title="BODY" defaultExpanded={true}>
        {/* QR Scanner and Mobile Search */}
        <View style={styles.customerSearchSection}>
          <Text style={styles.label}>Add Customer</Text>
          <View style={styles.searchRow}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setShowScanner(true)}
              disabled={isLoadingCustomer}
            >
              <MaterialIcons name="qr-code-scanner" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Scan QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: '#30302d', marginLeft: 8 }]}
              onPress={() => setShowMobileSearchModal(true)}
              disabled={isLoadingCustomer}
            >
              <MaterialIcons name="search" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
          {isLoadingCustomer && (
            <ActivityIndicator size="small" color="#2196F3" style={{ marginTop: 8 }} />
          )}
        </View>

        <ItemTable
          columns={bodyColumns}
          data={bodyItems.length === 0 ? [{ sno: '1', account: '', amount: '0.00', discount: '', comments1: '' }] : bodyItems}
          onDeleteRow={handleDeleteRow}
          onCellChange={handleCellChange}
        />

        {bodyItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No customer added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Scan QR code or search by mobile to add customer
            </Text>
          </View>
        )}
      </AccordionSection>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isVisible={showPDFPreview}
        onClose={() => {
          setShowPDFPreview(false);
          if (hasPreviewed && !isInvoiceSaved && !isSavingInvoice) {
            Alert.alert(
              'Save Reminder',
              'You have previewed the receipt. Please save it to ensure it is saved to the database.',
              [
                { text: 'Save Now', onPress: async () => {
                  if (!isSavingInvoice && !isInvoiceSaved) {
                    await handleSaveCombined();
                  }
                }},
                { text: 'Later', style: 'cancel' }
              ]
            );
          }
        }}
        invoiceData={getInvoiceData()}
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isVisible={showScanner}
        onScan={handleScannedQr}
        onClose={() => setShowScanner(false)}
      />

      {/* Mobile Search Modal */}
      <MobileSearchModal
        isVisible={showMobileSearchModal}
        onSearch={handleSearchByMobile}
        onClose={() => setShowMobileSearchModal(false)}
      />
    </SmartSuiteFormScreen>
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
      setMobileNumber('');
    } catch (error) {
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
              setError('');
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
    fontSize: 13,
    fontWeight: '900',
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
  customerSearchSection: {
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
  searchRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 0.5,
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
});

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

export default withScreenPermission('CashReceipts')(CashReceiptsScreen);

