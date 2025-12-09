const { executeQuery, executeProcedure } = require('../config/database');

// Get customer by mobile number (for QR code lookup)
const getCustomerByMobile = async (req, res) => {
  try {
    const { mobileNo } = req.params;
    
    if (!mobileNo) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required',
      });
    }

    // Remove any non-numeric characters for search
    const cleanMobile = mobileNo.replace(/\D/g, '');
    
    // Use stored procedure or direct query
    const result = await executeProcedure('sp_GetCustomerByMobile', {
      MobileNo: cleanMobile,
    });

    if (result && result.length > 0) {
      return res.status(200).json({
        success: true,
        data: result[0],
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
  } catch (error) {
    console.error('Error fetching customer by mobile:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching customer data',
      error: error.message,
    });
  }
};

// Get customer by CustomerID
const getCustomerByID = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required',
      });
    }

    const result = await executeProcedure('sp_GetCustomerByID', {
      CustomerID: customerId,
    });

    if (result && result.length > 0) {
      return res.status(200).json({
        success: true,
        data: result[0],
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching customer data',
      error: error.message,
    });
  }
};

module.exports = {
  getCustomerByMobile,
  getCustomerByID,
};

