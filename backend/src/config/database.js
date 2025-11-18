const sql = require('mssql');

// Database configuration
// NOTE: In production, use environment variables (.env file)
// For now, using direct configuration
const config = {
  server: '103.98.12.218\\sqlexpress',
  port: 59320,
  user: 'Ikonuser',
  password: 'userikon',
  database: 'SmartSuite', // Change this to your actual database name
  options: {
    encrypt: false, // Use true if you're on Azure
    trustServerCertificate: true, // Change to false in production
    enableArithAbort: true,
    instanceName: 'sqlexpress'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  requestTimeout: 30000,
  connectionTimeout: 30000
};

// Connection pool
let pool = null;

// Get database connection pool
async function getPool() {
  try {
    if (pool) {
      return pool;
    }
    
    console.log('Creating new database connection pool...');
    pool = await sql.connect(config);
    console.log('✅ Database connected successfully!');
    
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request().query('SELECT 1 AS test');
    console.log('✅ Database test query successful:', result.recordset);
    return true;
  } catch (error) {
    console.error('❌ Database test query failed:', error.message);
    return false;
  }
}

// Close database connection
async function closePool() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
}

module.exports = {
  sql,
  getPool,
  testConnection,
  closePool,
  config
};

