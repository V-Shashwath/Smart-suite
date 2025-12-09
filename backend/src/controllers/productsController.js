const { executeQuery } = require('../config/database');

// Get product by barcode
const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required',
      });
    }

    // Mock product data - 20 items supporting 3 barcode scan cases
    // Case 1: Barcodes with serial numbers (ABCD123, DEFG456, etc.) - hasUniqueSerialNo: true
    // Case 2: Barcodes without serial numbers (GEN001, GEN002, etc.) - hasUniqueSerialNo: false
    // Case 3: Manual entry follows Case 1 logic
    
    const trimmedBarcode = barcode.trim().toUpperCase();
    
    // Product mapping - 20 items total
    const products = [
      // Case 1: Products WITH serial numbers (10 items) - Each scan adds new row
      { id: 1, name: 'iPhone 15 Pro', rate: 99999.00, hasUniqueSerialNo: true, barcodes: ['ABCD123', 'ABCD124', 'ABCD125'] },
      { id: 2, name: 'Samsung Galaxy S24', rate: 89999.00, hasUniqueSerialNo: true, barcodes: ['DEFG456', 'DEFG457', 'DEFG458'] },
      { id: 3, name: 'MacBook Pro M3', rate: 199999.00, hasUniqueSerialNo: true, barcodes: ['GHIJ789', 'GHIJ790', 'GHIJ791'] },
      { id: 4, name: 'iPad Air', rate: 59999.00, hasUniqueSerialNo: true, barcodes: ['KLMN012', 'KLMN013', 'KLMN014'] },
      { id: 5, name: 'Dell XPS 15', rate: 149999.00, hasUniqueSerialNo: true, barcodes: ['OPQR345', 'OPQR346', 'OPQR347'] },
      { id: 6, name: 'Sony WH-1000XM5', rate: 29999.00, hasUniqueSerialNo: true, barcodes: ['STUV678', 'STUV679', 'STUV680'] },
      { id: 7, name: 'Canon EOS R5', rate: 399999.00, hasUniqueSerialNo: true, barcodes: ['WXYZ901', 'WXYZ902', 'WXYZ903'] },
      { id: 8, name: 'Nintendo Switch OLED', rate: 34999.00, hasUniqueSerialNo: true, barcodes: ['ABCD234', 'ABCD235', 'ABCD236'] },
      { id: 9, name: 'Apple Watch Ultra', rate: 89999.00, hasUniqueSerialNo: true, barcodes: ['EFGH567', 'EFGH568', 'EFGH569'] },
      { id: 10, name: 'PlayStation 5', rate: 49999.00, hasUniqueSerialNo: true, barcodes: ['IJKL890', 'IJKL891', 'IJKL892'] },
      
      // Case 2: Products WITHOUT serial numbers (10 items) - First scan adds row, subsequent scans increment
      { id: 11, name: 'A4 Xerox - Black & White', rate: 2.00, hasUniqueSerialNo: false, barcodes: ['GEN001', 'GEN002'] },
      { id: 12, name: 'A4 Xerox - Color', rate: 5.00, hasUniqueSerialNo: false, barcodes: ['GEN003', 'GEN004'] },
      { id: 13, name: 'A3 Xerox - Black & White', rate: 4.00, hasUniqueSerialNo: false, barcodes: ['GEN005', 'GEN006'] },
      { id: 14, name: 'A3 Xerox - Color', rate: 10.00, hasUniqueSerialNo: false, barcodes: ['GEN007', 'GEN008'] },
      { id: 15, name: 'Lamination - A4', rate: 15.00, hasUniqueSerialNo: false, barcodes: ['GEN009', 'GEN010'] },
      { id: 16, name: 'Lamination - A3', rate: 25.00, hasUniqueSerialNo: false, barcodes: ['GEN011', 'GEN012'] },
      { id: 17, name: 'Binding - Spiral', rate: 30.00, hasUniqueSerialNo: false, barcodes: ['GEN013', 'GEN014'] },
      { id: 18, name: 'Binding - Thermal', rate: 40.00, hasUniqueSerialNo: false, barcodes: ['GEN015', 'GEN016'] },
      { id: 19, name: 'Printing - Single Side', rate: 3.00, hasUniqueSerialNo: false, barcodes: ['GEN017', 'GEN018'] },
      { id: 20, name: 'Photo Printing - 4x6', rate: 20.00, hasUniqueSerialNo: false, barcodes: ['GEN019', 'GEN020'] },
    ];
    
    // Find product by barcode
    let product = null;
    for (const p of products) {
      if (p.barcodes && p.barcodes.includes(trimmedBarcode)) {
        product = {
          id: p.id,
          name: p.name,
          rate: p.rate,
          hasUniqueSerialNo: p.hasUniqueSerialNo,
        };
        break;
      }
    }
    
    // Also support numeric barcodes (1-20) for backward compatibility
    if (!product) {
      const numericBarcode = parseInt(trimmedBarcode);
      if (!isNaN(numericBarcode) && numericBarcode >= 1 && numericBarcode <= 20) {
        const p = products[numericBarcode - 1];
        product = {
          id: p.id,
          name: p.name,
          rate: p.rate,
          hasUniqueSerialNo: p.hasUniqueSerialNo,
        };
      }
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with barcode: ${trimmedBarcode}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        productId: product.id,
        productName: product.name,
        rate: product.rate,
        hasUniqueSerialNo: product.hasUniqueSerialNo || false,
        barcode: trimmedBarcode,
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

module.exports = {
  getProductByBarcode,
};

