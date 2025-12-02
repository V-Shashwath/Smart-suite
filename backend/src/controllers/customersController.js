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

// Create or update customer
const createOrUpdateCustomer = async (req, res) => {
  try {
    const { customerID, customerName, mobileNo, whatsAppNo, customerType } = req.body;
    
    if (!customerID || !customerName || !mobileNo) {
      return res.status(400).json({
        success: false,
        message: 'CustomerID, CustomerName, and MobileNo are required',
      });
    }

    const query = `
      IF EXISTS (SELECT 1 FROM Customers WHERE CustomerID = @customerID)
        UPDATE Customers
        SET CustomerName = @customerName,
            MobileNo = @mobileNo,
            WhatsAppNo = @whatsAppNo,
            CustomerType = @customerType,
            ModifiedDate = GETDATE()
        WHERE CustomerID = @customerID
      ELSE
        INSERT INTO Customers (CustomerID, CustomerName, MobileNo, WhatsAppNo, CustomerType)
        VALUES (@customerID, @customerName, @mobileNo, @whatsAppNo, @customerType)
    `;

    await executeQuery(query, {
      customerID,
      customerName,
      mobileNo,
      whatsAppNo: whatsAppNo || mobileNo,
      customerType: customerType || 'Regular',
    });

    return res.status(200).json({
      success: true,
      message: 'Customer saved successfully',
    });
  } catch (error) {
    console.error('Error saving customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving customer data',
      error: error.message,
    });
  }
};

// Get all customers (with pagination)
const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        CustomerID,
        CustomerName,
        MobileNo,
        WhatsAppNo,
        CustomerType,
        CreatedDate,
        ModifiedDate
      FROM Customers
      ORDER BY CustomerName
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await executeQuery(query, {
      offset,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message,
    });
  }
};

module.exports = {
  getCustomerByMobile,
  getCustomerByID,
  createOrUpdateCustomer,
  getAllCustomers,
};

