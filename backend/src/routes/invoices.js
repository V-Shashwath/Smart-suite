const express = require('express');
const router = express.Router();
const { createInvoice } = require('../controllers/invoicesController');

router.post('/', createInvoice);

module.exports = router;

