const { executeQuery, executeProcedure, getPool, sql } = require('../config/database');

// Create Employee Sale Invoice (Main + Items + Adjustments)
const createInvoice = async (req, res) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  
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
    if (!voucherSeries || !voucherDatetime) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'VoucherSeries and VoucherDatetime are required',
      });
    }

    // Always generate voucher number on save to ensure it increments
    // Voucher number increments ONLY when saving (not when opening screen)
    const username = transactionDetails?.username;
    if (!username) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Username is required to generate voucher number',
      });
    }

    // Generate the next voucher number using stored procedure (this increments the counter)
    // Call OUTSIDE transaction so increment persists even if save fails
    // This prevents duplicate voucher numbers on retry
    let finalVoucherSeries;
    let finalVoucherNo;
    
    try {
      console.log(`🔢 Generating voucher number for username: ${username}`);
      
      // First, verify employee exists
      const checkEmployeeQuery = `SELECT EmployeeID, EmployeeName, ShortName, LastVoucherNumber, VoucherSeries FROM Employees WHERE Username = @username AND Status = 'Active'`;
      const checkRequest = pool.request();
      checkRequest.input('username', sql.VarChar(100), username);
      const employeeResult = await checkRequest.query(checkEmployeeQuery);
      
      if (!employeeResult.recordset || employeeResult.recordset.length === 0) {
        console.error('❌ Employee not found or inactive:', username);
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Employee not found or inactive: ${username}`,
        });
      }
      
      const employee = employeeResult.recordset[0];
      console.log(`   Employee found: ${employee.EmployeeName} (${employee.ShortName})`);
      console.log(`   LastVoucherNumber: ${employee.LastVoucherNumber || 0}`);
      console.log(`   VoucherSeries: ${employee.VoucherSeries || 'ESI'}`);
      
      // Try to call stored procedure first
      let voucherGenerated = false;
      try {
        const voucherRequest = pool.request();
        voucherRequest.input('Username', sql.VarChar(100), username);
        voucherRequest.output('VoucherSeries', sql.VarChar(50));
        voucherRequest.output('VoucherNo', sql.VarChar(50));
        
        await voucherRequest.execute('sp_GetNextVoucherNumber');
        
        const voucherSeriesParam = voucherRequest.parameters['VoucherSeries'];
        const voucherNoParam = voucherRequest.parameters['VoucherNo'];
        
        if (voucherNoParam && voucherNoParam.value !== null && voucherNoParam.value !== undefined) {
          finalVoucherSeries = voucherSeriesParam?.value || employee.VoucherSeries || 'ESI';
          finalVoucherNo = voucherNoParam.value;
          voucherGenerated = true;
          console.log(`✅ Generated via stored procedure: ${finalVoucherSeries}-${finalVoucherNo}`);
        }
      } catch (spError) {
        console.warn('⚠️  Stored procedure failed, using manual generation:', spError.message);
      }
      
      // Fallback: Generate voucher number manually if stored procedure didn't work
      // Format: Just a number (1, 2, 3, etc.) - incremental
      if (!voucherGenerated) {
        const lastNumber = employee.LastVoucherNumber || 0;
        const nextNumber = lastNumber + 1;
        const series = employee.VoucherSeries || 'ESI';
        
        finalVoucherSeries = series;
        finalVoucherNo = String(nextNumber); // Just the number, no alphanumeric
        
        // Update LastVoucherNumber in database
        const updateRequest = pool.request();
        updateRequest.input('username', sql.VarChar(100), username);
        updateRequest.input('nextNumber', sql.Int, nextNumber);
        await updateRequest.query(`
          UPDATE Employees 
          SET LastVoucherNumber = @nextNumber, ModifiedDate = GETDATE()
          WHERE Username = @username
        `);
        
        console.log(`✅ Generated manually: ${finalVoucherSeries}-${finalVoucherNo}`);
      }
    } catch (error) {
      console.error('❌ Error generating voucher number:', error.message);
      console.error('   Error stack:', error.stack);
      console.error('   Username:', username);
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: `Failed to generate voucher number: ${error.message}`,
      });
    }

    // 1. Insert into EmployeeSaleInvoiceMain
    // NOTE: voucherSeries and voucherNo are COMMON across all 3 tables (Main, Items, Adjustments)
    // The same values will be used when inserting into Items and Adjustments tables
    const mainQuery = `
      INSERT INTO EmployeeSaleInvoiceMain (
        VoucherSeries, VoucherNo, VoucherDatetime,
        TransactionDate, TransactionTime,
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
        @transactionDate, @transactionTime,
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

    const mainRequest = new sql.Request(transaction);
    mainRequest.input('voucherSeries', finalVoucherSeries);
    mainRequest.input('voucherNo', finalVoucherNo);
    mainRequest.input('voucherDatetime', voucherDatetime);
    // TransactionId and Status removed - not stored in database
    mainRequest.input('transactionDate', transactionDetails?.date || null);
    mainRequest.input('transactionTime', transactionDetails?.time || null);
    mainRequest.input('branch', transactionDetails?.branch || null);
    mainRequest.input('location', transactionDetails?.location || null);
    mainRequest.input('employeeLocation', transactionDetails?.employeeLocation || null); // Hidden from UI but kept in database
    mainRequest.input('username', transactionDetails?.username || null);
    mainRequest.input('headerDate', header?.date || null);
    mainRequest.input('billerName', header?.billerName || null);
    mainRequest.input('employeeName', header?.employeeName || null);
    mainRequest.input('customerID', header?.customerId || null);
    mainRequest.input('customerName', header?.customerName || null);
    mainRequest.input('readingA4', header?.readingA4 || null);
    mainRequest.input('readingA3', header?.readingA3 || null);
    mainRequest.input('machineType', header?.machineType || null);
    mainRequest.input('remarks', header?.remarks || null);
    mainRequest.input('gstBill', header?.gstBill || false);
    mainRequest.input('collectedCash', collections?.cash || 0);
    mainRequest.input('collectedCard', collections?.card || 0);
    mainRequest.input('collectedUpi', collections?.upi || 0);
    mainRequest.input('balance', collections?.balance || 0);
    mainRequest.input('itemCount', summary?.itemCount || 0);
    mainRequest.input('totalQty', summary?.totalQty || 0);
    mainRequest.input('totalGross', summary?.totalGross || 0);
    mainRequest.input('totalDiscount', summary?.totalDiscount || 0);
    mainRequest.input('totalAdd', summary?.totalAdd || 0);
    mainRequest.input('totalLess', summary?.totalLess || 0);
    mainRequest.input('totalBillValue', summary?.totalBillValue || 0);
    mainRequest.input('ledgerBalance', summary?.ledgerBalance || 0);
    mainRequest.input('createdBy', transactionDetails?.username || 'System');
    
    const mainResult = await mainRequest.query(mainQuery);
    const invoiceID = mainResult.recordset[0].InvoiceID;

    // 2. Insert Items into EmployeeSaleInvoiceItems
    // IMPORTANT: Using the SAME voucherSeries and voucherNo from main table (common across all 3 tables)
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

        const itemRequest = new sql.Request(transaction);
        itemRequest.input('invoiceID', invoiceID);
        // Common Voucher Fields: Same voucherSeries and voucherNo as main table
        itemRequest.input('voucherSeries', finalVoucherSeries);
        itemRequest.input('voucherNo', finalVoucherNo);
        itemRequest.input('sno', item.sno || 0);
        itemRequest.input('productId', item.productId || null);
        itemRequest.input('productName', item.productName || '');
        itemRequest.input('productSerialNo', item.productSerialNo || '');
        itemRequest.input('quantity', item.quantity || 0);
        itemRequest.input('rate', item.rate || 0);
        itemRequest.input('gross', item.gross || 0);
        itemRequest.input('net', item.net || 0);
        itemRequest.input('comments1', item.comments1 || '');
        itemRequest.input('salesMan', item.salesMan || '');
        itemRequest.input('freeQty', item.freeQty || 0);
        itemRequest.input('comments6', item.comments6 || '');
        
        await itemRequest.query(itemQuery);
      }
    }

    // 3. Insert Adjustments into EmployeeSaleInvoiceAdjustments
    // IMPORTANT: Using the SAME voucherSeries and voucherNo from main table (common across all 3 tables)
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

        const adjRequest = new sql.Request(transaction);
        adjRequest.input('invoiceID', invoiceID);
        // Common Voucher Fields: Same voucherSeries and voucherNo as main table
        adjRequest.input('voucherSeries', finalVoucherSeries);
        adjRequest.input('voucherNo', finalVoucherNo);
        adjRequest.input('accountId', adj.accountId || null);
        adjRequest.input('accountName', adj.accountName || '');
        adjRequest.input('accountType', adj.accountType || 'add');
        adjRequest.input('addAmount', adj.addAmount || 0);
        adjRequest.input('lessAmount', adj.lessAmount || 0);
        adjRequest.input('comments', adj.comments || '');
        
        await adjRequest.query(adjQuery);
      }
    }

    // Commit transaction - all data saved to all 3 tables
    await transaction.commit();

    console.log(`✅ Invoice saved: ${finalVoucherSeries}-${finalVoucherNo}`);

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoiceID,
        voucherSeries: finalVoucherSeries,
        voucherNo: finalVoucherNo,
        itemsCount: items?.length || 0,
        adjustmentsCount: adjustments?.length || 0,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating invoice:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message,
    });
  }
};

module.exports = {
  createInvoice,
};

