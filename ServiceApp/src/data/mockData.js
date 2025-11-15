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

export const mockInvoiceData = {
  transaction: transactionDetails,
  voucher: voucherDetails,
  customer: initialCustomer,
};

