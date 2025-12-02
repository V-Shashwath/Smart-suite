const { executeQuery } = require('../config/database');

// Get executive data for auto-populating transaction, voucher, and header
const getExecutiveData = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    // Get current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const datetimeStr = `${dateStr} ${timeStr}`;

    // Generate transaction ID
    const transactionId = `TXN-${now.getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Get next voucher number (you may want to implement proper sequence)
    // For now, using a simple increment based on count
    const voucherCountQuery = `
      SELECT COUNT(*) as count 
      FROM EmployeeSaleInvoiceMain 
      WHERE VoucherSeries = 'RS24'
    `;
    const voucherCountResult = await executeQuery(voucherCountQuery);
    const nextVoucherNo = (voucherCountResult[0]?.count || 0) + 1;

    // Default values - you can customize based on username
    const executiveData = {
      transactionDetails: {
        transactionId: transactionId,
        date: dateStr,
        time: timeStr,
        status: 'Pending',
        branch: 'Head Office', // Default, can be customized per executive
        location: 'Moorthy Location', // Default
        employeeLocation: 'Moorthy Location', // Default
        username: username,
      },
      voucherDetails: {
        voucherSeries: 'RS24', // Default series
        voucherNo: String(nextVoucherNo),
        voucherDatetime: datetimeStr,
      },
      header: {
        date: dateStr,
        billerName: '', // Can be set per executive or left empty
        employeeName: username, // Use username as employee name
        customerId: '',
        customerName: '',
        readingA4: '',
        readingA3: '',
        machineType: '',
        remarks: '',
        gstBill: false,
      },
    };

    return res.status(200).json({
      success: true,
      data: executiveData,
    });
  } catch (error) {
    console.error('Error fetching executive data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching executive data',
      error: error.message,
    });
  }
};

module.exports = {
  getExecutiveData,
};

