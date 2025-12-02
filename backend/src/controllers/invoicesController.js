const { executeQuery, executeProcedure, getPool } = require('../config/database');

// Create Employee Sale Invoice (Main + Items + Adjustments)
const createInvoice = async (req, res) => {
  const pool = await getPool();
  const transaction = pool.request();
  
  try {
    await transaction.begin();
    
    const {
      voucherSeries,
      voucherNo,
      voucherDatetime,
      transactionDetails,
      header,
      collections,
      items,
      adjustments,
      summary,
    } = req.body;

    // Validate required fields
    if (!voucherSeries || !voucherNo || !voucherDatetime) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'VoucherSeries, VoucherNo, and VoucherDatetime are required',
      });
    }

    // 1. Insert into EmployeeSaleInvoiceMain
    const mainQuery = `
      INSERT INTO EmployeeSaleInvoiceMain (
        VoucherSeries, VoucherNo, VoucherDatetime,
        TransactionId, TransactionDate, TransactionTime, Status,
        Branch, Location, EmployeeLocation, Username,
        HeaderDate, BillerName, EmployeeName, CustomerID, CustomerName,
        ReadingA4, ReadingA3, MachineType, Remarks, GstBill,
        CollectedCash, CollectedCard, CollectedUpi, Balance,
        ItemCount, TotalQty, TotalGross, TotalDiscount,
        TotalAdd, TotalLess, TotalBillValue, LedgerBalance,
        CreatedBy
      )
      VALUES (
        @voucherSeries, @voucherNo, @voucherDatetime,
        @transactionId, @transactionDate, @transactionTime, @status,
        @branch, @location, @employeeLocation, @username,
        @headerDate, @billerName, @employeeName, @customerID, @customerName,
        @readingA4, @readingA3, @machineType, @remarks, @gstBill,
        @collectedCash, @collectedCard, @collectedUpi, @balance,
        @itemCount, @totalQty, @totalGross, @totalDiscount,
        @totalAdd, @totalLess, @totalBillValue, @ledgerBalance,
        @createdBy
      );
      SELECT SCOPE_IDENTITY() AS InvoiceID;
    `;

    const mainResult = await transaction.request()
      .input('voucherSeries', voucherSeries)
      .input('voucherNo', voucherNo)
      .input('voucherDatetime', voucherDatetime)
      .input('transactionId', transactionDetails?.transactionId || null)
      .input('transactionDate', transactionDetails?.date || null)
      .input('transactionTime', transactionDetails?.time || null)
      .input('status', transactionDetails?.status || 'Pending')
      .input('branch', transactionDetails?.branch || null)
      .input('location', transactionDetails?.location || null)
      .input('employeeLocation', transactionDetails?.employeeLocation || null)
      .input('username', transactionDetails?.username || null)
      .input('headerDate', header?.date || null)
      .input('billerName', header?.billerName || null)
      .input('employeeName', header?.employeeName || null)
      .input('customerID', header?.customerId || null)
      .input('customerName', header?.customerName || null)
      .input('readingA4', header?.readingA4 || null)
      .input('readingA3', header?.readingA3 || null)
      .input('machineType', header?.machineType || null)
      .input('remarks', header?.remarks || null)
      .input('gstBill', header?.gstBill || false)
      .input('collectedCash', collections?.cash || 0)
      .input('collectedCard', collections?.card || 0)
      .input('collectedUpi', collections?.upi || 0)
      .input('balance', collections?.balance || 0)
      .input('itemCount', summary?.itemCount || 0)
      .input('totalQty', summary?.totalQty || 0)
      .input('totalGross', summary?.totalGross || 0)
      .input('totalDiscount', summary?.totalDiscount || 0)
      .input('totalAdd', summary?.totalAdd || 0)
      .input('totalLess', summary?.totalLess || 0)
      .input('totalBillValue', summary?.totalBillValue || 0)
      .input('ledgerBalance', summary?.ledgerBalance || 0)
      .input('createdBy', transactionDetails?.username || 'System')
      .query(mainQuery);

    const invoiceID = mainResult.recordset[0].InvoiceID;

    // 2. Insert Items
    if (items && items.length > 0) {
      for (const item of items) {
        const itemQuery = `
          INSERT INTO EmployeeSaleInvoiceItems (
            InvoiceID, VoucherSeries, VoucherNo,
            SNo, ProductId, ProductName, ProductSerialNo,
            Quantity, Rate, Gross, Net,
            Comments1, SalesMan, FreeQty, Comments6
          )
          VALUES (
            @invoiceID, @voucherSeries, @voucherNo,
            @sno, @productId, @productName, @productSerialNo,
            @quantity, @rate, @gross, @net,
            @comments1, @salesMan, @freeQty, @comments6
          )
        `;

        await transaction.request()
          .input('invoiceID', invoiceID)
          .input('voucherSeries', voucherSeries)
          .input('voucherNo', voucherNo)
          .input('sno', item.sno || 0)
          .input('productId', item.productId || null)
          .input('productName', item.productName || '')
          .input('productSerialNo', item.productSerialNo || '')
          .input('quantity', item.quantity || 0)
          .input('rate', item.rate || 0)
          .input('gross', item.gross || 0)
          .input('net', item.net || 0)
          .input('comments1', item.comments1 || '')
          .input('salesMan', item.salesMan || '')
          .input('freeQty', item.freeQty || 0)
          .input('comments6', item.comments6 || '')
          .query(itemQuery);
      }
    }

    // 3. Insert Adjustments
    if (adjustments && adjustments.length > 0) {
      for (const adj of adjustments) {
        const adjQuery = `
          INSERT INTO EmployeeSaleInvoiceAdjustments (
            InvoiceID, VoucherSeries, VoucherNo,
            AccountId, AccountName, AccountType,
            AddAmount, LessAmount, Comments
          )
          VALUES (
            @invoiceID, @voucherSeries, @voucherNo,
            @accountId, @accountName, @accountType,
            @addAmount, @lessAmount, @comments
          )
        `;

        await transaction.request()
          .input('invoiceID', invoiceID)
          .input('voucherSeries', voucherSeries)
          .input('voucherNo', voucherNo)
          .input('accountId', adj.accountId || null)
          .input('accountName', adj.accountName || '')
          .input('accountType', adj.accountType || 'add')
          .input('addAmount', adj.addAmount || 0)
          .input('lessAmount', adj.lessAmount || 0)
          .input('comments', adj.comments || '')
          .query(adjQuery);
      }
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoiceID,
        voucherSeries,
        voucherNo,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message,
    });
  }
};

// Get invoice by Voucher Series and Number
const getInvoiceByVoucher = async (req, res) => {
  try {
    const { voucherSeries, voucherNo } = req.params;

    if (!voucherSeries || !voucherNo) {
      return res.status(400).json({
        success: false,
        message: 'VoucherSeries and VoucherNo are required',
      });
    }

    // Get main invoice
    const mainQuery = `
      SELECT * FROM EmployeeSaleInvoiceMain
      WHERE VoucherSeries = @voucherSeries AND VoucherNo = @voucherNo
    `;
    const mainResult = await executeQuery(mainQuery, {
      voucherSeries,
      voucherNo,
    });

    if (mainResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    const invoiceID = mainResult[0].InvoiceID;

    // Get items
    const itemsQuery = `
      SELECT * FROM EmployeeSaleInvoiceItems
      WHERE InvoiceID = @invoiceID
      ORDER BY SNo
    `;
    const items = await executeQuery(itemsQuery, { invoiceID });

    // Get adjustments
    const adjQuery = `
      SELECT * FROM EmployeeSaleInvoiceAdjustments
      WHERE InvoiceID = @invoiceID
    `;
    const adjustments = await executeQuery(adjQuery, { invoiceID });

    return res.status(200).json({
      success: true,
      data: {
        main: mainResult[0],
        items,
        adjustments,
      },
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message,
    });
  }
};

// Get invoice by InvoiceID
const getInvoiceByID = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const mainQuery = `SELECT * FROM EmployeeSaleInvoiceMain WHERE InvoiceID = @invoiceId`;
    const mainResult = await executeQuery(mainQuery, { invoiceId });

    if (mainResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    const invoiceID = mainResult[0].InvoiceID;

    const items = await executeQuery(
      'SELECT * FROM EmployeeSaleInvoiceItems WHERE InvoiceID = @invoiceID ORDER BY SNo',
      { invoiceID }
    );

    const adjustments = await executeQuery(
      'SELECT * FROM EmployeeSaleInvoiceAdjustments WHERE InvoiceID = @invoiceID',
      { invoiceID }
    );

    return res.status(200).json({
      success: true,
      data: {
        main: mainResult[0],
        items,
        adjustments,
      },
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message,
    });
  }
};

// Get all invoices (with pagination and filters)
const getAllInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { branch, status, dateFrom, dateTo } = req.query;

    let query = `
      SELECT 
        InvoiceID, VoucherSeries, VoucherNo, VoucherDatetime,
        TransactionId, TransactionDate, Status, Branch,
        CustomerID, CustomerName, EmployeeName,
        TotalBillValue, CollectedCash, CollectedCard, CollectedUpi, Balance,
        CreatedDate
      FROM EmployeeSaleInvoiceMain
      WHERE 1=1
    `;

    const params = {};

    if (branch) {
      query += ' AND Branch = @branch';
      params.branch = branch;
    }
    if (status) {
      query += ' AND Status = @status';
      params.status = status;
    }
    if (dateFrom) {
      query += ' AND TransactionDate >= @dateFrom';
      params.dateFrom = dateFrom;
    }
    if (dateTo) {
      query += ' AND TransactionDate <= @dateTo';
      params.dateTo = dateTo;
    }

    query += ` ORDER BY CreatedDate DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.offset = offset;
    params.limit = limit;

    const result = await executeQuery(query, params);

    return res.status(200).json({
      success: true,
      data: result,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message,
    });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const updateData = req.body;

    // Build dynamic update query
    const updateFields = [];
    const params = { invoiceId };

    Object.keys(updateData).forEach((key) => {
      if (key !== 'invoiceId' && key !== 'items' && key !== 'adjustments') {
        updateFields.push(`${key} = @${key}`);
        params[key] = updateData[key];
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    updateFields.push('ModifiedDate = GETDATE()');

    const query = `
      UPDATE EmployeeSaleInvoiceMain
      SET ${updateFields.join(', ')}
      WHERE InvoiceID = @invoiceId
    `;

    await executeQuery(query, params);

    return res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating invoice',
      error: error.message,
    });
  }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const query = 'DELETE FROM EmployeeSaleInvoiceMain WHERE InvoiceID = @invoiceId';
    await executeQuery(query, { invoiceId });

    return res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message,
    });
  }
};

module.exports = {
  createInvoice,
  getInvoiceByVoucher,
  getInvoiceByID,
  getAllInvoices,
  updateInvoice,
  deleteInvoice,
};

