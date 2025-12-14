const express = require('express');
const router = express.Router();
const { getExecutiveData, authenticateEmployee, authenticateSupervisor } = require('../controllers/executivesController');
const {
  getAllExecutivesWithScreens,
  getExecutiveScreenAssignments,
  setExecutiveScreenAssignments,
} = require('../controllers/executiveScreenAssignmentsController');

// Authenticate employee (login)
router.post('/auth/employee', authenticateEmployee);

// Authenticate supervisor (login)
router.post('/auth/supervisor', authenticateSupervisor);

// Get executive data for auto-populating form
router.get('/:username', getExecutiveData);

// Executive screen assignment routes
router.get('/screens/all', getAllExecutivesWithScreens);
router.get('/screens/:employeeId', getExecutiveScreenAssignments);
router.post('/screens/assign', setExecutiveScreenAssignments);

module.exports = router;

