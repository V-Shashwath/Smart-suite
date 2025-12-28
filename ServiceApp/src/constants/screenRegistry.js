export const SCREEN_REGISTRY = [
  {
    route: 'EmployeeSaleInvoice',
    title: 'Employee Sale Invoice',
    icon: 'receipt-long',
    category: 'jobWork',
    assignable: true,
  },
  {
    route: 'CashReceipts',
    title: 'Cash Receipts',
    icon: 'paid',
    category: 'cash',
    assignable: true,
  },
  {
    route: 'BankReceipts',
    title: 'Bank Receipts',
    icon: 'account-balance',
    category: 'bank',
    assignable: true,
  },
  {
    route: 'SalesReturns',
    title: 'Sales Returns',
    icon: 'swap-horiz',
    category: 'refurbished',
    assignable: true,
  },
  {
    route: 'RentalService',
    title: 'Rental Service',
    icon: 'home-repair-service',
    category: 'copier',
    assignable: true,
  },
  {
    route: 'RentalMonthlyBill',
    title: 'Rental Monthly Bill',
    icon: 'event-note',
    category: 'copier',
    assignable: true,
  },
  {
    route: 'ExecutiveManagement',
    title: 'Executive Management',
    icon: 'supervisor-account',
    category: 'admin',
    assignable: false,
  },
];

export const SCREEN_CATEGORY_DEFS = {
  cash: { label: 'Cash', icon: 'paid' },
  bank: { label: 'Bank', icon: 'account-balance' },
  jobWork: { label: 'Job Work', icon: 'work' },
  copier: { label: 'Copier Transactions', icon: 'print' },
  refurbished: { label: 'Refurbished', icon: 'recycling' },
  admin: { label: 'Administration', icon: 'supervisor-account' },
};

export const getScreenMeta = (routeName) =>
  SCREEN_REGISTRY.find((screen) => screen.route === routeName);

export const ASSIGNABLE_SCREEN_ROUTES = SCREEN_REGISTRY.filter(
  (screen) => screen.assignable
).map((screen) => screen.route);

export const SUPERVISOR_SCREEN_ROUTES = SCREEN_REGISTRY.map(
  (screen) => screen.route
);


