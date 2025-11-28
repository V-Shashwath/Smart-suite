export const SCREEN_REGISTRY = [
  {
    route: 'EmployeeSaleInvoice',
    title: 'Employee Sale Invoice',
    icon: '📄',
    category: 'jobWork',
    assignable: true,
  },
  {
    route: 'CashReceipts',
    title: 'Cash Receipts',
    icon: '💰',
    category: 'cash',
    assignable: true,
  },
  {
    route: 'BankReceipts',
    title: 'Bank Receipts',
    icon: '🏦',
    category: 'bank',
    assignable: true,
  },
  {
    route: 'EmployeeReturn',
    title: 'Employee Return',
    icon: '↩️',
    category: 'jobWork',
    assignable: true,
  },
  {
    route: 'SalesReturns',
    title: 'Sales Returns',
    icon: '🔄',
    category: 'refurbished',
    assignable: true,
  },
  {
    route: 'RentalService',
    title: 'Rental Service',
    icon: '🔧',
    category: 'copier',
    assignable: true,
  },
  {
    route: 'RentalMonthlyBill',
    title: 'Rental Monthly Bill',
    icon: '📅',
    category: 'copier',
    assignable: true,
  },
  {
    route: 'ExecutiveManagement',
    title: 'Executive Management',
    icon: '🧑‍💼',
    category: 'admin',
    assignable: false,
  },
];

export const SCREEN_CATEGORY_DEFS = {
  cash: { label: 'Cash', icon: '💰' },
  bank: { label: 'Bank', icon: '🏦' },
  jobWork: { label: 'Job Work', icon: '💼' },
  copier: { label: 'Copier Transactions', icon: '🖨️' },
  refurbished: { label: 'Refurbished', icon: '♻️' },
  admin: { label: 'Administration', icon: '🛠️' },
};

export const getScreenMeta = (routeName) =>
  SCREEN_REGISTRY.find((screen) => screen.route === routeName);

export const ASSIGNABLE_SCREEN_ROUTES = SCREEN_REGISTRY.filter(
  (screen) => screen.assignable
).map((screen) => screen.route);

export const SUPERVISOR_SCREEN_ROUTES = SCREEN_REGISTRY.map(
  (screen) => screen.route
);


