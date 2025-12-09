const express = require('express');
const router = express.Router();
const { getExecutiveData, authenticateEmployee, authenticateSupervisor } = require('../controllers/executivesController');

// Authenticate employee (login)
router.post('/auth/employee', authenticateEmployee);

// Authenticate supervisor (login)
router.post('/auth/supervisor', authenticateSupervisor);

// Get executive data for auto-populating form
router.get('/:username', getExecutiveData);

module.exports = router;

