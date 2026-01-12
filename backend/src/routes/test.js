const express = require('express');
const router = express.Router();
const sql = require('mssql');

// SQL Server Connection Test Endpoint
// ⚠️ SECURITY WARNING: This is a temporary test endpoint. Remove after testing!
router.get('/sql-test', async (req, res) => {
  try {
    console.log('🧪 Starting SQL Server connection test...');
    
    const config = {
      user: process.env.DB_USER || 'Ikonuser',
      password: process.env.DB_PASSWORD || 'userikon',
      server: process.env.DB_SERVER || '103.98.12.227',
      port: parseInt(process.env.DB_PORT) || 52509,
      database: process.env.DB_NAME || 'CrystalCopier',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      pool: {
        max: 1,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      connectionTimeout: 10000, // 10 seconds
      requestTimeout: 8000, // 8 seconds
    };

    console.log(`🔌 Attempting connection to ${config.server}:${config.port}...`);
    
    const pool = await sql.connect(config);
    console.log('✅ Connection established!');
    
    const result = await pool.request().query('SELECT 1 AS ok, GETDATE() AS serverTime, @@VERSION AS sqlVersion');
    console.log('✅ Query executed successfully!');
    
    await pool.close();
    console.log('✅ Connection closed');

    return res.status(200).json({
      success: true,
      message: 'SQL Server connection successful',
      details: {
        server: config.server,
        port: config.port,
        database: config.database,
        connectionTime: new Date().toISOString(),
      },
      result: result.recordset,
    });
  } catch (err) {
    console.error('❌ SQL Connection Test Failed:', err.message);
    
    let errorType = 'Unknown error';
    let errorDetails = err.message;
    
    // Categorize the error
    if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
      errorType = 'Connection Timeout';
      errorDetails = 'The connection attempt timed out. This usually means the SQL Server firewall is blocking Vercel IPs.';
    } else if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
      errorType = 'Connection Refused';
      errorDetails = 'SQL Server refused the connection. Check if the server is running and port 59320 is open.';
    } else if (err.message.includes('Login failed')) {
      errorType = 'Authentication Failed';
      errorDetails = 'Invalid credentials or user does not have access to the database.';
    } else if (err.message.includes('Cannot find')) {
      errorType = 'Database Not Found';
      errorDetails = 'The specified database does not exist or is not accessible.';
    }
    
    return res.status(500).json({
      success: false,
      errorType: errorType,
      error: errorDetails,
      fullError: process.env.NODE_ENV === 'development' ? err.message : undefined,
      code: err.code,
      troubleshooting: {
        firewall: 'If errorType is "Connection Timeout", whitelist Vercel IP ranges in SQL Server firewall',
        port: 'Verify SQL Server is listening on port 59320',
        credentials: 'Check DB_USER and DB_PASSWORD environment variables in Vercel',
        server: 'Verify SQL Server is running and accessible',
      },
    });
  }
});

module.exports = router;
