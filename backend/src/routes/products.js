const express = require('express');
const router = express.Router();
const { getProductByBarcode, getIssuedProductsByBarcode } = require('../controllers/productsController');

router.get('/barcode/:barcode', getProductByBarcode);
router.get('/issued', getIssuedProductsByBarcode);

module.exports = router;

