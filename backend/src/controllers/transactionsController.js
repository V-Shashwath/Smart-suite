const { getPool, sql } = require('../config/database');

// Get dropdown options
async function getDropdownOptions(req, res) {
  try {
    const pool = await getPool();
    
    // Get branches
    const branchesResult = await pool.request().query(`
      SELECT BranchId as id, BranchName as name
      FROM Branches
      WHERE IsActive = 1
      ORDER BY BranchName
    `);
    
    // Get locations
    const locationsResult = await pool.request().query(`
      SELECT LocationId as id, LocationName as name
      FROM Locations
      WHERE IsActive = 1
      ORDER BY LocationName
    `);
    
    // Get users/employees
    const usersResult = await pool.request().query(`
      SELECT UserId as id, Username as name
      FROM Users
      WHERE IsActive = 1
      ORDER BY Username
    `);
    
    // Get machine types
    const machineTypesResult = await pool.request().query(`
      SELECT MachineTypeId as id, MachineType as name
      FROM MachineTypes
      WHERE IsActive = 1
      ORDER BY MachineType
    `);
    
    res.json({
      success: true,
      data: {
        branches: branchesResult.recordset,
        locations: locationsResult.recordset,
        employeeUsernames: usersResult.recordset,
        machineTypes: machineTypesResult.recordset
      }
    });
  } catch (error) {
    console.error('Error fetching dropdown options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dropdown options',
      message: error.message
    });
  }
}

// Generate new voucher number
async function generateVoucherNumber(req, res) {
  try {
    const { series } = req.query;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('series', sql.VarChar, series || 'RS24')
      .query(`
        SELECT ISNULL(MAX(CAST(VoucherNo AS INT)), 0) + 1 as nextVoucherNo
        FROM Invoices
        WHERE VoucherSeries = @series
      `);
    
    res.json({
      success: true,
      data: {
        voucherNo: result.recordset[0].nextVoucherNo.toString(),
        voucherSeries: series || 'RS24'
      }
    });
  } catch (error) {
    console.error('Error generating voucher number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate voucher number',
      message: error.message
    });
  }
}

module.exports = {
  getDropdownOptions,
  generateVoucherNumber
};

