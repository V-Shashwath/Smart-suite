const { executeQuery, executeProcedure, getPool, sql } = require('../config/database');
const { getBranchShortName } = require('../utils/branchMapping');

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
    // Format: RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName}
    // Example: RS25-26PAT-Mo
    // NOTE: We show a preview but DON'T increment until user saves
    const fixedPrefix = 'RS';
    
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
    
    // Construct voucher series: RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName}
    // Example: RS25-26PAT-Mo
    let voucherSeries;
    if (branchShortName && shortName) {
      voucherSeries = `${fixedPrefix}${currentYearSuffix}-${nextYearSuffix}${branchShortName}-${shortName}`;
    } else if (branchShortName) {
      voucherSeries = `${fixedPrefix}${currentYearSuffix}-${nextYearSuffix}${branchShortName}`;
    } else if (shortName) {
      voucherSeries = `${fixedPrefix}${currentYearSuffix}-${nextYearSuffix}-${shortName}`;
    } else {
      voucherSeries = `${fixedPrefix}${currentYearSuffix}-${nextYearSuffix}`;
    }
    
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

