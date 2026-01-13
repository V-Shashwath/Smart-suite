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
            // Check if the frontend already sent a complete voucher series format
            // If it matches the expected format (e.g., RS-25NAM-JD, RMB-25NAM-JD, SRS-25PAT-JD, CR-26NAM-JD, BR-26NAM-JD), use it directly
            const trimmedVoucherSeries = voucherSeries ? voucherSeries.trim() : '';
            const isCompleteFormat = trimmedVoucherSeries.match(/^(RS|RMB|SRS|CR|BR)-\d{2}[A-Z]{2,4}-[A-Z]{1,3}$/);
            
            if (isCompleteFormat) {
              // Frontend already sent the complete format, use it as-is
              finalVoucherSeries = trimmedVoucherSeries;
              finalVoucherNo = voucherNoParam.value;
              voucherGenerated = true;
              console.log(`✅ Using complete voucher series from frontend: ${finalVoucherSeries}-${finalVoucherNo}`);
            } else {
              // Need to construct the voucher series
              // Get the base prefix from request body (e.g., 'RS' for EmployeeSaleInvoice, 'SRS' for SalesReturns, 'RMB' for RentalMonthlyBill)
              // IMPORTANT: Use voucherSeries from req.body, not from stored procedure
              // Extract just the prefix if full format is sent (e.g., 'SRS' from 'SRS-25PAT-JD' or just 'SRS')
              let basePrefix = 'RS'; // Default
              if (voucherSeries) {
                const upperVoucherSeries = voucherSeries.trim().toUpperCase();
                // Check in order: SRS, RMB, CR, BR, RS (order matters for prefix matching)
                if (upperVoucherSeries.startsWith('SRS')) {
                  basePrefix = 'SRS';
                } else if (upperVoucherSeries.startsWith('RMB')) {
                  basePrefix = 'RMB';
                } else if (upperVoucherSeries.startsWith('CR')) {
                  basePrefix = 'CR';
                } else if (upperVoucherSeries.startsWith('BR')) {
                  basePrefix = 'BR';
                } else if (upperVoucherSeries.startsWith('RS')) {
                  basePrefix = 'RS';
                } else {
                  // If it's just a prefix like 'SRS', 'RMB', 'CR', 'BR', or 'RS', use it directly
                  basePrefix = upperVoucherSeries;
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
            // For 'RMB' (RentalMonthlyBill): RMB-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
            // Example: RMB-25NAM-JD
            // For 'RS' with dash format (RentalService): RS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
            // Example: RS-25PAT-Mo
            // For 'RS' without dash (EmployeeSaleInvoice): RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName}
            // Example: RS25-26PAT-Mo
            
            // Check if the voucherSeries from frontend already has the RentalService format (RS-...)
            const isRentalServiceFormat = voucherSeries && voucherSeries.trim().match(/^RS-\d{2}/);
            const isRentalMonthlyBillFormat = voucherSeries && voucherSeries.trim().match(/^RMB-\d{2}/);
            const isCashReceiptFormat = voucherSeries && voucherSeries.trim().match(/^CR-\d{2}/);
            const isBankReceiptFormat = voucherSeries && voucherSeries.trim().match(/^BR-\d{2}/);
            
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
            } else if (basePrefix === 'RMB' || isRentalMonthlyBillFormat) {
              // Rental Monthly Bill format: RMB-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
              if (branchShortName && shortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
              } else if (branchShortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
              } else if (shortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
              } else {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}`;
              }
            } else if (basePrefix === 'CR' || isCashReceiptFormat) {
              // Cash Receipt format: CR-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
              if (branchShortName && shortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
              } else if (branchShortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
              } else if (shortName) {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
              } else {
                finalVoucherSeries = `${basePrefix}-${currentYearSuffix}`;
              }
            } else if (basePrefix === 'BR' || isBankReceiptFormat) {
              // Bank Receipt format: BR-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
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
            let formatDescription = 'RS{Year}-{NextYear}{Branch}-{Employee}';
            if (basePrefix === 'SRS') {
              formatDescription = 'SRS-{Year}{Branch}-{Employee}';
            } else if (basePrefix === 'RMB') {
              formatDescription = 'RMB-{Year}{Branch}-{Employee}';
            } else if (basePrefix === 'CR') {
              formatDescription = 'CR-{Year}{Branch}-{Employee}';
            } else if (basePrefix === 'BR') {
              formatDescription = 'BR-{Year}{Branch}-{Employee}';
            } else if (basePrefix === 'RS' && isRentalServiceFormat) {
              formatDescription = 'RS-{Year}{Branch}-{Employee}';
            }
            console.log(`   📝 Prefix used: "${basePrefix}", Format: ${formatDescription}`);
            console.log(`   🔢 LastVoucherNumber updated to: ${finalVoucherNo} for employee: ${username}`);
            }
          }
        } catch (spError) {
          console.warn('⚠️  Stored procedure failed, using manual generation:', spError.message);
        }
        
        // Fallback: Generate voucher number manually if stored procedure didn't work
        if (!voucherGenerated) {
          // Check if the frontend already sent a complete voucher series format
          const trimmedVoucherSeries = voucherSeries ? voucherSeries.trim() : '';
          const isCompleteFormat = trimmedVoucherSeries.match(/^(RS|RMB|SRS|CR|BR)-\d{2}[A-Z]{2,4}-[A-Z]{1,3}$/);
          
          if (isCompleteFormat) {
            // Frontend already sent the complete format, use it as-is
            finalVoucherSeries = trimmedVoucherSeries;
            const lastNumber = employee.LastVoucherNumber || 0;
            const nextNumber = lastNumber + 1;
            finalVoucherNo = String(nextNumber);
            
            // Update LastVoucherNumber in database
            const updateRequest = transaction.request();
            updateRequest.input('username', sql.VarChar(100), username);
            updateRequest.input('nextNumber', sql.Int, nextNumber);
            await updateRequest.query(`
              UPDATE Employees 
              SET LastVoucherNumber = @nextNumber, ModifiedDate = GETDATE()
              WHERE Username = @username
            `);
            
            voucherGenerated = true;
            console.log(`✅ Using complete voucher series from frontend (fallback): ${finalVoucherSeries}-${finalVoucherNo}`);
          } else {
            // Need to construct the voucher series
            const lastNumber = employee.LastVoucherNumber || 0;
            const nextNumber = lastNumber + 1;
            
            // Get the base prefix from request body (e.g., 'RS' for EmployeeSaleInvoice, 'SRS' for SalesReturns, 'RMB' for RentalMonthlyBill)
            // IMPORTANT: Use voucherSeries from req.body
            // Extract just the prefix if full format is sent (e.g., 'SRS' from 'SRS-25PAT-JD' or just 'SRS')
            let basePrefix = 'RS'; // Default
            if (voucherSeries) {
              const upperVoucherSeries = voucherSeries.trim().toUpperCase();
              // Check in order: SRS, RMB, CR, BR, RS (order matters for prefix matching)
              if (upperVoucherSeries.startsWith('SRS')) {
                basePrefix = 'SRS';
              } else if (upperVoucherSeries.startsWith('RMB')) {
                basePrefix = 'RMB';
              } else if (upperVoucherSeries.startsWith('CR')) {
                basePrefix = 'CR';
              } else if (upperVoucherSeries.startsWith('BR')) {
                basePrefix = 'BR';
              } else if (upperVoucherSeries.startsWith('RS')) {
                basePrefix = 'RS';
              } else {
                // If it's just a prefix like 'SRS', 'RMB', 'CR', 'BR', or 'RS', use it directly
                basePrefix = upperVoucherSeries;
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
          // For 'RMB' (RentalMonthlyBill): RMB-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
          // Example: RMB-25NAM-JD
          // For 'CR' (CashReceipt): CR-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
          // Example: CR-26NAM-JD
          // For 'BR' (BankReceipt): BR-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
          // Example: BR-26NAM-JD
          // For 'RS' with dash format (RentalService): RS-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
          // Example: RS-25PAT-Mo
          // For 'RS' without dash (EmployeeSaleInvoice): RS{CurrentYear}-{NextYear}{BranchShortName}-{EmployeeShortName}
          // Example: RS25-26PAT-Mo
          
          // Check if the voucherSeries from frontend already has the RentalService format (RS-...)
          const isRentalServiceFormat = voucherSeries && voucherSeries.trim().match(/^RS-\d{2}/);
          const isRentalMonthlyBillFormat = voucherSeries && voucherSeries.trim().match(/^RMB-\d{2}/);
          const isCashReceiptFormat = voucherSeries && voucherSeries.trim().match(/^CR-\d{2}/);
          const isBankReceiptFormat = voucherSeries && voucherSeries.trim().match(/^BR-\d{2}/);
          
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
          } else if (basePrefix === 'RMB' || isRentalMonthlyBillFormat) {
            // Rental Monthly Bill format: RMB-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
            if (branchShortName && shortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
            } else if (branchShortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
            } else if (shortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
            } else {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}`;
            }
          } else if (basePrefix === 'CR' || isCashReceiptFormat) {
            // Cash Receipt format: CR-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
            if (branchShortName && shortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}-${shortName}`;
            } else if (branchShortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}${branchShortName}`;
            } else if (shortName) {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}-${shortName}`;
            } else {
              finalVoucherSeries = `${basePrefix}-${currentYearSuffix}`;
            }
          } else if (basePrefix === 'BR' || isBankReceiptFormat) {
            // Bank Receipt format: BR-{CurrentYearLast2}{BranchShortName}-{EmployeeShortName}
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
        }
        
        // Validate that finalVoucherSeries and finalVoucherNo are set
        if (!finalVoucherSeries || !finalVoucherNo) {
          await transaction.rollback();
          console.error('❌ Voucher generation failed: finalVoucherSeries or finalVoucherNo is missing');
          console.error(`   finalVoucherSeries: ${finalVoucherSeries}`);
          console.error(`   finalVoucherNo: ${finalVoucherNo}`);
          return res.status(500).json({
            success: false,
            message: `Failed to generate voucher: voucherSeries or voucherNo is missing`,
          });
        }
        
        console.log(`📝 Final voucher to be stored: ${finalVoucherSeries}-${finalVoucherNo}`);
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
          MachinePurchasedDate = @machinePurchasedDate,
          ContractExpiredOn = @contractExpiredOn,
          RemainingDays = @remainingDays,
          RemainingCopies = @remainingCopies,
          SalesAccount = @salesAccount,
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
      // Additional fields for RentalMonthlyBill and other screens
      updateRequest.input('machinePurchasedDate', header?.machinePurchasedDate || null);
      updateRequest.input('contractExpiredOn', header?.contractExpiredOn || null);
      updateRequest.input('remainingDays', header?.remainingDays ? parseInt(header.remainingDays) || null : null);
      updateRequest.input('remainingCopies', header?.remainingCopies ? parseFloat(header.remainingCopies) || 0 : 0);
      updateRequest.input('salesAccount', header?.salesAccount || null);
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
      
      // Delete existing items, adjustments, and readings for this invoice
      const deleteItemsRequest = new sql.Request(transaction);
      deleteItemsRequest.input('invoiceID', sql.Int, finalInvoiceID);
      await deleteItemsRequest.query(`DELETE FROM InvoiceItems WHERE InvoiceID = @invoiceID`);
      
      const deleteAdjustmentsRequest = new sql.Request(transaction);
      deleteAdjustmentsRequest.input('invoiceID', sql.Int, finalInvoiceID);
      await deleteAdjustmentsRequest.query(`DELETE FROM InvoiceAdjustments WHERE InvoiceID = @invoiceID`);
      
      // Delete readings if table exists
      try {
        const deleteReadingsRequest = new sql.Request(transaction);
        deleteReadingsRequest.input('invoiceID', sql.Int, finalInvoiceID);
        await deleteReadingsRequest.query(`DELETE FROM InvoiceReadings WHERE InvoiceID = @invoiceID`);
      } catch (readingsDeleteError) {
        // Table might not exist yet, ignore error
        if (!readingsDeleteError.message.includes("Invalid object name 'InvoiceReadings'")) {
          console.warn('⚠️ Could not delete readings:', readingsDeleteError.message);
        }
      }
    } else {
      // INSERT new invoice
      const insertQuery = `
        INSERT INTO InvoiceMain (
          VoucherSeries, VoucherNo, VoucherDatetime,
          TransactionDate, TransactionTime,
          Branch, Location, EmployeeLocation, Username,
          HeaderDate, BillerName, EmployeeName, CustomerID, CustomerName,
          ReadingA4, ReadingA3, MachineType, Remarks, GstBill,
          MachinePurchasedDate, ContractExpiredOn, RemainingDays, RemainingCopies, SalesAccount,
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
          @machinePurchasedDate, @contractExpiredOn, @remainingDays, @remainingCopies, @salesAccount,
          @collectedCash, @collectedCard, @collectedUpi, @balance,
          @itemCount, @totalQty, @totalGross, @totalDiscount,
          @totalAdd, @totalLess, @totalBillValue, @ledgerBalance,
          @createdBy
        );
        SELECT SCOPE_IDENTITY() AS InvoiceID;
      `;

      const mainRequest = new sql.Request(transaction);
      // Ensure voucherSeries is a string and not null/undefined
      const voucherSeriesToStore = String(finalVoucherSeries || voucherSeries || 'RS').trim();
      const voucherNoToStore = String(finalVoucherNo || voucherNo || '1').trim();
      
      console.log(`💾 Storing voucher in InvoiceMain: Series="${voucherSeriesToStore}", No="${voucherNoToStore}"`);
      
      mainRequest.input('voucherSeries', sql.VarChar(50), voucherSeriesToStore);
      mainRequest.input('voucherNo', sql.VarChar(50), voucherNoToStore);
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
      // Additional fields for RentalMonthlyBill and other screens
      mainRequest.input('machinePurchasedDate', header?.machinePurchasedDate || null);
      mainRequest.input('contractExpiredOn', header?.contractExpiredOn || null);
      mainRequest.input('remainingDays', header?.remainingDays ? parseInt(header.remainingDays) || null : null);
      mainRequest.input('remainingCopies', header?.remainingCopies ? parseFloat(header.remainingCopies) || 0 : 0);
      mainRequest.input('salesAccount', header?.salesAccount || null);
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
      
      // Verify the voucherSeries was stored correctly
      const verifyRequest = new sql.Request(transaction);
      verifyRequest.input('invoiceID', sql.Int, finalInvoiceID);
      const verifyResult = await verifyRequest.query(`
        SELECT VoucherSeries, VoucherNo 
        FROM InvoiceMain 
        WHERE InvoiceID = @invoiceID
      `);
      if (verifyResult.recordset && verifyResult.recordset.length > 0) {
        const stored = verifyResult.recordset[0];
        console.log(`✅ Verified stored voucher: ${stored.VoucherSeries}-${stored.VoucherNo} (InvoiceID: ${finalInvoiceID})`);
        if (stored.VoucherSeries !== voucherSeriesToStore) {
          console.warn(`⚠️ WARNING: VoucherSeries mismatch! Expected "${voucherSeriesToStore}", but database shows "${stored.VoucherSeries}"`);
        }
      }
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
        const voucherSeriesToStore = String(finalVoucherSeries || voucherSeries || 'RS').trim();
        const voucherNoToStore = String(finalVoucherNo || voucherNo || '1').trim();
        itemRequest.input('voucherSeries', sql.VarChar(50), voucherSeriesToStore);
        itemRequest.input('voucherNo', sql.VarChar(50), voucherNoToStore);
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
        const voucherSeriesToStore = String(finalVoucherSeries || voucherSeries || 'RS').trim();
        const voucherNoToStore = String(finalVoucherNo || voucherNo || '1').trim();
        adjRequest.input('voucherSeries', sql.VarChar(50), voucherSeriesToStore);
        adjRequest.input('voucherNo', sql.VarChar(50), voucherNoToStore);
        adjRequest.input('accountId', adj.accountId || null);
        adjRequest.input('accountName', adj.accountName || '');
        adjRequest.input('accountType', adj.accountType || 'add');
        adjRequest.input('addAmount', parseFloat(adj.addAmount) || 0);
        adjRequest.input('lessAmount', parseFloat(adj.lessAmount) || 0);
        adjRequest.input('comments', adj.comments || '');
        
        await adjRequest.query(adjQuery);
      }
    }

    // 4. Insert Readings into InvoiceReadings (if readings data exists)
    // This stores readings data for RentalMonthlyBill, RentalService, etc.
    const { readings } = req.body;
    if (readings) {
      // Delete existing readings for this invoice (if updating)
      if (isUpdate) {
        const deleteReadingsRequest = new sql.Request(transaction);
        deleteReadingsRequest.input('invoiceID', sql.Int, finalInvoiceID);
        await deleteReadingsRequest.query(`DELETE FROM InvoiceReadings WHERE InvoiceID = @invoiceID`);
      }

      // Check if InvoiceReadings table exists before inserting
      try {
        const readingsQuery = `
          INSERT INTO InvoiceReadings (
            InvoiceID, VoucherSeries, VoucherNo,
            CurrentReading, PreviousReading,
            A4, TotalA4, CA4,
            A3, TotalA3, CA3,
            MonthlyCharges, Months,
            FreeCopies, ChargeableCopies, ContractCharges, TestedCopies,
            ReadingsJSON
          )
          VALUES (
            @invoiceID, @voucherSeries, @voucherNo,
            @currentReading, @previousReading,
            @a4, @totalA4, @ca4,
            @a3, @totalA3, @ca3,
            @monthlyCharges, @months,
            @freeCopies, @chargeableCopies, @contractCharges, @testedCopies,
            @readingsJSON
          )
        `;

        const readingsRequest = new sql.Request(transaction);
        readingsRequest.input('invoiceID', finalInvoiceID);
        const voucherSeriesToStore = String(finalVoucherSeries || voucherSeries || 'RS').trim();
        const voucherNoToStore = String(finalVoucherNo || voucherNo || '1').trim();
        readingsRequest.input('voucherSeries', sql.VarChar(50), voucherSeriesToStore);
        readingsRequest.input('voucherNo', sql.VarChar(50), voucherNoToStore);
        readingsRequest.input('currentReading', readings.currentReading || null);
        readingsRequest.input('previousReading', readings.previousReading || null);
        readingsRequest.input('a4', readings.a4 || null);
        readingsRequest.input('totalA4', readings.totalA4 || null);
        readingsRequest.input('ca4', readings.ca4 || null);
        readingsRequest.input('a3', readings.a3 || null);
        readingsRequest.input('totalA3', readings.totalA3 || null);
        readingsRequest.input('ca3', readings.ca3 || null);
        readingsRequest.input('monthlyCharges', readings.monthlyCharges ? parseFloat(readings.monthlyCharges) || 0 : 0);
        readingsRequest.input('months', readings.months || null);
        readingsRequest.input('freeCopies', readings.freeCopies ? parseFloat(readings.freeCopies) || 0 : 0);
        readingsRequest.input('chargeableCopies', readings.chargeableCopies ? parseFloat(readings.chargeableCopies) || 0 : 0);
        readingsRequest.input('contractCharges', readings.contractCharges ? parseFloat(readings.contractCharges) || 0 : 0);
        readingsRequest.input('testedCopies', readings.testedCopies ? parseFloat(readings.testedCopies) || 0 : 0);
        // Store full readings object as JSON for flexibility
        readingsRequest.input('readingsJSON', JSON.stringify(readings));
        
        await readingsRequest.query(readingsQuery);
        console.log(`✅ Readings data saved for invoice ${finalInvoiceID}`);
      } catch (readingsError) {
        // If InvoiceReadings table doesn't exist, log warning but don't fail
        if (readingsError.message.includes("Invalid object name 'InvoiceReadings'")) {
          console.warn('⚠️ InvoiceReadings table does not exist. Run migration script to create it.');
        } else {
          console.warn('⚠️ Could not save readings data:', readingsError.message);
        }
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

