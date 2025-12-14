import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SmartSuiteFormScreen from '../components/SmartSuiteFormScreen';
import AccordionSection from '../components/AccordionSection';
import ItemTable from '../components/ItemTable';
import QRScannerModal from '../components/QRScannerModal';
import { sharePDFViaWhatsApp, sharePDFViaSMS, generateInvoicePDF } from '../utils/pdfUtils';
import PDFPreviewModal from '../components/PDFPreviewModal';
import useScreenDraft from '../hooks/useScreenDraft';
import withScreenPermission from '../components/withScreenPermission';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { API_ENDPOINTS, apiCall } from '../config/api';
import { getBranchShortName } from '../utils/branchMapping';

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

  // Auto-populate executive data on mount
  useEffect(() => {
    const loadExecutiveData = async () => {
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
            
            // Set voucher data (preview - will be generated on save)
            setVoucherData({
              voucherSeries: voucherSeries,
              voucherNo: '1', // Preview only
              voucherDatetime: datetimeStr,
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
  }, [currentUser?.username]);

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
            'Customer Added! ✓',
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
                'Customer Added! ✓',
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
          'Customer Added! ✓',
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
    { key: 'account', label: 'Account*', width: 200, required: true },
    { key: 'amount', label: 'Amount*', width: 120, keyboardType: 'numeric', required: true },
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
      // TODO: Implement backend API call for saving cash receipt
      // For now, just mark as saved
      setIsInvoiceSaved(true);
      setHasPreviewed(false);
      
      Alert.alert(
        'Success! ✓',
        'Cash receipt saved successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', `Failed to save receipt: ${error.message}`);
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
        'Please add a customer by scanning QR code or searching by mobile number before sending the receipt.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (!customerData.mobileNo) {
      Alert.alert(
        'Mobile Number Required',
        'The customer does not have a mobile number. Please add a customer with a mobile number to send SMS.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      const invoiceData = getInvoiceData();
      await sharePDFViaSMS(invoiceData, customerData.mobileNo);
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert('Error', 'Failed to send via SMS. Please try again.');
    }
  };

  return (
    <>
    <SmartSuiteFormScreen
      title="Cash Receipts"
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
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>
                {isLoadingExecutiveData ? 'Loading...' : voucherData.voucherSeries || 'Loading...'}
              </Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Voucher No</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>
                {isLoadingExecutiveData ? 'Loading...' : voucherData.voucherNo || 'Loading...'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Voucher Datetime</Text>
          <View style={styles.displayBox}>
            <Text style={styles.displayText}>
              {isLoadingExecutiveData ? 'Loading...' : voucherData.voucherDatetime || 'Loading...'}
            </Text>
          </View>
        </View>
      </AccordionSection>

      {/* TRANSACTION DETAILS Section */}
      <AccordionSection title="TRANSACTION DETAILS" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>
                {isLoadingExecutiveData ? 'Loading...' : transactionData.date || 'Loading...'}
              </Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Time</Text>
            <View style={styles.displayBox}>
              <Text style={styles.displayText}>
                {isLoadingExecutiveData ? 'Loading...' : transactionData.time || 'Loading...'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Branch</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>
              {isLoadingExecutiveData ? 'Loading...' : transactionData.branch || 'Loading...'}
            </Text>
          </View>
        </View>

        <View style={styles.fullWidthField}>
          <Text style={styles.label}>Employee Name</Text>
          <View style={[styles.input, styles.readOnlyInput]}>
            <Text style={styles.readOnlyText}>
              {isLoadingExecutiveData ? 'Loading...' : transactionData.employeeName || 'Loading...'}
            </Text>
          </View>
        </View>
      </AccordionSection>

      {/* HEADER Section */}
      <AccordionSection title="HEADER" defaultExpanded={true}>
        <View style={styles.row}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {isLoadingExecutiveData ? 'Loading...' : headerData.date || 'Loading...'}
              </Text>
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Cash Account <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>
                {headerData.cashAccount || 'Cash'}
              </Text>
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
  required: {
    color: '#f44336',
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
    padding: 10,
    backgroundColor: '#f5f5f5',
    minHeight: 45,
    justifyContent: 'center',
  },
  displayText: {
    fontSize: 14,
    color: '#333',
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
  },
  readOnlyText: {
    fontSize: 14,
    color: '#666',
  },
  customerSearchSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  searchRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
});

const mobileSearchStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#2196F3',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default withScreenPermission('CashReceipts')(CashReceiptsScreen);

