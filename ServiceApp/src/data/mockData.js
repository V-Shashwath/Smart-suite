// Mock data for InvoiceScreen

export const transactionDetails = {
  transactionId: 'TXN-2025-001234',
  transactionDate: '15-Nov-2025',
  transactionTime: '14:30:45',
  status: 'Completed',
  transactionType: 'Sales Invoice',
  paymentMethod: 'Cash',
  reference: 'REF-2025-ABC',
};

export const voucherDetails = {
  voucherNumber: 'VCH-2025-5678',
  voucherDate: '15-Nov-2025',
  voucherType: 'Sales',
  series: 'INV-2025',
  prefix: 'SI',
  suffix: '001',
  fiscalYear: '2025-2026',
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
  { id: 1, name: 'A4 Xerox - Black & White', rate: 2.00 },
  { id: 2, name: 'A4 Xerox - Color', rate: 5.00 },
  { id: 3, name: 'A3 Xerox - Black & White', rate: 4.00 },
  { id: 4, name: 'A3 Xerox - Color', rate: 10.00 },
  { id: 5, name: 'Lamination - A4', rate: 15.00 },
  { id: 6, name: 'Lamination - A3', rate: 25.00 },
  { id: 7, name: 'Binding - Spiral', rate: 30.00 },
  { id: 8, name: 'Binding - Thermal', rate: 40.00 },
  { id: 9, name: 'Printing - Single Side', rate: 3.00 },
  { id: 10, name: 'Printing - Double Side', rate: 5.00 },
  { id: 11, name: 'Scanning Service', rate: 10.00 },
  { id: 12, name: 'Photo Printing - 4x6', rate: 20.00 },
];

export const mockInvoiceData = {
  transaction: transactionDetails,
  voucher: voucherDetails,
  customer: initialCustomer,
  products: products,
};

