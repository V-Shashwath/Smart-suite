import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking, Alert, Platform } from 'react-native';

/**
 * Generate HTML content for invoice PDF
 */
export const generateInvoiceHTML = (invoiceData) => {
  const {
    title = 'Invoice',
    transactionDetails = {},
    voucherDetails = {},
    customerData = {},
    items = [],
    adjustments = [],
    summary = {},
    collections = {},
    bodyItems = [], // For Cash/Bank Receipts
    readings = {}, // For Rental screens
  } = invoiceData;

  const formatCurrency = (amount) => {
    return `₹ ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dateString;
  };

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .section {
            page-break-inside: avoid;
          }
          table {
            page-break-inside: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
        body {
          font-family: Arial, sans-serif;
          margin: 15mm;
          padding: 0;
          color: #333;
          font-size: 11px;
          line-height: 1.3;
          max-width: 100%;
          overflow-x: hidden;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #FF5722;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #FF5722;
          margin-bottom: 10px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #C62828;
          margin-bottom: 5px;
        }
        .invoice-title {
          font-size: 20px;
          color: #666;
          margin-top: 10px;
        }
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #FF5722;
          border-bottom: 2px solid #FF5722;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 5px 0;
        }
        .info-label {
          font-weight: bold;
          width: 40%;
        }
        .info-value {
          width: 60%;
          text-align: right;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          page-break-inside: auto;
          table-layout: fixed;
          word-wrap: break-word;
        }
        thead {
          display: table-header-group;
        }
        tbody tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th {
          background-color: #FF5722;
          color: white;
          padding: 8px 5px;
          text-align: left;
          font-weight: bold;
          font-size: 11px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        td {
          padding: 6px 5px;
          border-bottom: 1px solid #ddd;
          font-size: 11px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .summary {
          margin-top: 20px;
          border-top: 2px solid #333;
          padding-top: 15px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .summary-label {
          font-weight: bold;
        }
        .summary-value {
          font-weight: bold;
          color: #FF5722;
        }
        .total-row {
          font-size: 18px;
          font-weight: bold;
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        .payment-summary {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-top: 10px;
        }
        .highlight {
          background-color: #fff3cd;
          padding: 5px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">SS</div>
        <div class="company-name">Smart Suite</div>
        <div class="invoice-title">${title}</div>
      </div>

      <!-- Transaction Details -->
      ${transactionDetails.date || transactionDetails.transactionId ? `
      <div class="section">
        <div class="section-title">Transaction Details</div>
        ${transactionDetails.transactionId ? `
        <div class="info-row">
          <span class="info-label">Transaction ID:</span>
          <span class="info-value">${transactionDetails.transactionId}</span>
        </div>
        ` : ''}
        ${transactionDetails.date ? `
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${formatDate(transactionDetails.date)}</span>
        </div>
        ` : ''}
        ${transactionDetails.time ? `
        <div class="info-row">
          <span class="info-label">Time:</span>
          <span class="info-value">${transactionDetails.time}</span>
        </div>
        ` : ''}
        ${transactionDetails.branch ? `
        <div class="info-row">
          <span class="info-label">Branch:</span>
          <span class="info-value">${transactionDetails.branch}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <!-- Voucher Details -->
      ${voucherDetails.voucherNo || voucherDetails.voucherSeries ? `
      <div class="section">
        <div class="section-title">Voucher Details</div>
        ${voucherDetails.voucherSeries ? `
        <div class="info-row">
          <span class="info-label">Voucher Series:</span>
          <span class="info-value">${voucherDetails.voucherSeries}</span>
        </div>
        ` : ''}
        ${voucherDetails.voucherNo ? `
        <div class="info-row">
          <span class="info-label">Voucher No:</span>
          <span class="info-value">${voucherDetails.voucherNo}</span>
        </div>
        ` : ''}
        ${voucherDetails.voucherDatetime ? `
        <div class="info-row">
          <span class="info-label">Date & Time:</span>
          <span class="info-value">${formatDate(voucherDetails.voucherDatetime)}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <!-- Customer Details -->
      ${customerData.customerId || customerData.customerName || customerData.mobileNo ? `
      <div class="section">
        <div class="section-title">Customer Details</div>
        ${customerData.customerId ? `
        <div class="info-row">
          <span class="info-label">Customer ID:</span>
          <span class="info-value">${customerData.customerId}</span>
        </div>
        ` : ''}
        ${customerData.customerName ? `
        <div class="info-row">
          <span class="info-label">Customer Name:</span>
          <span class="info-value">${customerData.customerName}</span>
        </div>
        ` : ''}
        ${customerData.mobileNo ? `
        <div class="info-row">
          <span class="info-label">Mobile No:</span>
          <span class="info-value">${customerData.mobileNo}</span>
        </div>
        ` : ''}
        ${customerData.customerType ? `
        <div class="info-row">
          <span class="info-label">Customer Type:</span>
          <span class="info-value">${customerData.customerType}</span>
        </div>
        ` : ''}
        ${customerData.whatsappNo ? `
        <div class="info-row">
          <span class="info-label">WhatsApp No:</span>
          <span class="info-value">${customerData.whatsappNo}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <!-- Readings (for Rental screens) -->
      ${readings && Object.keys(readings).length > 0 ? `
      <div class="section">
        <div class="section-title">Readings</div>
        <table>
          <tr>
            ${Object.keys(readings).map(key => `<th>${key.replace(/([A-Z])/g, ' $1').trim()}</th>`).join('')}
          </tr>
          <tr>
            ${Object.values(readings).map(value => `<td class="text-center">${value}</td>`).join('')}
          </tr>
        </table>
      </div>
      ` : ''}

      <!-- Items Table -->
      ${items.length > 0 ? `
      <div class="section">
        <div class="section-title">Items</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">S.No</th>
              <th style="width: ${items.some(item => item.productSerialNo) ? '25%' : '35%'}; max-width: ${items.some(item => item.productSerialNo) ? '25%' : '35%'};}">Product/Description</th>
              ${items.some(item => item.productSerialNo) ? '<th style="width: 15%;">Serial No</th>' : ''}
              <th style="width: 10%;" class="text-right">Qty</th>
              <th style="width: 12%;" class="text-right">Rate</th>
              <th style="width: 12%;" class="text-right">Gross</th>
              <th style="width: 12%;" class="text-right">Discount</th>
              <th style="width: 14%;" class="text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => `
            <tr>
              <td style="width: 5%;">${idx + 1}</td>
              <td style="width: ${items.some(item => item.productSerialNo) ? '25%' : '35%'}; max-width: ${items.some(item => item.productSerialNo) ? '25%' : '35%'}; word-wrap: break-word;">${(item.productName || item.product || item.account || 'N/A').substring(0, 30)}${(item.productName || item.product || item.account || 'N/A').length > 30 ? '...' : ''}</td>
              ${items.some(i => i.productSerialNo) ? `<td style="width: 15%; word-wrap: break-word;">${(item.productSerialNo || '-').substring(0, 15)}${(item.productSerialNo || '-').length > 15 ? '...' : ''}</td>` : ''}
              <td style="width: 10%;" class="text-right">${item.quantity || 0}</td>
              <td style="width: 12%;" class="text-right">${formatCurrency(item.rate || 0)}</td>
              <td style="width: 12%;" class="text-right">${formatCurrency(item.gross || 0)}</td>
              <td style="width: 12%;" class="text-right">${formatCurrency(item.discount || 0)}</td>
              <td style="width: 14%;" class="text-right">${formatCurrency(item.net || item.gross || item.amount || 0)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Body Items (for Cash/Bank Receipts) -->
      ${bodyItems.length > 0 ? `
      <div class="section">
        <div class="section-title">Transaction Items</div>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Account</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Discount</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            ${bodyItems.map((item, idx) => `
            <tr>
              <td>${item.sno || idx + 1}</td>
              <td>${item.account || 'N/A'}</td>
              <td class="text-right">${formatCurrency(item.amount || 0)}</td>
              <td class="text-right">${formatCurrency(item.discount || 0)}</td>
              <td>${item.comments1 || item.comments2 || ''}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Adjustments -->
      ${adjustments.length > 0 ? `
      <div class="section">
        <div class="section-title">Adjustments</div>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Account</th>
              <th class="text-right">Add</th>
              <th class="text-right">Less</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${adjustments.map((adj, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${adj.accountName || adj.account || 'N/A'}</td>
              <td class="text-right">${formatCurrency(adj.addAmount || 0)}</td>
              <td class="text-right">${formatCurrency(adj.lessAmount || 0)}</td>
              <td class="text-right">${formatCurrency((adj.addAmount || 0) - (adj.lessAmount || 0))}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Summary -->
      ${summary.totalBillValue !== undefined || summary.totalValue !== undefined || summary.totalAmount !== undefined ? `
      <div class="section summary">
        <div class="section-title">Summary</div>
        ${summary.itemCount !== undefined ? `
        <div class="summary-row">
          <span class="summary-label">Item Count:</span>
          <span class="summary-value">${summary.itemCount}</span>
        </div>
        ` : ''}
        ${summary.totalQty !== undefined ? `
        <div class="summary-row">
          <span class="summary-label">Total Quantity:</span>
          <span class="summary-value">${summary.totalQty}</span>
        </div>
        ` : ''}
        ${summary.totalGross !== undefined ? `
        <div class="summary-row">
          <span class="summary-label">Total Gross:</span>
          <span class="summary-value">${formatCurrency(summary.totalGross)}</span>
        </div>
        ` : ''}
        ${summary.totalDiscount !== undefined ? `
        <div class="summary-row">
          <span class="summary-label">Total Discount:</span>
          <span class="summary-value">${formatCurrency(summary.totalDiscount)}</span>
        </div>
        ` : ''}
        ${summary.totalAdd !== undefined ? `
        <div class="summary-row">
          <span class="summary-label">Total Add:</span>
          <span class="summary-value">${formatCurrency(summary.totalAdd)}</span>
        </div>
        ` : ''}
        ${summary.totalLess !== undefined ? `
        <div class="summary-row">
          <span class="summary-label">Total Less:</span>
          <span class="summary-value">${formatCurrency(summary.totalLess)}</span>
        </div>
        ` : ''}
        ${summary.totalAmount !== undefined ? `
        <div class="summary-row">
          <span class="summary-label">Total Amount:</span>
          <span class="summary-value">${formatCurrency(summary.totalAmount)}</span>
        </div>
        ` : ''}
        ${summary.totalValue !== undefined ? `
        <div class="summary-row">
          <span class="summary-label">Total Value:</span>
          <span class="summary-value">${formatCurrency(summary.totalValue)}</span>
        </div>
        ` : ''}
        ${summary.totalBillValue !== undefined ? `
        <div class="summary-row total-row">
          <span class="summary-label">Total Bill Value:</span>
          <span class="summary-value">${formatCurrency(summary.totalBillValue)}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <!-- Payment Details / Collections -->
      ${collections && (collections.cash !== undefined || collections.card !== undefined || collections.upi !== undefined || collections.balance !== undefined) ? `
      <div class="section">
        <div class="section-title">Payment Details</div>
        ${collections.cash !== undefined && collections.cash > 0 ? `
        <div class="info-row">
          <span class="info-label">Cash Payment:</span>
          <span class="info-value">${formatCurrency(collections.cash)}</span>
        </div>
        ` : ''}
        ${collections.card !== undefined && collections.card > 0 ? `
        <div class="info-row">
          <span class="info-label">Card Payment:</span>
          <span class="info-value">${formatCurrency(collections.card)}</span>
        </div>
        ` : ''}
        ${collections.upi !== undefined && collections.upi > 0 ? `
        <div class="info-row">
          <span class="info-label">UPI Payment:</span>
          <span class="info-value">${formatCurrency(collections.upi)}</span>
        </div>
        ` : ''}
        ${collections.cash !== undefined || collections.card !== undefined || collections.upi !== undefined ? `
        <div class="summary-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
          <span class="summary-label">Total Collected:</span>
          <span class="summary-value">${formatCurrency((collections.cash || 0) + (collections.card || 0) + (collections.upi || 0))}</span>
        </div>
        ` : ''}
        ${collections.balance !== undefined ? `
        <div class="summary-row total-row">
          <span class="summary-label">Outstanding Balance:</span>
          <span class="summary-value" style="color: ${collections.balance > 0 ? '#f44336' : '#4caf50'};">${formatCurrency(collections.balance)}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Smart Suite - Business Management System</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Generate PDF from invoice data
 * Returns both the file URI (for sharing) and base64 (for preview)
 */
export const generateInvoicePDF = async (invoiceData) => {
  try {
    const html = generateInvoiceHTML(invoiceData);
    
    const { uri, base64 } = await Print.printToFileAsync({
      html,
      base64: true,
    });

    console.log('PDF generated successfully at:', uri);
    return { uri, base64 };
  } catch (error) {
    console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    throw error;
  }
};

/**
 * Share PDF via WhatsApp
 */
export const sharePDFViaWhatsApp = async (pdfUri, phoneNumber = null) => {
  try {
    let shareableUri = pdfUri;
    
    // On Android, copy file to document directory for better sharing compatibility
    if (Platform.OS === 'android') {
      try {
        const fileName = `Invoice_${Date.now()}.pdf`;
        const documentDir = FileSystem.documentDirectory;
        const newUri = `${documentDir}${fileName}`;
        
        // Copy file from cache to document directory
        await FileSystem.copyAsync({
          from: pdfUri,
          to: newUri,
        });
        
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

    // Share via system share dialog (user can choose WhatsApp or any other app)
    await Sharing.shareAsync(shareableUri, {
      mimeType: 'application/pdf',
      dialogTitle: phoneNumber ? 'Share Invoice PDF via WhatsApp' : 'Share Invoice PDF',
    });
    
    // Note: On Android, WhatsApp can be selected from the share dialog
    // Direct WhatsApp URL opening with file attachment is not supported
  } catch (error) {
    console.error('Error sharing PDF:', error);
    Alert.alert('Error', 'Failed to share PDF. Please try again.');
  }
};

/**
 * Preview PDF (opens PDF viewer)
 * Uses Sharing API which shows system dialog where user can choose PDF viewer
 */
export const previewInvoicePDF = async (invoiceData) => {
  try {
    let { uri: pdfUri } = await generateInvoicePDF(invoiceData);
    
    // On Android, copy file to document directory for better sharing compatibility
    if (Platform.OS === 'android') {
      try {
        const fileName = `Invoice_${Date.now()}.pdf`;
        const documentDir = FileSystem.documentDirectory;
        const newUri = `${documentDir}${fileName}`;
        
        // Copy file from cache to document directory
        await FileSystem.copyAsync({
          from: pdfUri,
          to: newUri,
        });
        
        pdfUri = newUri;
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

    // Use Sharing API - this will show system dialog where user can choose PDF viewer
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Open PDF with',
      UTI: Platform.OS === 'ios' ? 'com.adobe.pdf' : undefined,
    });
  } catch (error) {
    console.error('Error previewing PDF:', error);
    Alert.alert('Error', 'Failed to preview PDF. Please try again.');
  }
};

