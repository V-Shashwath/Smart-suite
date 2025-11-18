const { getPool, sql } = require('../config/database');

// Get all adjustment accounts
async function getAllAdjustments(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        AdjustmentAccountId as id,
        AccountName as name,
        AccountType as type,
        IsActive
      FROM AdjustmentAccounts
      WHERE IsActive = 1
      ORDER BY AccountName
    `);
    
    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching adjustments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch adjustments',
      message: error.message
    });
  }
}

module.exports = {
  getAllAdjustments
};

