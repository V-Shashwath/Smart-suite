const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice
} = require('../controllers/invoicesController');

// GET /api/invoices - Get all invoices
router.get('/', getAllInvoices);

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id', getInvoiceById);

// POST /api/invoices - Create new invoice
router.post('/', createInvoice);

module.exports = router;

