import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking, Alert, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import logo from '../../assets/logo.png';

// Convert local bundled asset to Base64
export const getLogoBase64 = async () => {
  try {
    // Load the asset and get its local URI
    const asset = Asset.fromModule(logo);
    await asset.downloadAsync();

    // Read the asset file as Base64
    const base64 = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback: Return empty string or a placeholder
    return '';
  }
};

/**
 * Generate HTML content for invoice PDF - Matching CodePen design
 * A5 size document with logo image
 */
export const generateInvoiceHTML = async (invoiceData) => {
  const {
    title = 'Employee Sales',
    transactionDetails = {},
    voucherDetails = {},
    customerData = {},
    items = [],
    adjustments = [],
    summary = {},
    collections = {},
  } = invoiceData;

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  const formatInteger = (value) => {
    return Math.round(parseFloat(value || 0)).toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return dateString;
  };

  // Get employee name
  const employeeName = customerData.employeeName || transactionDetails.username || '';
  
  // Get branch name for address
  const branchName = transactionDetails.branch || '';
  
  // Get header fields from customerData
  const readingA4 = customerData.readingA4 || '';
  const readingA3 = customerData.readingA3 || '';
  const machineType = customerData.machineType || '';
  const remarks = customerData.remarks || '';

  // Get logo as base64
  const logoBase64 = await getLogoBase64();

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        @media print {
          @page {
            size: A5;
            margin: 2mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        body {
          width: 148mm;
          height: auto;
          margin: auto;
          padding: 6mm;
          font-family: Arial, sans-serif;
          font-size: 10px;
          line-height: 1.2;
          color: #000;
          border: 1px solid #ccc;
          box-sizing: border-box;
        }
        /* ---------- HEADER ---------- */
        .header {
          text-align: center;
          margin-bottom: 5px;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
        }
        .logo-img {
          width: 100px;
          height: auto;
          margin-bottom: 2px;
        }
        .address {
          font-size: 10px;
          margin-top: 2px;
        }
        .contact-row {
          margin-top: 4px;
          font-size: 9px;
        }
        .title {
          font-size: 12px;
          font-weight: bold;
          margin-top: 4px;
        }
        /* ---------- INFO SECTIONS ---------- */
        .section {
          margin-top: 8px;
        }
        .section-title {
          font-size: 11px;
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding-bottom: 3px;
          margin-bottom: 4px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .label {
          width: 35%;
          font-weight: bold;
        }
        .value {
          width: 65%;
        }
        /* ---------- TABLES ---------- */
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          margin-top: 6px;
          font-size: 9px;
        }
        th {
          background: #f0f0f0;
          border: 1px solid #000;
          padding: 3px;
          font-weight: bold;
          text-align: center;
        }
        td {
          border: 1px solid #000;
          padding: 3px;
          text-align: center;
        }
        .left { text-align: left; }
        .right { text-align: right; }
        /* ---------- SUMMARY ---------- */
        .summary-box {
          margin-top: 8px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .summary-label {
          width: 50%;
          font-weight: bold;
        }
        /* ---------- FOOTER ---------- */
        .footer {
          margin-top: 10px;
          text-align: center;
          font-size: 9px;
          border-top: 1px solid #000;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <!-- HEADER -->
      <div class="header">
        <img src="${logoBase64}" class="logo-img" />
        <div class="address">${branchName || 'Branch Name, Street Name, City'}</div>
        <div class="contact-row">
          Office: 8870922422 &nbsp; | &nbsp; Service: 8220445868 &nbsp; | &nbsp; Line Marketing: -
        </div>
        <div class="title">${title}</div>
      </div>

      <!-- BILL DETAILS -->
      <div class="section">
        <div class="section-title">Bill Details</div>
        <div class="row">
          <div class="label">Bill Series:</div>
          <div class="value">${voucherDetails.voucherSeries || ''}-${voucherDetails.voucherNo || ''}</div>
        </div>
        <div class="row">
          <div class="label">Bill No:</div>
          <div class="value">${voucherDetails.voucherNo || ''}</div>
        </div>
        <div class="row">
          <div class="label">Bill Date:</div>
          <div class="value">${formatDate(voucherDetails.voucherDatetime) || formatDate(transactionDetails.date) || ''}</div>
        </div>
        <div class="row">
          <div class="label">Employee Name:</div>
          <div class="value">${employeeName}</div>
        </div>
        <div class="row">
          <div class="label">A4 Reading:</div>
          <div class="value">${readingA4}</div>
        </div>
        <div class="row">
          <div class="label">A3 Reading:</div>
          <div class="value">${readingA3}</div>
        </div>
      </div>

      <!-- CUSTOMER INFO -->
      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="row">
          <div class="label">Customer Name:</div>
          <div class="value">${customerData.customerName || ''}</div>
        </div>
        <div class="row">
          <div class="label">Address:</div>
          <div class="value">${customerData.address || ''}</div>
        </div>
        <div class="row">
          <div class="label">ID:</div>
          <div class="value">${customerData.customerId || '-'}</div>
        </div>
        <div class="row">
          <div class="label">Mobile No:</div>
          <div class="value">${customerData.mobileNo || '-'}</div>
        </div>
        <div class="row">
          <div class="label">WhatsApp No:</div>
          <div class="value">${customerData.whatsappNo || '-'}</div>
        </div>
        <div class="row">
          <div class="label">Machine Type:</div>
          <div class="value">${machineType || '-'}</div>
        </div>
        <div class="row">
          <div class="label">Remarks:</div>
          <div class="value">${remarks || '-'}</div>
      </div>
      </div>

      <!-- ITEMS TABLE -->
      ${items.length > 0 ? `
        <table>
          <thead>
            <tr>
            <th>SNO</th>
            <th>Barcode</th>
            <th class="left">Product</th>
            <th>Serial</th>
            <th>Qty</th>
            <th>Free</th>
            <th class="right">Rate</th>
            <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
          ${items.map((item, idx) => {
            const barcode = item.barcode || (item.productId ? String(item.productId) : '');
            return `
          <tr>
            <td>${idx + 1}</td>
            <td>${barcode}</td>
            <td class="left">${item.productName || ''}</td>
            <td>${item.productSerialNo || ''}</td>
            <td>${formatInteger(item.quantity || 0)}</td>
            <td>${formatInteger(item.freeQty || 0)}</td>
            <td class="right">${formatCurrency(item.rate || 0)}</td>
            <td class="right">${formatCurrency(item.net || item.gross || item.amount || 0)}</td>
            </tr>
          `;
          }).join('')}
          </tbody>
        </table>
      ` : ''}

      <!-- SERVICE CHARGES -->
      ${adjustments.length > 0 ? `
        <table>
          <thead>
            <tr>
            <th>SNO</th>
            <th class="left">Description</th>
            <th class="right">Add</th>
            <th class="right">Less</th>
            </tr>
          </thead>
          <tbody>
            ${adjustments.map((adj, idx) => `
            <tr>
              <td>${idx + 1}</td>
            <td class="left">${adj.accountName || adj.account || ''}</td>
            <td class="right">${formatCurrency(adj.addAmount || 0)}</td>
            <td class="right">${formatCurrency(adj.lessAmount || 0)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <!-- SUMMARY -->
      <div class="section summary-box">
        <div class="section-title">Summary</div>
        <div class="summary-row">
          <div class="summary-label">No.of Items:</div>
          <div>${summary.itemCount || items.length || 0}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">No.of Qty:</div>
          <div>${formatInteger(summary.totalQty || 0)}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">Bill Amount:</div>
          <div>${formatCurrency(summary.totalBillValue || 0)}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">Ledger Balance:</div>
          <div>${formatCurrency(summary.ledgerBalance || 0)}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">Received:</div>
          <div>Cash: ${formatCurrency(collections.cash || 0)}, Card: ${formatCurrency(collections.card || 0)}, UPI: ${formatCurrency(collections.upi || 0)}</div>
        </div>
        <div class="summary-row">
          <div class="summary-label">Balance:</div>
          <div>${formatCurrency(collections.balance || 0)}</div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        Free Doorstep Delivery is available weekly. Contact us for details.<br>
        Branches: Trichy, Perambalur, Pudukkottai, Namakkal, Thanjavur, Thiruvarur, Pattukottai
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Preview PDF (opens PDF viewer)
 */
export const previewInvoicePDF = async (invoiceData) => {
  try {
    const html = await generateInvoiceHTML(invoiceData);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Preview Invoice PDF',
    });
  } catch (error) {
    console.error('Error previewing PDF:', error);
    Alert.alert('Error', 'Failed to preview PDF. Please try again.');
  }
};

/**
 * Generate PDF file
 * @param {Object} invoiceData - Invoice data
 * @param {Boolean} includeBase64 - Whether to include base64 data for preview
 */
export const generateInvoicePDF = async (invoiceData, includeBase64 = false) => {
  try {
    const html = await generateInvoiceHTML(invoiceData);
    const result = await Print.printToFileAsync({ 
      html,
      base64: includeBase64,
    });
    return result; // Returns { uri } or { uri, base64 } depending on includeBase64
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Share PDF via WhatsApp
 * Uses WhatsAppNo from customer data
 */
/**
 * Open WhatsApp directly with a phone number
 */
export const openWhatsAppContact = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      Alert.alert('Error', 'WhatsApp number is required.');
      return;
    }

    // Clean the phone number (remove non-numeric characters except +)
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Remove leading + if present and ensure country code format
    if (cleanNumber.startsWith('+')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // If number doesn't start with country code, assume it's Indian (+91)
    // Remove leading 0 if present
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // If number is 10 digits, add India country code (91)
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }

    // WhatsApp URL format: whatsapp://send?phone=<number> or https://wa.me/<number>
    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}`;
    const whatsappWebUrl = `https://wa.me/${cleanNumber}`;

    // Try to open WhatsApp app first
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to web WhatsApp if app is not installed
      const canOpenWeb = await Linking.canOpenURL(whatsappWebUrl);
      if (canOpenWeb) {
        await Linking.openURL(whatsappWebUrl);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device.');
      }
    }
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    Alert.alert('Error', 'Failed to open WhatsApp. Please try again.');
  }
};

/**
 * Open SMS directly with a phone number
 */
export const openSMSContact = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      Alert.alert('Error', 'Mobile number is required.');
      return;
    }

    // Clean the phone number (remove non-numeric characters except +)
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Remove leading + if present
    if (cleanNumber.startsWith('+')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // Remove leading 0 if present
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // For SMS, we typically use the number as-is (without country code for local numbers)
    // But if it's 10 digits, we can use it directly
    // SMS URL format: sms:<number> (works for both iOS and Android)
    const smsUrl = `sms:${cleanNumber}`;

    // Try to open SMS app
    const canOpen = await Linking.canOpenURL(smsUrl);
    
    if (canOpen) {
      await Linking.openURL(smsUrl);
    } else {
      Alert.alert('Error', 'SMS app is not available on this device.');
    }
  } catch (error) {
    console.error('Error opening SMS:', error);
    Alert.alert('Error', 'Failed to open SMS. Please try again.');
  }
};

export const sharePDFViaWhatsApp = async (pdfUri, phoneNumber = null) => {
  try {
    let shareableUri = pdfUri;
    
    // On Android, copy file to document directory for better sharing compatibility
    if (Platform.OS === 'android') {
      try {
        const fileName = `Invoice_${Date.now()}.pdf`;
        const documentDir = FileSystem.documentDirectory;
        const newUri = `${documentDir}${fileName}`;
        
        // Copy file from cache to document directory (legacy API accepts from/to as strings)
        await FileSystem.copyAsync(String(pdfUri), String(newUri));
        
        shareableUri = newUri;
      } catch (copyError) {
        console.log('Could not copy file, using original URI:', copyError);
        // Continue with original URI if copy fails
      }
    }
    
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      Alert.alert('Error', 'Sharing is not available on this device.');
      return;
    }

    // Share the PDF via share dialog - when user selects WhatsApp, PDF will be attached
    await Sharing.shareAsync(shareableUri, {
      mimeType: 'application/pdf',
      dialogTitle: phoneNumber ? `Share Invoice PDF to ${phoneNumber} via WhatsApp` : 'Share Invoice PDF via WhatsApp',
    });
    
    // Note: User can manually search for the contact in WhatsApp after PDF is attached
    // We don't navigate to contact automatically to avoid opening WhatsApp twice
  } catch (error) {
    console.error('Error sharing PDF:', error);
    Alert.alert('Error', 'Failed to share PDF. Please try again.');
  }
};

/**
 * Format invoice data as text message
 */
export const formatInvoiceAsText = (invoiceData) => {
  const {
    title = 'Invoice',
    transactionDetails = {},
    voucherDetails = {},
    customerData = {},
    items = [],
    adjustments = [],
    summary = {},
    collections = {},
  } = invoiceData;

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  const divider = () => `${'-'.repeat(40)}\n`;
  const section = (label) => `\n${label}\n${divider()}`;

  let text = `📄 ${title}\n${'='.repeat(40)}\n`;

  // Header / Bill details
  const billSeries = voucherDetails.voucherSeries ? `${voucherDetails.voucherSeries}-${voucherDetails.voucherNo || ''}` : (voucherDetails.voucherNo || '');
  text += section('Bill Details');
  if (billSeries) text += `Bill No: ${billSeries}\n`;
  if (voucherDetails.voucherDatetime || transactionDetails.date) {
    text += `Bill Date: ${voucherDetails.voucherDatetime || transactionDetails.date}\n`;
  }
  if (customerData.employeeName || transactionDetails.username) {
    text += `Employee Name: ${customerData.employeeName || transactionDetails.username}\n`;
  }
  if (customerData.readingA4) text += `A4 Reading: ${customerData.readingA4}\n`;
  if (customerData.readingA3) text += `A3 Reading: ${customerData.readingA3}\n`;

  // Customer info
  text += section('Customer Information');
  if (customerData.customerName) text += `Name: ${customerData.customerName}\n`;
  if (customerData.address) text += `Address: ${customerData.address}\n`;
  if (customerData.customerId) text += `ID: ${customerData.customerId}\n`;
  if (customerData.mobileNo) text += `Mobile: ${customerData.mobileNo}\n`;
  if (customerData.whatsappNo) text += `WhatsApp: ${customerData.whatsappNo}\n`;
  if (customerData.machineType) text += `Machine Type: ${customerData.machineType}\n`;
  if (customerData.remarks) text += `Remarks: ${customerData.remarks}\n`;
        
  // Items table (compact, one line per item)
  if (items.length > 0) {
    text += section('Items');
    text += `# | Barcode | Product | Serial | Qty | Free | Rate | Amount\n`;
    text += divider();
    items.forEach((item, idx) => {
      const barcode = item.barcode || (item.productId ? String(item.productId) : '-');
      const formatInt = (val) => Math.round(parseFloat(val || 0)).toString();
      const line = [
        idx + 1,
        barcode,
        item.productName || '-',
        item.productSerialNo || '-',
        formatInt(item.quantity),
        formatInt(item.freeQty),
        formatCurrency(item.rate || 0),
        formatCurrency(item.net || item.gross || item.amount || 0),
      ].join(' | ');
      text += `${line}\n`;
    });
  }

  // Adjustments
  if (adjustments.length > 0) {
    text += section('Adjustments');
    text += `# | Description | Add | Less\n`;
    text += divider();
    adjustments.forEach((adj, idx) => {
      text += [
        idx + 1,
        adj.accountName || adj.account || '-',
        formatCurrency(adj.addAmount || 0),
        formatCurrency(adj.lessAmount || 0),
      ].join(' | ') + '\n';
    });
  }

  // Summary
  text += section('Summary');
  const safeNum = (v) => (v !== undefined ? v : 0);
  const formatInt = (val) => Math.round(parseFloat(val || 0)).toString();
  text += `Items: ${summary.itemCount ?? items.length ?? 0}\n`;
  text += `Qty: ${formatInt(safeNum(summary.totalQty))}\n`;
  text += `Bill Amount: ${formatCurrency(summary.totalBillValue)}\n`;
  text += `Ledger Balance: ${formatCurrency(summary.ledgerBalance)}\n`;
  text += `Received - Cash: ${formatCurrency(collections.cash)}, Credit: ${formatCurrency(collections.card || 0)}, UPI: ${formatCurrency(collections.upi || 0)}\n`;
  text += `Balance: ${formatCurrency(collections.balance)}\n`;

  // Footer
  text += `\n${'='.repeat(40)}\n`;
  text += `Free Doorstep Delivery weekly. Contact us for details.\n`;
  text += `Branches: Trichy, Perambalur, Pudukkottai, Namakkal, Thanjavur, Thiruvarur, Pattukottai`;

  return text;
};

/**
 * Share invoice as text via SMS
 * Uses MobileNo from customer data
 * Opens SMS app with formatted invoice text
 */
export const sharePDFViaSMS = async (invoiceData, phoneNumber = null) => {
  try {
    if (!phoneNumber) {
      Alert.alert('Error', 'Mobile number is required to send SMS.');
      return;
    }

    // Clean phone number (remove non-numeric characters except +)
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Format invoice as text
    const invoiceText = formatInvoiceAsText(invoiceData);
    
    // URL encode the text for SMS
    const encodedText = encodeURIComponent(invoiceText);
    
    // Open SMS app with phone number and text pre-filled
    const smsUrl = Platform.select({
      ios: `sms:${cleanPhone}&body=${encodedText}`,
      android: `sms:${cleanPhone}?body=${encodedText}`,
    });
    
    const canOpen = await Linking.canOpenURL(smsUrl);
    if (canOpen) {
      await Linking.openURL(smsUrl);
    } else {
      // Fallback: Try without body (some devices don't support body parameter)
      const fallbackUrl = `sms:${cleanPhone}`;
      const canOpenFallback = await Linking.canOpenURL(fallbackUrl);
      if (canOpenFallback) {
        await Linking.openURL(fallbackUrl);
        // Show alert to inform user to paste the text
        Alert.alert(
          'SMS App Opened',
          'Please paste the invoice text in the message field.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Could not open SMS app on this device.');
      }
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    Alert.alert('Error', 'Failed to open SMS app. Please try again.');
  }
};
