/**
 * Utility function to ensure a value is always a boolean
 * Handles strings, numbers, undefined, null, and other types
 */
export const ensureBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'off' || lower === '') {
      return false;
    }
    // Non-empty string defaults to true
    return Boolean(value);
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  // For objects, arrays, etc., convert to boolean
  return Boolean(value);
};

