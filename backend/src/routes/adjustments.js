const express = require('express');
const router = express.Router();
const { getAllAdjustments } = require('../controllers/adjustmentsController');

// GET /api/adjustments - Get all adjustment accounts
router.get('/', getAllAdjustments);

module.exports = router;

