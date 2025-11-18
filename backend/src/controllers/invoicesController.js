const { getPool, sql } = require('../config/database');

// Get all invoices
async function getAllInvoices(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const pool = await getPool();
    
    const result = await pool.request()
      .input('limit', sql.Int, parseInt(limit))
      .input('offset', sql.Int, parseInt(offset))
      .query(`
        SELECT 
          InvoiceId as id,
          VoucherNo as voucherNo,
          VoucherSeries as voucherSeries,
          CustomerId as customerId,
          TotalAmount as totalAmount,
          TotalDiscount as totalDiscount,
          TotalAdd as totalAdd,
          TotalLess as totalLess,
          NetAmount as netAmount,
          CreatedDate as createdDate,
          CreatedBy as createdBy,
          Status
        FROM Invoices
        ORDER BY CreatedDate DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
    
    res.json({
      success: true,
      data: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices',
      message: error.message
    });
  }
}

// Get invoice by ID
async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // Get invoice header
    const invoiceResult = await pool.request()
      .input('invoiceId', sql.Int, id)
      .query(`
        SELECT 
          InvoiceId as id,
          VoucherNo as voucherNo,
          VoucherSeries as voucherSeries,
          CustomerId as customerId,
          TotalAmount as totalAmount,
          TotalDiscount as totalDiscount,
          TotalAdd as totalAdd,
          TotalLess as totalLess,
          NetAmount as netAmount,
          CreatedDate as createdDate,
          CreatedBy as createdBy,
          Status
        FROM Invoices
        WHERE InvoiceId = @invoiceId
      `);
    
    if (invoiceResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    // Get invoice items
    const itemsResult = await pool.request()
      .input('invoiceId', sql.Int, id)
      .query(`
        SELECT 
          ItemId as id,
          ProductId as productId,
          ProductName as productName,
          Quantity as quantity,
          Rate as rate,
          Gross as gross,
          Net as net,
          ProductSerialNo as productSerialNo,
          Comments1 as comments1,
          SalesMan as salesMan,
          FreeQty as freeQty,
          Comments6 as comments6
        FROM InvoiceItems
        WHERE InvoiceId = @invoiceId
      `);
    
    // Get adjustments
    const adjustmentsResult = await pool.request()
      .input('invoiceId', sql.Int, id)
      .query(`
        SELECT 
          AdjustmentId as id,
          AccountName as accountName,
          AddAmount as addAmount,
          LessAmount as lessAmount,
          Comments as comments
        FROM InvoiceAdjustments
        WHERE InvoiceId = @invoiceId
      `);
    
    const invoice = {
      ...invoiceResult.recordset[0],
      items: itemsResult.recordset,
      adjustments: adjustmentsResult.recordset
    };
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice',
      message: error.message
    });
  }
}

// Create new invoice
async function createInvoice(req, res) {
  const transaction = new sql.Transaction(await getPool());
  
  try {
    const {
      voucherNo,
      voucherSeries,
      customerId,
      items,
      adjustments,
      summary,
      collections,
      transactionData,
      customerData
    } = req.body;
    
    await transaction.begin();
    
    // Insert invoice header
    const invoiceResult = await transaction.request()
      .input('voucherNo', sql.VarChar, voucherNo)
      .input('voucherSeries', sql.VarChar, voucherSeries)
      .input('customerId', sql.VarChar, customerId || customerData.customerId)
      .input('totalAmount', sql.Decimal(18, 2), summary.totalGross)
      .input('totalDiscount', sql.Decimal(18, 2), summary.totalDiscount)
      .input('totalAdd', sql.Decimal(18, 2), summary.totalAdd)
      .input('totalLess', sql.Decimal(18, 2), summary.totalLess)
      .input('netAmount', sql.Decimal(18, 2), summary.totalBillValue)
      .input('createdBy', sql.VarChar, transactionData.username)
      .query(`
        INSERT INTO Invoices 
        (VoucherNo, VoucherSeries, CustomerId, TotalAmount, TotalDiscount, TotalAdd, TotalLess, NetAmount, CreatedBy, Status)
        VALUES 
        (@voucherNo, @voucherSeries, @customerId, @totalAmount, @totalDiscount, @totalAdd, @totalLess, @netAmount, @createdBy, 'Completed');
        
        SELECT SCOPE_IDENTITY() as invoiceId;
      `);
    
    const invoiceId = invoiceResult.recordset[0].invoiceId;
    
    // Insert invoice items
    for (const item of items) {
      await transaction.request()
        .input('invoiceId', sql.Int, invoiceId)
        .input('productId', sql.Int, item.productId)
        .input('productName', sql.VarChar, item.productName)
        .input('quantity', sql.Int, item.quantity)
        .input('rate', sql.Decimal(18, 2), item.rate)
        .input('gross', sql.Decimal(18, 2), item.gross)
        .input('net', sql.Decimal(18, 2), item.net)
        .input('productSerialNo', sql.VarChar, item.productSerialNo || null)
        .input('comments1', sql.VarChar, item.comments1 || null)
        .input('salesMan', sql.VarChar, item.salesMan || null)
        .input('freeQty', sql.VarChar, item.freeQty || null)
        .input('comments6', sql.VarChar, item.comments6 || null)
        .query(`
          INSERT INTO InvoiceItems 
          (InvoiceId, ProductId, ProductName, Quantity, Rate, Gross, Net, ProductSerialNo, Comments1, SalesMan, FreeQty, Comments6)
          VALUES 
          (@invoiceId, @productId, @productName, @quantity, @rate, @gross, @net, @productSerialNo, @comments1, @salesMan, @freeQty, @comments6)
        `);
    }
    
    // Insert adjustments
    for (const adjustment of adjustments) {
      await transaction.request()
        .input('invoiceId', sql.Int, invoiceId)
        .input('accountName', sql.VarChar, adjustment.accountName)
        .input('addAmount', sql.Decimal(18, 2), adjustment.addAmount)
        .input('lessAmount', sql.Decimal(18, 2), adjustment.lessAmount)
        .input('comments', sql.VarChar, adjustment.comments || null)
        .query(`
          INSERT INTO InvoiceAdjustments 
          (InvoiceId, AccountName, AddAmount, LessAmount, Comments)
          VALUES 
          (@invoiceId, @accountName, @addAmount, @lessAmount, @comments)
        `);
    }
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: { invoiceId }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice',
      message: error.message
    });
  }
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice
};

