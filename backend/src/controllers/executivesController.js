const { executeQuery, executeProcedure, getPool, sql } = require('../config/database');

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

    // Get employee data from Employees table
    const employeeResult = await executeProcedure('sp_GetEmployeeData', {
      Username: username,
    });

    if (!employeeResult || employeeResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or inactive',
      });
    }

    const employee = employeeResult[0];

    // Get current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const datetimeStr = `${dateStr} ${timeStr}`;

    // Generate transaction ID
    const transactionId = `TXN-${now.getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Get voucher series and calculate preview of next voucher number (without incrementing)
    // Format: Just a number (1, 2, 3, etc.) - incremental
    // NOTE: We show a preview but DON'T increment until user saves
    const voucherSeries = employee.VoucherSeries || 'ESI';
    const lastVoucherNumber = employee.LastVoucherNumber || 0;
    const nextPreviewNumber = lastVoucherNumber + 1; // Preview only, not saved yet
    
    // Generate preview voucher number (just the number, for display only)
    const voucherNoPreview = String(nextPreviewNumber);

    // Populate executive data from Employees table
    const executiveData = {
      transactionDetails: {
        transactionId: transactionId,
        date: dateStr,
        time: timeStr,
        status: 'Pending',
        branch: employee.Branch || 'Head Office',
        location: employee.Location || 'Moorthy Location',
        employeeLocation: employee.EmployeeLocation || 'Moorthy Location',
        username: employee.Username,
      },
      voucherDetails: {
        voucherSeries: voucherSeries,
        voucherNo: voucherNoPreview, // Preview only - will be generated on save
        voucherDatetime: datetimeStr,
      },
      header: {
        date: dateStr,
        billerName: employee.BillerName || '',
        employeeName: employee.EmployeeName || employee.Username,
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

// Authenticate employee (login)
const authenticateEmployee = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Authenticate using stored procedure
    const authResult = await executeProcedure('sp_AuthenticateEmployee', {
      Username: username,
      Password: password,
    });

    if (!authResult || authResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const employee = authResult[0];

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        employeeId: employee.EmployeeID,
        username: employee.Username,
        employeeName: employee.EmployeeName,
        employeeInitials: employee.EmployeeInitials,
        branch: employee.Branch,
        location: employee.Location,
        employeeLocation: employee.EmployeeLocation,
        billerName: employee.BillerName,
        status: employee.Status,
      },
    });
  } catch (error) {
    console.error('Error authenticating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Error authenticating employee',
      error: error.message,
    });
  }
};

// Authenticate supervisor (login)
const authenticateSupervisor = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Authenticate using stored procedure
    const authResult = await executeProcedure('sp_AuthenticateSupervisor', {
      Username: username,
      Password: password,
    });

    if (!authResult || authResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const supervisor = authResult[0];

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        supervisorId: supervisor.SupervisorID,
        username: supervisor.Username,
        supervisorName: supervisor.SupervisorName,
        branch: supervisor.Branch,
        location: supervisor.Location,
        status: supervisor.Status,
      },
    });
  } catch (error) {
    console.error('Error authenticating supervisor:', error);
    return res.status(500).json({
      success: false,
      message: 'Error authenticating supervisor',
      error: error.message,
    });
  }
};

module.exports = {
  getExecutiveData,
  authenticateEmployee,
  authenticateSupervisor,
};

