// API Configuration for Mobile App
// Frontend connects to Backend, Backend connects to Database

// Backend API URL (backend runs on port 3000, database on port 59320)
// Priority: app.json config > default value
// Using ngrok for cross-network access
let API_BASE_URL = 'https://tenley-ophiologic-danielle.ngrok-free.dev/api'; // Default fallback (ngrok URL)

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
  GET_EXECUTIVE_DATA: (username) => `${API_BASE_URL}/executives/${username}`,
  AUTHENTICATE_EMPLOYEE: `${API_BASE_URL}/executives/auth/employee`,
  AUTHENTICATE_SUPERVISOR: `${API_BASE_URL}/executives/auth/supervisor`,

  // Products
  GET_PRODUCT_BY_BARCODE: (barcode) => `${API_BASE_URL}/products/barcode/${barcode}`,
};

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  try {
    console.log(`🌐 API Call: ${endpoint}`);
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Bypass ngrok browser warning page
      },
      timeout: 15000, // 15 second timeout (increased for tunnel)
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
      throw new Error('Cannot connect to server. Please check:\n1. Backend server is running\n2. API_BASE_URL is correct\n3. For tunnel: Backend must be accessible from internet');
    }
    throw error;
  }
};

export default API_BASE_URL;

