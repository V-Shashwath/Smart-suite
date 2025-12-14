require('dotenv').config();
const sql = require('mssql');

// Database Configuration
const config = {
  server: process.env.DB_SERVER || '103.98.12.218',
  port: parseInt(process.env.DB_PORT) || 59320,
  database: process.env.DB_NAME || 'CrystalCopier',
  user: process.env.DB_USER || 'Ikonuser',
  password: process.env.DB_PASSWORD || 'userikon',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 60000,
    requestTimeout: 30000,
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
    
    pool = await sql.connect(config);
    console.log('✅ Connected to database');
    return pool;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  const pool = await getPool();
  await pool.request().query('SELECT 1');
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

