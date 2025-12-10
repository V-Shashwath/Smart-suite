const { executeQuery, getPool } = require('../config/database');

// Get product by barcode from CrystalCopier database
const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required',
      });
    }

    const trimmedBarcode = barcode.trim();

    // Query CrystalCopier database
    // Query: Select a.MasterName,a.ShortName,b.SerialNo from Master_ShortName_Table a 
    //        left join ProductSerialNosView b on a.MasterName=b.Product 
    //        where MasterType='Product' AND a.ShortName = @barcode
    const query = `
      SELECT 
        a.MasterName,
        a.ShortName,
        b.SerialNo
      FROM CrystalCopier.dbo.Master_ShortName_Table a
      LEFT JOIN CrystalCopier.dbo.ProductSerialNosView b ON a.MasterName = b.Product
      WHERE a.MasterType = 'Product' AND a.ShortName = @barcode
    `;

    const pool = await getPool();
    const request = pool.request();
    request.input('barcode', trimmedBarcode);
    
    const result = await request.query(query);
    const rows = result.recordset;

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product not found with barcode: ${trimmedBarcode}`,
      });
    }

    // Get the first row for product details (MasterName, ShortName are same for all rows)
    const firstRow = rows[0];
    const masterName = firstRow.MasterName;
    const shortName = firstRow.ShortName;

    // Determine hasUniqueSerialNo based on SerialNo
    // Logic: 
    // - If ANY row has a non-null, non-blank SerialNo, then hasUniqueSerialNo = true
    //   (This means the product type supports serial numbers, so always add new row)
    // - If ALL rows have NULL or blank SerialNo, then hasUniqueSerialNo = false
    //   (This means no serial numbers, so increment quantity when scanned 2nd or more time)
    // 
    // Handle case: Same barcode given to multiple items (e.g., 11 iPhones with same barcode,
    // some have SerialNo, some don't). If ANY has SerialNo, treat as hasUniqueSerialNo: true
    let hasUniqueSerialNo = false;
    let serialNo = null;

    // Check if any row has a valid SerialNo
    // If found, set hasUniqueSerialNo = true (product supports serials, always add new row)
    for (const row of rows) {
      const rowSerialNo = row.SerialNo;
      if (rowSerialNo !== null && rowSerialNo !== undefined && String(rowSerialNo).trim() !== '') {
        hasUniqueSerialNo = true;
        // Use the first non-null SerialNo found (or could use a specific one if needed)
        serialNo = String(rowSerialNo).trim();
        break; // Found at least one with SerialNo - product type supports serials
      }
    }

    // If no SerialNo found in any row, hasUniqueSerialNo remains false
    // This means: All SerialNo are NULL or blank -> increment quantity when scanned 2nd or more time

    // Rate is set to 0 - user will enter it manually in the UI
    // The query only returns MasterName, ShortName, and SerialNo (no rate column)
    const rate = 0; // User will manually enter the rate in the UI

    return res.status(200).json({
      success: true,
      data: {
        productId: shortName, // Using ShortName as productId since no ID column in query
        productName: masterName,
        rate: rate,
        hasUniqueSerialNo: hasUniqueSerialNo,
        barcode: trimmedBarcode,
        productSerialNo: serialNo, // Include the SerialNo if found
      },
    });
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message,
    });
  }
};

// Get issued products for an employee by barcode
const getIssuedProductsByBarcode = async (req, res) => {
  try {
    const { barcode, employeeName } = req.query;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required',
      });
    }

    if (!employeeName) {
      return res.status(400).json({
        success: false,
        message: 'Employee name is required',
      });
    }

    const trimmedBarcode = barcode.trim();
    const trimmedEmployeeName = employeeName.trim();

    // Query CrystalCopier database to get issued products
    // Query: Select a.Product,a.Quantity,a.ProductSerialNo,b.Executive,a.VoucherSeries,a.VoucherNo
    //        from Transaction_ItemBody_Table a
    //        left join Transaction_Header_Table b on a.VoucherSeries=b.VoucherSeries and a.VoucherNo=b.VoucherNo 
    //        WHERE Executive='employeeName'
    // Note: We need to match products by MasterName (Product) that have the given ShortName (barcode)
    const query = `
      SELECT 
        a.Product,
        a.Quantity,
        a.ProductSerialNo,
        b.Executive,
        a.VoucherSeries,
        a.VoucherNo
      FROM CrystalCopier.dbo.Transaction_ItemBody_Table a
      LEFT JOIN CrystalCopier.dbo.Transaction_Header_Table b 
        ON a.VoucherSeries = b.VoucherSeries AND a.VoucherNo = b.VoucherNo
      WHERE b.Executive = @employeeName
        AND a.Product IN (
          SELECT m.MasterName
          FROM CrystalCopier.dbo.Master_ShortName_Table m
          WHERE m.MasterType = 'Product' 
            AND m.ShortName = @barcode
        )
    `;

    const pool = await getPool();
    const request = pool.request();
    request.input('barcode', trimmedBarcode);
    request.input('employeeName', trimmedEmployeeName);
    
    const result = await request.query(query);
    const rows = result.recordset;

    // Filter to only include rows with ProductSerialNo (non-null, non-blank)
    const issuedProducts = rows
      .filter(row => row.ProductSerialNo !== null && 
                     row.ProductSerialNo !== undefined && 
                     String(row.ProductSerialNo).trim() !== '')
      .map(row => ({
        product: row.Product,
        quantity: parseFloat(row.Quantity) || 0,
        productSerialNo: String(row.ProductSerialNo).trim(),
        executive: row.Executive,
        voucherSeries: row.VoucherSeries,
        voucherNo: row.VoucherNo,
      }));

    return res.status(200).json({
      success: true,
      data: {
        barcode: trimmedBarcode,
        employeeName: trimmedEmployeeName,
        issuedProducts: issuedProducts,
      },
    });
  } catch (error) {
    console.error('Error fetching issued products by barcode:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching issued products',
      error: error.message,
    });
  }
};

module.exports = {
  getProductByBarcode,
  getIssuedProductsByBarcode,
};

