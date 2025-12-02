require('dotenv').config();
const sql = require('mssql');

// Database Configuration
// Format 3: IP with port only (no instance) - This format works!
// Values are loaded from .env file
const config = {
  server: process.env.DB_SERVER || '103.98.12.218', // IP address only
  port: parseInt(process.env.DB_PORT) || 59320, // Custom port (direct connection, no instance name needed)
  database: process.env.DB_NAME || 'mobileApp',
  user: process.env.DB_USER || 'Ikonuser',
  password: process.env.DB_PASSWORD || 'userikon',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 60000, // 60 seconds
    requestTimeout: 30000,
    // Note: No instanceName - port 59320 is the direct SQL Server port
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

// Initialize connection pool
const getPool = async () => {
  try {
    if (pool) {
      return pool;
    }
    
    console.log('🔌 Attempting to connect to SQL Server...');
    console.log(`   Server: ${config.server}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server - mobileApp database');
    return pool;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('\n💡 Troubleshooting steps:');
    console.error('1. Verify SQL Server is running and accessible');
    console.error('2. Check if you can connect via SSMS with:');
    console.error(`   Server: ${config.server},${config.port}`);
    console.error(`   Login: ${config.user} / ${config.password}`);
    console.error('3. Check Windows Firewall allows port 59320');
    console.error('4. Verify SQL Server allows remote connections');
    console.error('5. Ensure database "mobileApp" exists');
    console.error('6. Check if SQL Server Browser service is running');
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT @@VERSION AS Version');
    console.log('✅ Database connection test successful');
    return result.recordset[0];
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    throw error;
  }
};

// Execute query helper
const executeQuery = async (query, params = {}) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Add parameters if provided
    Object.keys(params).forEach((key) => {
      request.input(key, params[key]);
    });
    
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

// Execute stored procedure
const executeProcedure = async (procedureName, params = {}) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Add parameters
    Object.keys(params).forEach((key) => {
      request.input(key, params[key]);
    });
    
    const result = await request.execute(procedureName);
    return result.recordset;
  } catch (error) {
    console.error('Stored procedure execution error:', error);
    throw error;
  }
};

// Close connection pool
const closePool = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Database connection pool closed');
    }
  } catch (error) {
    console.error('Error closing connection pool:', error);
  }
};

module.exports = {
  getPool,
  testConnection,
  executeQuery,
  executeProcedure,
  closePool,
  sql,
};

