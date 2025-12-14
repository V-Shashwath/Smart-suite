const { executeProcedure, executeQuery, getPool, sql } = require('../config/database');

// Get all executives with their screen assignments
const getAllExecutivesWithScreens = async (req, res) => {
  try {
    const result = await executeProcedure('sp_GetAllExecutivesWithScreens');

    if (!result || result.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Parse assigned screens from comma-separated string
    const executives = result.map((exec) => ({
      employeeId: exec.EmployeeID,
      username: exec.Username,
      employeeName: exec.EmployeeName,
      shortName: exec.ShortName,
      email: exec.Email,
      mobileNo: exec.MobileNo,
      branch: exec.Branch,
      location: exec.Location,
      employeeLocation: exec.EmployeeLocation,
      billerName: exec.BillerName,
      voucherSeries: exec.VoucherSeries,
      lastVoucherNumber: exec.LastVoucherNumber,
      assignedScreens: exec.AssignedScreens
        ? exec.AssignedScreens.split(',').filter((s) => s.trim().length > 0)
        : [],
    }));

    return res.status(200).json({
      success: true,
      data: executives,
    });
  } catch (error) {
    console.error('Error fetching executives with screens:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching executives with screens',
      error: error.message,
    });
  }
};

// Get screen assignments for a specific executive
const getExecutiveScreenAssignments = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    const result = await executeProcedure('sp_GetExecutiveScreenAssignments', {
      EmployeeID: parseInt(employeeId, 10),
    });

    const assignedScreens = result ? result.map((row) => row.ScreenRoute) : [];

    return res.status(200).json({
      success: true,
      data: {
        employeeId: parseInt(employeeId, 10),
        assignedScreens,
      },
    });
  } catch (error) {
    console.error('Error fetching executive screen assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching executive screen assignments',
      error: error.message,
    });
  }
};

// Set screen assignments for an executive
const setExecutiveScreenAssignments = async (req, res) => {
  try {
    const { employeeId, assignedScreens, modifiedBy } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    if (!Array.isArray(assignedScreens)) {
      return res.status(400).json({
        success: false,
        message: 'assignedScreens must be an array',
      });
    }

    // Convert array to comma-separated string
    const screenRoutes = assignedScreens.join(',');

    const result = await executeProcedure('sp_SetExecutiveScreenAssignments', {
      EmployeeID: parseInt(employeeId, 10),
      ScreenRoutes: screenRoutes,
      ModifiedBy: modifiedBy || 'System',
    });

    if (result && result.length > 0 && result[0].Success === 1) {
      return res.status(200).json({
        success: true,
        message: result[0].Message || 'Screen assignments updated successfully',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result && result.length > 0 ? result[0].Message : 'Failed to update screen assignments',
      });
    }
  } catch (error) {
    console.error('Error setting executive screen assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error setting executive screen assignments',
      error: error.message,
    });
  }
};

module.exports = {
  getAllExecutivesWithScreens,
  getExecutiveScreenAssignments,
  setExecutiveScreenAssignments,
};

