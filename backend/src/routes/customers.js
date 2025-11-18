const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  searchCustomers,
  createCustomer
} = require('../controllers/customersController');

// GET /api/customers - Get all customers
router.get('/', getAllCustomers);

// GET /api/customers/search - Search customers
router.get('/search', searchCustomers);

// GET /api/customers/:id - Get customer by ID
router.get('/:id', getCustomerById);

// POST /api/customers - Create new customer
router.post('/', createCustomer);

module.exports = router;

