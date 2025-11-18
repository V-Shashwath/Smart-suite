const { getPool, sql } = require('../config/database');

// Get all customers
async function getAllCustomers(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        CustomerId as id,
        CustomerName as name,
        CustomerId as customerId,
        MobileNo as mobileNo,
        WhatsAppNo as whatsappNo,
        CustomerType as customerType,
        Email,
        Address,
        IsActive
      FROM Customers
      WHERE IsActive = 1
      ORDER BY CustomerName
    `);
    
    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      message: error.message
    });
  }
}

// Get customer by ID
async function getCustomerById(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('customerId', sql.VarChar, id)
      .query(`
        SELECT 
          CustomerId as id,
          CustomerName as name,
          CustomerId as customerId,
          MobileNo as mobileNo,
          WhatsAppNo as whatsappNo,
          CustomerType as customerType,
          Email,
          Address,
          CreatedDate,
          IsActive
        FROM Customers
        WHERE CustomerId = @customerId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer',
      message: error.message
    });
  }
}

// Search customers
async function searchCustomers(req, res) {
  try {
    const { query } = req.query;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('searchQuery', sql.VarChar, `%${query}%`)
      .query(`
        SELECT 
          CustomerId as id,
          CustomerName as name,
          CustomerId as customerId,
          MobileNo as mobileNo,
          WhatsAppNo as whatsappNo,
          CustomerType as customerType
        FROM Customers
        WHERE (CustomerName LIKE @searchQuery 
          OR CustomerId LIKE @searchQuery 
          OR MobileNo LIKE @searchQuery)
          AND IsActive = 1
        ORDER BY CustomerName
      `);
    
    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search customers',
      message: error.message
    });
  }
}

// Create new customer
async function createCustomer(req, res) {
  try {
    const { customerId, name, mobileNo, whatsappNo, customerType, email, address } = req.body;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('customerId', sql.VarChar, customerId)
      .input('name', sql.VarChar, name)
      .input('mobileNo', sql.VarChar, mobileNo)
      .input('whatsappNo', sql.VarChar, whatsappNo || mobileNo)
      .input('customerType', sql.VarChar, customerType || 'Regular')
      .input('email', sql.VarChar, email || null)
      .input('address', sql.VarChar, address || null)
      .query(`
        INSERT INTO Customers (CustomerId, CustomerName, MobileNo, WhatsAppNo, CustomerType, Email, Address, IsActive)
        VALUES (@customerId, @name, @mobileNo, @whatsappNo, @customerType, @email, @address, 1);
        
        SELECT 
          CustomerId as id,
          CustomerName as name,
          MobileNo as mobileNo,
          WhatsAppNo as whatsappNo,
          CustomerType as customerType
        FROM Customers
        WHERE CustomerId = @customerId;
      `);
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer',
      message: error.message
    });
  }
}

module.exports = {
  getAllCustomers,
  getCustomerById,
  searchCustomers,
  createCustomer
};

