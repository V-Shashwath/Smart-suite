// Branch name to short name mapping
// Based on the Branches table from Smart Suite ERP
const branchMapping = {
  'Godown Spares (Ho)': 'GsHo',
  'Head Office': 'HO',
  'Namakkal': 'NAM',
  'Pattukottai': 'PAT',
  'Perambalur': 'PER',
  'Pudukottai': 'PKT',
  'TAB Complex': 'TAB',
  'Thanjavur': 'TAN',
  'Thiruvarur': 'TVR',
  'Trichy': 'TRY',
  'Work Shop (Ho)': 'WsHo',
};

/**
 * Get branch short name from full branch name
 * @param {string} branchName - Full branch name (e.g., "Head Office", "Pattukottai")
 * @returns {string} - Branch short name (e.g., "HO", "PAT") or empty string if not found
 */
const getBranchShortName = (branchName) => {
  if (!branchName) return '';
  
  // Trim whitespace and try exact match first
  const trimmed = branchName.trim();
  if (branchMapping[trimmed]) {
    return branchMapping[trimmed];
  }
  
  // Try case-insensitive match
  const lowerTrimmed = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(branchMapping)) {
    if (key.toLowerCase() === lowerTrimmed) {
      return value;
    }
  }
  
  // If not found, return empty string
  console.warn(`⚠️ Branch short name not found for: "${branchName}"`);
  return '';
};

module.exports = {
  getBranchShortName,
  branchMapping,
};

