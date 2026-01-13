/**
 * Utility functions for time formatting
 */

/**
 * Get current time in en-GB format (HH:mm:ss)
 * @returns {string} Formatted time string
 */
export const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

/**
 * Get current date in en-GB format (DD/MM/YYYY)
 * @returns {string} Formatted date string
 */
export const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

/**
 * Get current date and time combined
 * @returns {string} Formatted datetime string
 */
export const getCurrentDateTime = () => {
  const date = getCurrentDate();
  const time = getCurrentTime();
  return `${date} ${time}`;
};

/**
 * Get display time - always use device's local time for display
 * This ensures the time shown matches the user's actual local time,
 * regardless of what timezone the backend server is in.
 * @param {string} time - Time string from backend or state (ignored for display, but kept for compatibility)
 * @returns {string} Time string to display (always device's local time)
 */
export const getDisplayTime = (time) => {
  // Always use device's local time for display to ensure accuracy
  // The backend time might be in a different timezone (e.g., UTC vs IST)
  return getCurrentTime();
};
