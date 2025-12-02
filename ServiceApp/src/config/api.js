// API Configuration for Mobile App
// Uses API_BASE_URL from .env file (EXPO_PUBLIC_API_BASE_URL) or app.json or fallback
// Find your IP: Windows: ipconfig | Mac/Linux: ifconfig

// IMPORTANT: Create .env file with EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:3000/api
// Or update apiBaseUrl in app.json
// Or update the fallback value below

import { EXPO_PUBLIC_API_BASE_URL } from '@env';

// Default fallback - update this with your computer's IP
const DEFAULT_API_BASE_URL = 'http://192.168.1.100:3000/api';

// Try to get from .env file first, then app.json, then use default
let API_BASE_URL = EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

// Try to get from app.json config (requires expo-constants) as fallback
try {
  const Constants = require('expo-constants');
  if (Constants.expoConfig?.extra?.apiBaseUrl) {
    API_BASE_URL = Constants.expoConfig.extra.apiBaseUrl;
  }
} catch (error) {
  // expo-constants not available, use .env or default
  if (!EXPO_PUBLIC_API_BASE_URL) {
    console.log('Using default API_BASE_URL:', DEFAULT_API_BASE_URL);
  }
}

// API Endpoints
export const API_ENDPOINTS = {
  // Customers (for QR code lookup)
  CUSTOMER_BY_MOBILE: (mobileNo) => `${API_BASE_URL}/customers/mobile/${mobileNo}`,
  CUSTOMER_BY_ID: (customerId) => `${API_BASE_URL}/customers/${customerId}`,
  GET_ALL_CUSTOMERS: `${API_BASE_URL}/customers`,
  CREATE_UPDATE_CUSTOMER: `${API_BASE_URL}/customers`,

  // Invoices
  CREATE_INVOICE: `${API_BASE_URL}/invoices`,
  GET_INVOICE_BY_VOUCHER: (series, no) => `${API_BASE_URL}/invoices/voucher/${series}/${no}`,
  GET_INVOICE_BY_ID: (id) => `${API_BASE_URL}/invoices/${id}`,
  GET_ALL_INVOICES: `${API_BASE_URL}/invoices`,
  UPDATE_INVOICE: (id) => `${API_BASE_URL}/invoices/${id}`,
  DELETE_INVOICE: (id) => `${API_BASE_URL}/invoices/${id}`,

  // Executives
  GET_EXECUTIVE_DATA: (username) => `${API_BASE_URL}/executives/${username}`,

  // Products
  GET_PRODUCT_BY_BARCODE: (barcode) => `${API_BASE_URL}/products/barcode/${barcode}`,
  GET_ALL_PRODUCTS: `${API_BASE_URL}/products`,
};

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  try {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    };

    const response = await fetch(endpoint, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Call Error:', error);
    // Provide more helpful error messages
    if (error.message === 'Network request failed' || error.message.includes('Network')) {
      throw new Error('Cannot connect to server. Please check:\n1. Backend server is running\n2. API_BASE_URL is correct\n3. Phone and computer are on same Wi-Fi');
    }
    throw error;
  }
};

export default API_BASE_URL;

