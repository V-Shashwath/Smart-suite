const express = require('express');
const router = express.Router();
const { getExecutiveData } = require('../controllers/executivesController');

// Get executive data for auto-populating form
router.get('/:username', getExecutiveData);

module.exports = router;

