// API Configuration for Mobile App
// Frontend connects to Backend, Backend connects to Database

// Backend API URL (deployed on Vercel)
// Priority: app.json config > default value
// Replace YOUR_VERCEL_URL with your actual Vercel deployment URL
let API_BASE_URL = 'https://smart-suite-eight.vercel.app/api'; // Default fallback (Vercel URL)

// Try to get from app.json config if available
try {
  const Constants = require('expo-constants');
  const appJsonUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (appJsonUrl) {
    API_BASE_URL = appJsonUrl;
    console.log('✅ Using API URL from app.json:', API_BASE_URL);
  } else {
    console.log('⚠️ No app.json config found, using default:', API_BASE_URL);
  }
} catch (error) {
  // expo-constants not available, use default
  console.log('⚠️ expo-constants not available, using default API_BASE_URL:', API_BASE_URL);
}

// Log final API URL being used
console.log('🌐 Final API_BASE_URL:', API_BASE_URL);

// API Endpoints
export const API_ENDPOINTS = {
  // Customers
  CUSTOMER_BY_MOBILE: (mobileNo) => `${API_BASE_URL}/customers/mobile/${mobileNo}`,
  CUSTOMER_BY_ID: (customerId) => `${API_BASE_URL}/customers/${customerId}`,

  // Invoices
  CREATE_INVOICE: `${API_BASE_URL}/invoices`,

  // Executives
  GET_EXECUTIVE_DATA: (username, screen) => {
    const baseUrl = `${API_BASE_URL}/executives/${username}`;
    return screen ? `${baseUrl}?screen=${encodeURIComponent(screen)}` : baseUrl;
  },
  AUTHENTICATE_EMPLOYEE: `${API_BASE_URL}/executives/auth/employee`,
  AUTHENTICATE_SUPERVISOR: `${API_BASE_URL}/executives/auth/supervisor`,
  GET_ALL_EXECUTIVES_WITH_SCREENS: `${API_BASE_URL}/executives/screens/all`,
  GET_EXECUTIVE_SCREEN_ASSIGNMENTS: (employeeId) => `${API_BASE_URL}/executives/screens/${employeeId}`,
  SET_EXECUTIVE_SCREEN_ASSIGNMENTS: `${API_BASE_URL}/executives/screens/assign`,

  // Products
  GET_PRODUCT_BY_BARCODE: (barcode) => `${API_BASE_URL}/products/barcode/${barcode}`,
  GET_ISSUED_PRODUCTS_BY_BARCODE: (barcode, employeeName) => 
    `${API_BASE_URL}/products/issued?barcode=${encodeURIComponent(barcode)}&employeeName=${encodeURIComponent(employeeName)}`,
};

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  try {
    console.log(`🌐 API Call: ${endpoint}`);
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout for serverless functions
    };

    const response = await fetch(endpoint, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    });

    console.log(`📡 Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      
      // Handle gateway errors (502, 503) with helpful messages
      if (response.status === 502 || response.status === 503) {
        const gatewayError = new Error(
          `Backend server is not reachable (${response.status}). Please check:\n` +
          `1. Backend is deployed and running on Vercel\n` +
          `2. API_BASE_URL is correctly configured\n` +
          `3. Check Vercel deployment logs for errors\n` +
          `4. Verify database connection is allowed from Vercel IPs`
        );
        gatewayError.status = response.status;
        console.error(`❌ Gateway Error: ${response.status}`, errorData);
        throw gatewayError;
      }
      
      // Only log as error if it's not a 401 (unauthorized) - 401 is expected for failed auth attempts
      if (response.status !== 401) {
        console.error(`❌ API Error: ${response.status}`, errorData);
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API Success`);
    return data;
  } catch (error) {
    // Don't log 401 errors (unauthorized) - these are expected for failed auth attempts
    const is401Error = error.message.includes('401') || error.message.includes('Invalid username or password');
    if (!is401Error) {
      console.error('❌ API Call Error:', error.message);
      console.error('   Endpoint:', endpoint);
    }
    
    // Provide more helpful error messages
    if (error.message === 'Network request failed' || error.message.includes('Network')) {
      throw new Error('Cannot connect to server. Please check:\n1. Backend is deployed on Vercel\n2. API_BASE_URL is correctly configured\n3. Internet connection is active\n4. Vercel deployment is not paused');
    }
    throw error;
  }
};

export default API_BASE_URL;

