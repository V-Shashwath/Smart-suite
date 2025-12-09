const express = require('express');
const router = express.Router();
const { getCustomerByMobile, getCustomerByID } = require('../controllers/customersController');

router.get('/mobile/:mobileNo', getCustomerByMobile);
router.get('/:customerId', getCustomerByID);

module.exports = router;

