const express = require('express');
const router = express.Router();
const {
  getCustomerByMobile,
  getCustomerByID,
  createOrUpdateCustomer,
  getAllCustomers,
} = require('../controllers/customersController');

// Get customer by mobile number (for QR code lookup)
router.get('/mobile/:mobileNo', getCustomerByMobile);

// Get customer by CustomerID
router.get('/:customerId', getCustomerByID);

// Get all customers
router.get('/', getAllCustomers);

// Create or update customer
router.post('/', createOrUpdateCustomer);

module.exports = router;

