// Mock data for InvoiceScreen

// Dropdown Options
export const branches = [
  'Godown Spares (Ho)',
  'Head Office',
  'Namakkal',
  'Pattukottai',
  'Perambalur',
  'Pudukottai',
  'TAB Complex',
  'Thanjavur',
  'Thiruvarur',
  'Trichy',
  'Work Shop (Ho)',
];

export const locations = [
  'Moorthy Location',
  'Murugan Location',
  'Muruganantham Location',
];

export const employeeUsernames = [
  'Satya',
  'SSS',
  'Supervisor',
  'USER',
];

export const productOptions = [
  '3025 Main Drive Assembly',
  '3045 Main Drive Assembly',
  '3245 Main Drive Assembly',
  '33 Main Drive Assembly',
  '3530 Main Drive Assembly',
  'A3 70 Gsm -JK',
  'A3 70 Gsm - TNPL',
  'A3 75 Gsm - TNPL',
  'A3 80 Gsm - TNPL',
  'A4 100 Gsm - JK- Cedar',
  'A4 100 Gsm - JK Bond (100 Sheets)',
];

export const adjustmentAccounts = [
  'Service Charge',
  'Per Call Charges',
  'Discount',
  'Other Adjustment',
];

export const machineTypes = [
  'Xerox Machine Model XYZ',
  'Canon ImageRunner',
  'HP LaserJet Pro',
  'Ricoh MP Series',
  'Konica Minolta Bizhub',
];

export const transactionDetails = {
  transactionId: 'TXN-2025-001234',
  date: '17-11-2025',
  time: '19:29:05',
  status: 'Pending',
  branch: 'Head Office',
  location: 'Moorthy Location',
  employeeLocation: 'Moorthy Location',
  username: 'Supervisor',
};

export const voucherDetails = {
  voucherSeries: 'RS24',
  voucherNo: '1',
  voucherDatetime: '17-11-2025 19:29:05',
};

export const initialCustomer = {
  date: '15-Nov-2025',
  billerName: 'ABC Enterprises',
  party: 'Retail Customer',
  employeeName: 'John Doe',
  customerId: 'CUST-001',
  mobileNo: '+91-9876543210',
  customerType: 'Regular',
  whatsappNo: '+91-9876543210',
  readingA4: '1250',
  readingA3: '850',
  machineType: 'Xerox Machine Model XYZ',
  remarks: 'Customer requested urgent delivery',
  gstBill: false,
};

export const products = [
  { id: 1, name: 'A4 Xerox - Black & White', rate: 2.00, hasUniqueSerialNo: false }, // Generic item, no individual tracking
  { id: 2, name: 'A4 Xerox - Color', rate: 5.00, hasUniqueSerialNo: false },
  { id: 3, name: 'A3 Xerox - Black & White', rate: 4.00, hasUniqueSerialNo: false },
  { id: 4, name: 'A3 Xerox - Color', rate: 10.00, hasUniqueSerialNo: false },
  { id: 5, name: 'Lamination - A4', rate: 15.00, hasUniqueSerialNo: false },
  { id: 6, name: 'Lamination - A3', rate: 25.00, hasUniqueSerialNo: false },
  { id: 7, name: 'Binding - Spiral', rate: 30.00, hasUniqueSerialNo: false },
  { id: 8, name: 'Binding - Thermal', rate: 40.00, hasUniqueSerialNo: false },
  { id: 9, name: 'Printing - Single Side', rate: 3.00, hasUniqueSerialNo: false },
  { id: 10, name: 'Printing - Double Side', rate: 5.00, hasUniqueSerialNo: false },
  { id: 11, name: 'Scanning Service', rate: 10.00, hasUniqueSerialNo: false },
  { id: 12, name: 'Photo Printing - 4x6', rate: 20.00, hasUniqueSerialNo: false },
  // Example: Products with unique serial numbers (for electronics, etc.)
  // Uncomment these when needed:
  // { id: 13, name: 'iPhone 13 Pro', rate: 50000.00, hasUniqueSerialNo: true }, // Each has unique IMEI
  // { id: 14, name: 'Samsung Galaxy S23', rate: 45000.00, hasUniqueSerialNo: true },
];

export const adjustmentsList = [
  { id: 1, name: 'Discount - Percentage', type: 'less' },
  { id: 2, name: 'Discount - Flat Amount', type: 'less' },
  { id: 3, name: 'GST - 18%', type: 'add' },
  { id: 4, name: 'GST - 12%', type: 'add' },
  { id: 5, name: 'GST - 5%', type: 'add' },
  { id: 6, name: 'CGST - 9%', type: 'add' },
  { id: 7, name: 'SGST - 9%', type: 'add' },
  { id: 8, name: 'Service Charge', type: 'add' },
  { id: 9, name: 'Delivery Charge', type: 'add' },
  { id: 10, name: 'Handling Fee', type: 'add' },
  { id: 11, name: 'Packing Charge', type: 'add' },
  { id: 12, name: 'Round Off', type: 'less' },
  { id: 13, name: 'Early Payment Discount', type: 'less' },
  { id: 14, name: 'Loyalty Discount', type: 'less' },
];

export const mockInvoiceData = {
  transaction: transactionDetails,
  voucher: voucherDetails,
  customer: initialCustomer,
  products: products,
  adjustments: adjustmentsList,
};

