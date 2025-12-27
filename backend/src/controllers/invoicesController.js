const { executeQuery, executeProcedure, getPool, sql } = require('../config/database');
const { getBranchShortName } = require('../utils/branchMapping');

// Create or Update Employee Sale Invoice (Main + Items + Adjustments)
const createInvoice = async (req, res) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    const {
      invoiceID, // Optional: if provided, update existing invoice
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

    // Debug: Log the voucherSeries received from frontend
    console.log(`🔍 Received voucherSeries from frontend: "${voucherSeries}"`);

    // Debug logging for update operations
    if (invoiceID) {
      console.log('📊 Update request data:', {
        invoiceID,
        itemsCount: items?.length || 0,
        firstItem: items?.[0] ? {
          productName: items[0].productName,
          quantity: items[0].quantity,
          rate: items[0].rate,
          gross: items[0].gross,
          net: items[0].net,
        } : null,
        collections: {
          cash: collections?.cash,
          card: collections?.card,
          upi: collections?.upi,
          balance: collections?.balance,
        },
        summary: {
          totalQty: summary?.totalQty,
          totalGross: summary?.totalGross,
          totalBillValue: summary?.totalBillValue,
        },
      });
    }

    // Validate required fields
    if (!voucherSeries || !voucherDatetime) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'VoucherSeries and VoucherDatetime are required',
      });
    }

    // Check if this is an update (invoiceID provided and exists)
    let isUpdate = false;
    let existingInvoiceID = null;
    
    console.log(`📋 Received invoiceID: ${invoiceID || 'null'}`);
    
    if (invoiceID) {
      // Check if invoice exists
      const checkRequest = new sql.Request(transaction);
      checkRequest.input('invoiceID', sql.Int, invoiceID);
      const checkResult = await checkRequest.query(`
        SELECT InvoiceID, VoucherSeries, VoucherNo 
        FROM InvoiceMain 
        WHERE InvoiceID = @invoiceID
      `);
      
      if (checkResult.recordset && checkResult.recordset.length > 0) {
        isUpdate = true;
        existingInvoiceID = invoiceID;
        const existing = checkResult.recordset[0];
        console.log(`🔄 Updating existing invoice: ${existing.VoucherSeries}-${existing.VoucherNo} (ID: ${invoiceID})`);
      } else {
        console.log(`⚠️ Invoice ID ${invoiceID} not found, creating new invoice`);
      }
    } else {
      console.log(`✨ Creating new invoice (no invoiceID provided)`);
    }

    // Generate voucher number only for NEW invoices (not updates)
    // For updates, use existing voucher number
    const username = transactionDetails?.username;
    let finalVoucherSeries;
    let finalVoucherNo;
    
    if (isUpdate) {
      // For updates, use the existing voucher number from the invoice
      const voucherRequest = new sql.Request(transaction);
      voucherRequest.input('invoiceID', sql.Int, existingInvoiceID);
      const voucherResult = await voucherRequest.query(`
        SELECT VoucherSeries, VoucherNo 
        FROM InvoiceMain 
        WHERE InvoiceID = @invoiceID
      `);
      
      if (voucherResult.recordset && voucherResult.recordset.length > 0) {
        finalVoucherSeries = voucherResult.recordset[0].VoucherSeries;
        finalVoucherNo = voucherResult.recordset[0].VoucherNo;
        console.log(`✅ Using existing voucher: ${finalVoucherSeries}-${finalVoucherNo}`);
      } else {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Invoice not found for update',
        });
      }
    } else {
      // For new invoices, generate voucher number
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
      try {
        console.log(`🔢 Generating voucher number for username: ${username}`);
        
        // First, verify employee exists
        const checkEmployeeQuery = `SELECT EmployeeID, EmployeeName, ShortName, LastVoucherNumber, VoucherSeries FROM Employees WHERE Username = @username`;
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
        // IMPORTANT: Use transaction.request() to ensure the stored procedure runs within the transaction
        // This ensures LastVoucherNumber is updated atomically with the invoice save
        let voucherGenerated = false;
        try {
          const voucherRequest = transaction.request();
          voucherRequest.input('Username', sql.VarChar(100), username);
          voucherRequest.output('VoucherSeries', sql.VarChar(50));
          voucherRequest.output('VoucherNo', sql.VarChar(50));
          
          await voucherRequest.execute('sp_GetNextVoucherNumber');
          
          const voucherSeriesParam = voucherRequest.parameters['VoucherSeries'];
          const voucherNoParam = voucherRequest.parameters['VoucherNo'];
          
          if (voucherNoParam && voucherNoParam.value !== null && voucherNoParam.value !== undefined) {
            // Get the base prefix from request body (e.g., 'RS' for EmployeeSaleInvoice, 'SRS' for SalesReturns)
            // IMPORTANT: Use voucherSeries from req.body, not from stored procedure
            // Extract just the prefix if full format is sent (e.g., 'SRS' from 'SRS-25PAT-JD' or just 'SRS')
            let basePrefix = 'RS'; // Default
            if (voucherSeries) {
              // If it starts with 'SRS', use 'SRS', otherwise use 'RS'
              if (voucherSeries.trim().toUpperCase().startsWith('SRS')) {
                basePrefix = 'SRS';
              } else if (voucherSeries.trim().toUpperCase().startsWith('RS')) {
                basePrefix = 'RS';
              } else {
                // If it's just a prefix like 'SRS' or 'RS', use it directly
                basePrefix = voucherSeries.trim().toUpperCase();
              }
            }
            console.log(`📋 Voucher series from request: "${voucherSeries}", extracted prefix: "${basePrefix}"`);
            
            // Get last 2 digits of current year and next year
            const currentYear = new Date().getFullYear();
            const nextYear = currentYear + 1;
            const currentYearSuffix = String(currentYear).slice(-2);
            const nextYearSuffix = String(nextYear).slice(-2);
            
            // Get branch short name from employee's branch
            const branchName = employee.Branch || '';
            const branchShortName = getBranchShortName(branchName);
            
            // Get employee ShortName
            const shortName = employee.ShortName || '';
            
            // Construct voucher series based on prefix
            // For 'SRS' (SalesReturns): SRS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
            // Example: SRS-25PAT-JD
            // For 'RS' with dash format (RentalService): RS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
            // Example: RS-25PAT-Mo
            // For 'RS' without dash (EmployeeSaleInvoice): RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName}
            // Example: RS25-26PAT-Mo
            
            // Check if the voucherSeries from frontend already has the RentalService format (RS-...)
            const isRentalServiceFormat = voucherSeries && voucherSeries.trim().match(/^RS-\d{2}/);
            
            if (basePrefix === 'SRS') {
              // Sales Returns format: SRS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
              if (branchShortName && shortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
              } else if (branchShortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
              } else if (shortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
              } else {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}`;
              }
            } else if (isRentalServiceFormat || (basePrefix === 'RS' && voucherSeries && voucherSeries.includes('RentalService'))) {
              // Rental Service format: RS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
              if (branchShortName && shortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
              } else if (branchShortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
              } else if (shortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
              } else {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}`;
              }
            } else {
              // Employee Sale Invoice format: RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName}
              if (branchShortName && shortName) {
                finalVoucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}${branchShortName}-${shortName}`;
              } else if (branchShortName) {
                finalVoucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}${branchShortName}`;
              } else if (shortName) {
                finalVoucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}-${shortName}`;
              } else {
                finalVoucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}`;
              }
            }
            
            finalVoucherNo = voucherNoParam.value;
            voucherGenerated = true;
            console.log(`✅ Generated via stored procedure: ${finalVoucherSeries}-${finalVoucherNo}`);
            console.log(`   📝 Prefix used: "${basePrefix}", Format: ${basePrefix === 'SRS' ? 'SRS-{Year}{Branch}-{Employee}' : 'RS{Year}-{NextYear}{Branch}-{Employee}'}`);
            console.log(`   🔢 LastVoucherNumber updated to: ${finalVoucherNo} for employee: ${username}`);
          }
        } catch (spError) {
          console.warn('⚠️  Stored procedure failed, using manual generation:', spError.message);
        }
        
        // Fallback: Generate voucher number manually if stored procedure didn't work
        if (!voucherGenerated) {
          const lastNumber = employee.LastVoucherNumber || 0;
          const nextNumber = lastNumber + 1;
          
          // Get the base prefix from request body (e.g., 'RS' for EmployeeSaleInvoice, 'SRS' for SalesReturns)
          // IMPORTANT: Use voucherSeries from req.body
          // Extract just the prefix if full format is sent (e.g., 'SRS' from 'SRS-25PAT-JD' or just 'SRS')
          let basePrefix = 'RS'; // Default
          if (voucherSeries) {
            // If it starts with 'SRS', use 'SRS', otherwise use 'RS'
            if (voucherSeries.trim().toUpperCase().startsWith('SRS')) {
              basePrefix = 'SRS';
            } else if (voucherSeries.trim().toUpperCase().startsWith('RS')) {
              basePrefix = 'RS';
            } else {
              // If it's just a prefix like 'SRS' or 'RS', use it directly
              basePrefix = voucherSeries.trim().toUpperCase();
            }
          }
          console.log(`📋 Fallback: Voucher series from request: "${voucherSeries}", extracted prefix: "${basePrefix}"`);
          
          // Get last 2 digits of current year and next year
          const currentYear = new Date().getFullYear();
          const nextYear = currentYear + 1;
          const currentYearSuffix = String(currentYear).slice(-2);
          const nextYearSuffix = String(nextYear).slice(-2);
          
          // Get branch short name from employee's branch
          const branchName = employee.Branch || '';
          const branchShortName = getBranchShortName(branchName);
          
          // Get employee ShortName
          const shortName = employee.ShortName || '';
          
          // Construct voucher series based on prefix
          // For 'SRS' (SalesReturns): SRS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
          // Example: SRS-25PAT-JD
          // For 'RS' with dash format (RentalService): RS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
          // Example: RS-25PAT-Mo
          // For 'RS' without dash (EmployeeSaleInvoice): RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName}
          // Example: RS25-26PAT-Mo
          
          // Check if the voucherSeries from frontend already has the RentalService format (RS-...)
          const isRentalServiceFormat = voucherSeries && voucherSeries.trim().match(/^RS-\d{2}/);
          
          if (basePrefix === 'SRS') {
            // Sales Returns format: SRS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
            if (branchShortName && shortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
            } else if (branchShortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
            } else if (shortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
            } else {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}`;
            }
          } else if (isRentalServiceFormat || (basePrefix === 'RS' && voucherSeries && voucherSeries.includes('RentalService'))) {
            // Rental Service format: RS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
            if (branchShortName && shortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
            } else if (branchShortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
            } else if (shortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
            } else {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}`;
            }
          } else {
            // Employee Sale Invoice format: RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName}
            if (branchShortName && shortName) {
              finalVoucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}${branchShortName}-${shortName}`;
            } else if (branchShortName) {
              finalVoucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}${branchShortName}`;
            } else if (shortName) {
              finalVoucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}-${shortName}`;
            } else {
              finalVoucherSeries = `${basePrefix}${currentYearSuffix}-${nextYearSuffix}`;
            }
          }
          
          finalVoucherNo = String(nextNumber); // Just the number, no alphanumeric
          
          // Update LastVoucherNumber in database
          // IMPORTANT: Use transaction.request() to ensure this update is within the transaction
          // This ensures LastVoucherNumber is updated atomically with the invoice save
          const updateRequest = transaction.request();
          updateRequest.input('username', sql.VarChar(100), username);
          updateRequest.input('nextNumber', sql.Int, nextNumber);
          await updateRequest.query(`
            UPDATE Employees 
            SET LastVoucherNumber = @nextNumber, ModifiedDate = GETDATE()
            WHERE Username = @username
          `);
          
          console.log(`✅ Generated manually: ${finalVoucherSeries}-${finalVoucherNo}`);
          console.log(`   🔢 LastVoucherNumber updated to: ${nextNumber} for employee: ${username}`);
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
    }

    // 1. Insert or Update InvoiceMain
    let finalInvoiceID;
    
    if (isUpdate) {
      // UPDATE existing invoice
      const updateQuery = `
        UPDATE InvoiceMain SET
          VoucherDatetime = @voucherDatetime,
          TransactionDate = @transactionDate,
          TransactionTime = @transactionTime,
          Branch = @branch,
          Location = @location,
          EmployeeLocation = @employeeLocation,
          Username = @username,
          HeaderDate = @headerDate,
          BillerName = @billerName,
          EmployeeName = @employeeName,
          CustomerID = @customerID,
          CustomerName = @customerName,
          ReadingA4 = @readingA4,
          ReadingA3 = @readingA3,
          MachineType = @machineType,
          Remarks = @remarks,
          GstBill = @gstBill,
          CollectedCash = @collectedCash,
          CollectedCard = @collectedCard,
          CollectedUpi = @collectedUpi,
          Balance = @balance,
          ItemCount = @itemCount,
          TotalQty = @totalQty,
          TotalGross = @totalGross,
          TotalDiscount = @totalDiscount,
          TotalAdd = @totalAdd,
          TotalLess = @totalLess,
          TotalBillValue = @totalBillValue,
          LedgerBalance = @ledgerBalance,
          ModifiedDate = GETDATE(),
          ModifiedBy = @modifiedBy
        WHERE InvoiceID = @invoiceID
      `;
      
      const updateRequest = new sql.Request(transaction);
      updateRequest.input('invoiceID', existingInvoiceID);
      updateRequest.input('voucherDatetime', voucherDatetime);
      updateRequest.input('transactionDate', transactionDetails?.date || null);
      updateRequest.input('transactionTime', transactionDetails?.time || null);
      updateRequest.input('branch', transactionDetails?.branch || null);
      updateRequest.input('location', transactionDetails?.location || null);
      updateRequest.input('employeeLocation', transactionDetails?.employeeLocation || null);
      updateRequest.input('username', transactionDetails?.username || null);
      updateRequest.input('headerDate', header?.date || null);
      updateRequest.input('billerName', header?.billerName || null);
      updateRequest.input('employeeName', header?.employeeName || null);
      updateRequest.input('customerID', header?.customerId || null);
      updateRequest.input('customerName', header?.customerName || null);
      updateRequest.input('readingA4', header?.readingA4 || null);
      updateRequest.input('readingA3', header?.readingA3 || null);
      updateRequest.input('machineType', header?.machineType || null);
      updateRequest.input('remarks', header?.remarks || null);
      updateRequest.input('gstBill', header?.gstBill || false);
      // Ensure numeric fields are properly converted
      updateRequest.input('collectedCash', parseFloat(collections?.cash) || 0);
      updateRequest.input('collectedCard', parseFloat(collections?.card) || 0);
      updateRequest.input('collectedUpi', parseFloat(collections?.upi) || 0);
      updateRequest.input('balance', parseFloat(collections?.balance) || 0);
      updateRequest.input('itemCount', parseInt(summary?.itemCount) || 0);
      updateRequest.input('totalQty', parseFloat(summary?.totalQty) || 0);
      updateRequest.input('totalGross', parseFloat(summary?.totalGross) || 0);
      updateRequest.input('totalDiscount', parseFloat(summary?.totalDiscount) || 0);
      updateRequest.input('totalAdd', parseFloat(summary?.totalAdd) || 0);
      updateRequest.input('totalLess', parseFloat(summary?.totalLess) || 0);
      updateRequest.input('totalBillValue', parseFloat(summary?.totalBillValue) || 0);
      updateRequest.input('ledgerBalance', parseFloat(summary?.ledgerBalance) || 0);
      updateRequest.input('modifiedBy', transactionDetails?.username || 'System');
      
      await updateRequest.query(updateQuery);
      finalInvoiceID = existingInvoiceID;
      
      // Delete existing items and adjustments for this invoice
      const deleteItemsRequest = new sql.Request(transaction);
      deleteItemsRequest.input('invoiceID', sql.Int, finalInvoiceID);
      await deleteItemsRequest.query(`DELETE FROM InvoiceItems WHERE InvoiceID = @invoiceID`);
      
      const deleteAdjustmentsRequest = new sql.Request(transaction);
      deleteAdjustmentsRequest.input('invoiceID', sql.Int, finalInvoiceID);
      await deleteAdjustmentsRequest.query(`DELETE FROM InvoiceAdjustments WHERE InvoiceID = @invoiceID`);
    } else {
      // INSERT new invoice
      const insertQuery = `
        INSERT INTO InvoiceMain (
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
      mainRequest.input('transactionDate', transactionDetails?.date || null);
      mainRequest.input('transactionTime', transactionDetails?.time || null);
      mainRequest.input('branch', transactionDetails?.branch || null);
      mainRequest.input('location', transactionDetails?.location || null);
      mainRequest.input('employeeLocation', transactionDetails?.employeeLocation || null);
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
      
      const mainResult = await mainRequest.query(insertQuery);
      finalInvoiceID = mainResult.recordset[0].InvoiceID;
    }

    // 2. Insert Items into InvoiceItems
    // IMPORTANT: Using the SAME voucherSeries and voucherNo from main table (common across all 3 tables)
    if (items && items.length > 0) {
      for (const item of items) {
        const itemQuery = `
          INSERT INTO InvoiceItems (
            InvoiceID, VoucherSeries, VoucherNo,
            SNo, ProductId, ProductName, Barcode, ProductSerialNo,
            Quantity, FreeQty, Rate, Net,
            Comments1
          )
          VALUES (
            @invoiceID, @voucherSeries, @voucherNo,
            @sno, @productId, @productName, @barcode, @productSerialNo,
            @quantity, @freeQty, @rate, @net,
            @comments1
          )
        `;

        const itemRequest = new sql.Request(transaction);
        itemRequest.input('invoiceID', finalInvoiceID);
        // Common Voucher Fields: Same voucherSeries and voucherNo as main table
        itemRequest.input('voucherSeries', finalVoucherSeries);
        itemRequest.input('voucherNo', finalVoucherNo);
        itemRequest.input('sno', item.sno || 0);
        itemRequest.input('productId', item.productId || null);
        itemRequest.input('productName', item.productName || '');
        itemRequest.input('barcode', item.barcode || '');
        itemRequest.input('productSerialNo', item.productSerialNo || '');
        // Ensure numeric fields are properly converted
        itemRequest.input('quantity', parseFloat(item.quantity) || 0);
        itemRequest.input('freeQty', parseFloat(item.freeQty) || 0);
        itemRequest.input('rate', parseFloat(item.rate) || 0);
        itemRequest.input('net', parseFloat(item.net) || 0);
        itemRequest.input('comments1', item.comments1 || '');
        
        await itemRequest.query(itemQuery);
      }
    }

    // 3. Insert Adjustments into InvoiceAdjustments
    // IMPORTANT: Using the SAME voucherSeries and voucherNo from main table (common across all 3 tables)
    if (adjustments && adjustments.length > 0) {
      for (const adj of adjustments) {
        const adjQuery = `
          INSERT INTO InvoiceAdjustments (
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
        adjRequest.input('invoiceID', finalInvoiceID);
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
    // IMPORTANT: This commit also commits the LastVoucherNumber update
    await transaction.commit();

    // Verify LastVoucherNumber was updated correctly (for debugging)
    try {
      const verifyRequest = pool.request();
      verifyRequest.input('username', sql.VarChar(100), username);
      const verifyResult = await verifyRequest.query(`
        SELECT LastVoucherNumber 
        FROM Employees 
        WHERE Username = @username
      `);
      if (verifyResult.recordset && verifyResult.recordset.length > 0) {
        const actualLastVoucherNumber = verifyResult.recordset[0].LastVoucherNumber;
        console.log(`   ✅ Verified: LastVoucherNumber in database is now ${actualLastVoucherNumber} for employee: ${username}`);
        if (actualLastVoucherNumber !== parseInt(finalVoucherNo)) {
          console.warn(`   ⚠️ WARNING: LastVoucherNumber mismatch! Expected ${finalVoucherNo}, but database shows ${actualLastVoucherNumber}`);
        }
      }
    } catch (verifyError) {
      console.warn(`   ⚠️ Could not verify LastVoucherNumber update: ${verifyError.message}`);
    }

    const action = isUpdate ? 'updated' : 'saved';
    console.log(`✅ Invoice ${action}: ${finalVoucherSeries}-${finalVoucherNo}`);
    console.log(`   💾 Transaction committed - LastVoucherNumber should be ${finalVoucherNo} for employee: ${username}`);

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? 'Invoice updated successfully' : 'Invoice created successfully',
      data: {
        invoiceID: finalInvoiceID,
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

