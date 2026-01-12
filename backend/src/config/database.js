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
    connectionTimeout: 30000, // Reduced for serverless (30 seconds)
    requestTimeout: 25000, // Reduced for serverless (25 seconds)
    connectTimeout: 30000, // Explicit connect timeout
  },
  pool: {
    max: 5, // Reduced for serverless
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000, // Timeout for acquiring connection from pool
  },
};

let pool = null;

// Initialize connection pool (works for both traditional and serverless)
const getPool = async (retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // If pool exists, try to use it (will reconnect if needed)
      if (pool) {
        try {
          // Test if pool is still valid by creating a request
          const testRequest = pool.request();
          // If this doesn't throw, pool is good
          return pool;
        } catch (err) {
          // Pool is invalid, close it and create new one
          try {
            await pool.close();
          } catch (closeErr) {
            // Ignore close errors
          }
          pool = null;
        }
      }
      
      // Create new connection with timeout
      console.log(`🔄 Attempting database connection (attempt ${attempt + 1}/${retries + 1})...`);
      pool = await Promise.race([
        sql.connect(config),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
        )
      ]);
      console.log('✅ Connected to database');
      return pool;
    } catch (error) {
      console.error(`❌ Database connection error (attempt ${attempt + 1}/${retries + 1}):`, error.message);
      
      // Reset pool on error
      pool = null;
      
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        const errorMessage = error.message.includes('timeout') || error.message.includes('ETIMEDOUT')
          ? `Failed to connect to ${config.server}:${config.port} in 30000ms. Check firewall rules and ensure the database server is accessible.`
          : error.message;
        throw new Error(errorMessage);
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
};

// Test database connection
const testConnection = async () => {
  const pool = await getPool();
  await pool.request().query('SELECT 1');
};

// Execute query helper with retry logic for serverless
const executeQuery = async (query, params = {}, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const pool = await getPool(1); // Get pool with 1 retry
      const request = pool.request();
      
      // Add parameters if provided
      Object.keys(params).forEach((key) => {
        request.input(key, params[key]);
      });
      
      // Execute query with timeout
      const result = await Promise.race([
        request.query(query),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout after 25 seconds')), 25000)
        )
      ]);
      return result.recordset;
    } catch (error) {
      console.error(`Query execution error (attempt ${attempt + 1}/${retries + 1}):`, error.message);
      
      // If connection error and we have retries left, reset pool and retry
      if (attempt < retries && (
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.message.includes('connection') ||
        error.message.includes('timeout')
      )) {
        pool = null;
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
};

// Execute stored procedure with retry logic for serverless
const executeProcedure = async (procedureName, params = {}, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const pool = await getPool(1); // Get pool with 1 retry
      const request = pool.request();
      
      // Add parameters
      Object.keys(params).forEach((key) => {
        request.input(key, params[key]);
      });
      
      // Execute procedure with timeout
      const result = await Promise.race([
        request.execute(procedureName),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stored procedure timeout after 25 seconds')), 25000)
        )
      ]);
      return result.recordset;
    } catch (error) {
      console.error(`Stored procedure execution error (attempt ${attempt + 1}/${retries + 1}):`, error.message);
      
      // If connection error and we have retries left, reset pool and retry
      if (attempt < retries && (
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.message.includes('connection') ||
        error.message.includes('timeout')
      )) {
        pool = null;
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }
      
      throw error;
    }
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


