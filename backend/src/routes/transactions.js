const express = require('express');
const router = express.Router();
const {
  getDropdownOptions,
  generateVoucherNumber
} = require('../controllers/transactionsController');

// GET /api/transactions/dropdown-options - Get all dropdown options
router.get('/dropdown-options', getDropdownOptions);

// GET /api/transactions/generate-voucher - Generate new voucher number
router.get('/generate-voucher', generateVoucherNumber);

module.exports = router;

