const express = require('express');
const router = express.Router();
const { getProductByBarcode, getAllProducts } = require('../controllers/productsController');

// Get product by barcode
router.get('/barcode/:barcode', getProductByBarcode);

// Get all products
router.get('/', getAllProducts);

module.exports = router;

