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

    // TODO: Create Products table and implement proper lookup
    // For now, using a simple query that can be extended
    
    // Example query structure (adjust based on your Products table):
    /*
    const query = `
      SELECT 
        ProductId,
        ProductName,
        Rate,
        HasUniqueSerialNo,
        Barcode
      FROM Products
      WHERE Barcode = @barcode OR ProductId = @barcode
    `;
    
    const result = await executeQuery(query, { barcode });
    */

    // Temporary: Return mock data structure
    // Replace this with actual database query when Products table is created
    const trimmedBarcode = barcode.trim();
    const numericBarcode = parseInt(trimmedBarcode);

    // Mock product mapping (replace with database query)
    let product = null;
    
    // Simple mapping for testing
    if (!isNaN(numericBarcode) && numericBarcode > 0 && numericBarcode <= 12) {
      const products = [
        { id: 1, name: 'A4 Xerox - Black & White', rate: 2.00, hasUniqueSerialNo: true },
        { id: 2, name: 'A4 Xerox - Color', rate: 5.00, hasUniqueSerialNo: false },
        { id: 3, name: 'A3 Xerox - Black & White', rate: 4.00, hasUniqueSerialNo: false },
        { id: 4, name: 'A3 Xerox - Color', rate: 10.00, hasUniqueSerialNo: false },
        { id: 5, name: 'Lamination - A4', rate: 15.00, hasUniqueSerialNo: false },
        { id: 6, name: 'Lamination - A3', rate: 25.00, hasUniqueSerialNo: false },
        { id: 7, name: 'Binding - Spiral', rate: 30.00, hasUniqueSerialNo: false },
        { id: 8, name: 'Binding - Thermal', rate: 40.00, hasUniqueSerialNo: false },
        { id: 9, name: 'Printing - Single Side', rate: 3.00, hasUniqueSerialNo: false },
        { id: 10, name: 'Printing - Double Side', rate: 5.00, hasUniqueSerialNo: false },
        { id: 11, name: 'Scanning Service', rate: 10.00, hasUniqueSerialNo: false },
        { id: 12, name: 'Photo Printing - 4x6', rate: 20.00, hasUniqueSerialNo: false },
      ];
      
      product = products.find(p => p.id === numericBarcode);
    }

    // Also try by barcode length (for different barcode formats)
    if (!product) {
      const barcodeLength = trimmedBarcode.length;
      const products = [
        { id: 1, name: 'A4 Xerox - Black & White', rate: 2.00, hasUniqueSerialNo: true },
        { id: 2, name: 'A4 Xerox - Color', rate: 5.00, hasUniqueSerialNo: false },
        { id: 3, name: 'A3 Xerox - Black & White', rate: 4.00, hasUniqueSerialNo: false },
      ];
      
      if (barcodeLength >= 7 && barcodeLength <= 8) {
        product = products[0];
      } else if (barcodeLength >= 10 && barcodeLength <= 12) {
        product = products[1];
      } else if (barcodeLength === 13) {
        product = products[2];
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

// Get all products
const getAllProducts = async (req, res) => {
  try {
    // TODO: Implement when Products table is created
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Products endpoint - implement when Products table is created',
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message,
    });
  }
};

module.exports = {
  getProductByBarcode,
  getAllProducts,
};

