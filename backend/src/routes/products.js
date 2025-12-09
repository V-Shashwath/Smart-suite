const express = require('express');
const router = express.Router();
const { getProductByBarcode } = require('../controllers/productsController');

router.get('/barcode/:barcode', getProductByBarcode);

module.exports = router;

