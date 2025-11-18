const { getPool, sql } = require('../config/database');

// Get all products
async function getAllProducts(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        ProductId as id,
        ProductName as name,
        ProductBarcode as barcode,
        Rate as rate,
        HasUniqueSerialNo as hasUniqueSerialNo,
        Category,
        Stock,
        IsActive
      FROM Products
      WHERE IsActive = 1
      ORDER BY ProductName
    `);
    
    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
}

// Get product by ID
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('productId', sql.Int, id)
      .query(`
        SELECT 
          ProductId as id,
          ProductName as name,
          ProductBarcode as barcode,
          Rate as rate,
          HasUniqueSerialNo as hasUniqueSerialNo,
          Category,
          Stock,
          Description,
          IsActive
        FROM Products
        WHERE ProductId = @productId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
}

// Get product by barcode
async function getProductByBarcode(req, res) {
  try {
    const { barcode } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('barcode', sql.VarChar, barcode)
      .query(`
        SELECT 
          ProductId as id,
          ProductName as name,
          ProductBarcode as barcode,
          Rate as rate,
          HasUniqueSerialNo as hasUniqueSerialNo,
          Category,
          Stock,
          Description,
          IsActive
        FROM Products
        WHERE ProductBarcode = @barcode AND IsActive = 1
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found with this barcode'
      });
    }
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
}

// Get products by category
async function getProductsByCategory(req, res) {
  try {
    const { category } = req.params;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('category', sql.VarChar, category)
      .query(`
        SELECT 
          ProductId as id,
          ProductName as name,
          ProductBarcode as barcode,
          Rate as rate,
          HasUniqueSerialNo as hasUniqueSerialNo,
          Category,
          Stock,
          IsActive
        FROM Products
        WHERE Category = @category AND IsActive = 1
        ORDER BY ProductName
      `);
    
    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  getProductsByCategory
};

