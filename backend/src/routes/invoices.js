const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getInvoiceByVoucher,
  getInvoiceByID,
  getAllInvoices,
  updateInvoice,
  deleteInvoice,
} = require('../controllers/invoicesController');

// Create new invoice
router.post('/', createInvoice);

// Get invoice by voucher series and number
router.get('/voucher/:voucherSeries/:voucherNo', getInvoiceByVoucher);

// Get invoice by ID
router.get('/:invoiceId', getInvoiceByID);

// Get all invoices
router.get('/', getAllInvoices);

// Update invoice
router.put('/:invoiceId', updateInvoice);

// Delete invoice
router.delete('/:invoiceId', deleteInvoice);

module.exports = router;

