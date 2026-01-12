const { executeQuery, executeProcedure, getPool, sql } = require('../config/database');
const { getBranchShortName } = require('../utils/branchMapping');

// Get executive data for auto-populating transaction, voucher, and header
const getExecutiveData = async (req, res) => {
  try {
    const { username } = req.params;
    const { screen } = req.query; // Get screen type from query parameter (e.g., ?screen=SalesReturns)

    // Debug logging
    console.log(`🔍 getExecutiveData called for username: ${username}`);
    console.log(`   Query params:`, req.query);
    console.log(`   Screen parameter received: "${screen}"`);
    console.log(`   Screen type check - isSalesReturns: ${screen === 'SalesReturns'}, isRentalService: ${screen === 'RentalService'}, isRentalMonthlyBill: ${screen === 'RentalMonthlyBill'}`);

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
    // Determine prefix and format based on screen type
    // For EmployeeSaleInvoice: RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName} (e.g., RS25-26PAT-Mo)
    // For SalesReturns: SRS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName} (e.g., SRS-25PAT-JD)
    // For RentalService: RS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName} (e.g., RS-25PAT-Mo)
    // For RentalMonthlyBill: RMB-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName} (e.g., RMB-25NAM-JD)
    // Default to 'RS' if screen not specified (backward compatibility)
    // Make comparison case-insensitive to handle variations
    const screenLower = (screen || '').toLowerCase();
    const isSalesReturns = screenLower === 'salesreturns';
    const isRentalService = screenLower === 'rentalservice';
    const isRentalMonthlyBill = screenLower === 'rentalmonthlybill';
    const basePrefix = isSalesReturns ? 'SRS' : (isRentalMonthlyBill ? 'RMB' : 'RS');
    
    console.log(`   Screen comparison - Original: "${screen}", Lowercase: "${screenLower}"`);
    console.log(`   isSalesReturns: ${isSalesReturns}, isRentalService: ${isRentalService}, isRentalMonthlyBill: ${isRentalMonthlyBill}`);
    
    // Get last 2 digits of current year and next year
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const currentYearSuffix = String(currentYear).slice(-2);
    const nextYearSuffix = String(nextYear).slice(-2);
    
    // Get branch short name from employee's branch
    const branchName = employee.Branch || '';
    const branchShortName = getBranchShortName(branchName);
    
    // Get employee ShortName
    const shortName = employee.ShortName || '';
    
    // Construct voucher series based on screen type
    let voucherSeries;
    console.log(`   Building voucher series - isSalesReturns: ${isSalesReturns}, isRentalService: ${isRentalService}, isRentalMonthlyBill: ${isRentalMonthlyBill}`);
    console.log(`   Branch: ${branchName}, BranchShortName: ${branchShortName}, ShortName: ${shortName}`);
    
    if (isSalesReturns) {
      // Sales Returns format: SRS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
      // Example: SRS-25PAT-JD
      console.log(`   Using SalesReturns format`);
      if (branchShortName && shortName) {
        voucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
      } else if (branchShortName) {
        voucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
      } else if (shortName) {
        voucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
      } else {
        voucherSeries = `${basePrefix}-${currentYearSuffix}`;
      }
    } else if (isRentalService) {
      // Rental Service format: RS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
      // Example: RS-25PAT-Mo
      console.log(`   ✅ Using RentalService format`);
      if (branchShortName && shortName) {
        voucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
      } else if (branchShortName) {
        voucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
      } else if (shortName) {
        voucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
      } else {
        voucherSeries = `${basePrefix}-${currentYearSuffix}`;
      }
    } else if (isRentalMonthlyBill) {
      // Rental Monthly Bill format: RMB-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
      // Example: RMB-25NAM-JD
      console.log(`   ✅ Using RentalMonthlyBill format`);
      if (branchShortName && shortName) {
        voucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
      } else if (branchShortName) {
        voucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
      } else if (shortName) {
        voucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
      } else {
        voucherSeries = `${basePrefix}-${currentYearSuffix}`;
      }
    } else {
      // Employee Sale Invoice format: RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName}
      // Example: RS25-26PAT-Mo
      console.log(`   Using EmployeeSaleInvoice format (default)`);
      if (branchShortName && shortName) {
        voucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}${branchShortName}-${shortName}`;
      } else if (branchShortName) {
        voucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}${branchShortName}`;
      } else if (shortName) {
        voucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}-${shortName}`;
      } else {
        voucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}`;
      }
    }
    
    console.log(`📋 Generated preview voucher series for screen "${screen || 'EmployeeSaleInvoice'}": ${voucherSeries}`);
    
    const lastVoucherNumber = employee.LastVoucherNumber || 0;
    const nextPreviewNumber = lastVoucherNumber + 1; // Preview only, not saved yet
    
    console.log(`   🔢 Preview voucher number: LastVoucherNumber=${lastVoucherNumber}, NextPreview=${nextPreviewNumber} for employee: ${username}`);
    
    // Generate preview voucher number (just the number, for display only)
    const voucherNoPreview = String(nextPreviewNumber);

    // Populate executive data from Employees table
    const executiveData = {
      transactionDetails: {
        transactionId: transactionId,
        date: dateStr,
        time: timeStr,
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
        shortName: employee.ShortName || '', // Include ShortName for frontend use
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
      console.log(`❌ Employee authentication failed for username: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }
    
    console.log(`✅ Employee authenticated: ${username}`);

    const employee = authResult[0];

    // Get screen assignments for this employee
    let assignedScreens = [];
    try {
      const screenResult = await executeProcedure('sp_GetExecutiveScreenAssignments', {
        EmployeeID: employee.EmployeeID,
      });
      assignedScreens = screenResult ? screenResult.map((row) => row.ScreenRoute) : [];
      console.log(`📱 Screen assignments for ${employee.Username} (ID: ${employee.EmployeeID}):`, assignedScreens);
    } catch (screenError) {
      console.warn('⚠️ Warning: Could not fetch screen assignments for employee:', screenError.message);
      // Continue without screen assignments - will default to empty array
      assignedScreens = [];
    }

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        employeeId: employee.EmployeeID,
        username: employee.Username,
        employeeName: employee.EmployeeName,
        shortName: employee.ShortName,
        branch: employee.Branch,
        location: employee.Location,
        employeeLocation: employee.EmployeeLocation,
        billerName: employee.BillerName,
        assignedScreens,
      },
    });
  } catch (error) {
    console.error('Error authenticating employee:', error);
    
    // Provide more helpful error messages for connection issues
    let errorMessage = error.message;
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT') || error.message.includes('Failed to connect')) {
      errorMessage = 'Database connection timeout. Please check if the database server is accessible and firewall rules allow connections from Vercel.';
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error authenticating employee',
      error: errorMessage,
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
    console.log(`🔐 Attempting supervisor authentication for: ${username}`);
    console.log(`   Password provided: "${password}"`);
    
    // First, let's check if supervisor exists (for debugging)
    try {
      const checkQuery = `SELECT SupervisorID, Username, Password, Status FROM CrystalCopier.dbo.Supervisors WHERE Username = @username`;
      const pool = await getPool();
      const checkRequest = pool.request();
      checkRequest.input('username', sql.NVarChar, username);
      const checkResult = await checkRequest.query(checkQuery);
      
      if (checkResult.recordset.length > 0) {
        const supervisor = checkResult.recordset[0];
        console.log(`   Found supervisor in database:`);
        console.log(`     Username: "${supervisor.Username}"`);
        console.log(`     Password in DB: "${supervisor.Password}"`);
        console.log(`     Status: "${supervisor.Status}"`);
        console.log(`     Password match: ${supervisor.Password === password}`);
      } else {
        console.log(`   ❌ No supervisor found with username: "${username}"`);
      }
    } catch (checkError) {
      console.warn(`   ⚠️ Could not check supervisor existence:`, checkError.message);
    }
    
    const authResult = await executeProcedure('sp_AuthenticateSupervisor', {
      Username: username,
      Password: password,
    });

    if (!authResult || authResult.length === 0) {
      console.log(`❌ Supervisor authentication failed for username: ${username}`);
      console.log(`   Check: 1) Supervisor exists in Supervisors table`);
      console.log(`         2) Username matches exactly: "${username}"`);
      console.log(`         3) Password matches exactly: "${password}"`);
      console.log(`         4) Status is 'Active' or NULL`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }
    
    const supervisor = authResult[0];
    console.log(`✅ Supervisor authenticated: ${username} (ID: ${supervisor.SupervisorID})`);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: {
        supervisorId: supervisor.SupervisorID,
        username: supervisor.Username,
        supervisorName: supervisor.SupervisorName,
        branch: supervisor.Branch,
        location: supervisor.Location,
      },
    });
  } catch (error) {
    console.error('Error authenticating supervisor:', error);
    
    // Provide more helpful error messages for connection issues
    let errorMessage = error.message;
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT') || error.message.includes('Failed to connect')) {
      errorMessage = 'Database connection timeout. Please check if the database server is accessible and firewall rules allow connections from Vercel.';
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error authenticating supervisor',
      error: errorMessage,
    });
  }
};

module.exports = {
  getExecutiveData,
  authenticateEmployee,
  authenticateSupervisor,
};

