const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  getProductsByCategory
} = require('../controllers/productsController');

// GET /api/products - Get all products
router.get('/', getAllProducts);

// GET /api/products/barcode/:barcode - Get product by barcode
router.get('/barcode/:barcode', getProductByBarcode);

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', getProductsByCategory);

// GET /api/products/:id - Get product by ID
router.get('/:id', getProductById);

module.exports = router;

