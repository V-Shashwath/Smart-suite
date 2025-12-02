# Mobile App Backend API

Backend API for Mobile App - Employee Sale Invoice System

## 📋 Overview

This backend provides REST API endpoints for managing Employee Sale Invoices, Customers, and related data. It uses Node.js/Express with Microsoft SQL Server.

## 🗄️ Database

- **Database Name:** `mobileApp`
- **Server:** `103.98.12.218\SQLEXPRESS,59320`
- **Username:** `Ikonuser`
- **Password:** `userikon`

### Tables Created:
1. **Customers** - Customer data for QR code lookup
2. **EmployeeSaleInvoiceMain** - Transaction, Voucher, Header, Collections
3. **EmployeeSaleInvoiceItems** - Item body details
4. **EmployeeSaleInvoiceAdjustments** - Adjustments details

All tables use `VoucherSeries` and `VoucherNo` as common keys for joining data.

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create Database
1. Open SQL Server Management Studio (SSMS)
2. Connect to: `103.98.12.218\SQLEXPRESS,59320`
3. Login with: `Ikonuser` / `userikon`
4. Run the SQL script: `../database/create_database.sql`

### 3. Start Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server will start on `http://localhost:3000`

## 📡 API Endpoints

### Customers API

#### Get Customer by Mobile Number (for QR Code)
```
GET /api/customers/mobile/:mobileNo
```
**Example:**
```
GET /api/customers/mobile/9876543210
```

**Response:**
```json
{
  "success": true,
  "data": {
    "CustomerID": "CUST-001",
    "CustomerName": "John Doe",
    "MobileNo": "9876543210",
    "WhatsAppNo": "9876543210",
    "CustomerType": "Regular"
  }
}
```

#### Get Customer by ID
```
GET /api/customers/:customerId
```

#### Get All Customers
```
GET /api/customers?page=1&limit=50
```

#### Create/Update Customer
```
POST /api/customers
```
**Body:**
```json
{
  "customerID": "CUST-001",
  "customerName": "John Doe",
  "mobileNo": "9876543210",
  "whatsAppNo": "9876543210",
  "customerType": "Regular"
}
```

### Invoices API

#### Create Invoice
```
POST /api/invoices
```
**Body:**
```json
{
  "voucherSeries": "RS24",
  "voucherNo": "1",
  "voucherDatetime": "2025-11-17 19:29:05",
  "transactionDetails": {
    "transactionId": "TXN-2025-001234",
    "date": "17-11-2025",
    "time": "19:29:05",
    "status": "Pending",
    "branch": "Head Office",
    "location": "Moorthy Location",
    "employeeLocation": "Moorthy Location",
    "username": "Supervisor"
  },
  "header": {
    "date": "15-Nov-2025",
    "billerName": "ABC Enterprises",
    "employeeName": "John Doe",
    "customerId": "CUST-001",
    "customerName": "John Doe",
    "readingA4": "1250",
    "readingA3": "850",
    "machineType": "Xerox Machine Model XYZ",
    "remarks": "Customer requested urgent delivery",
    "gstBill": false
  },
  "collections": {
    "cash": 1000,
    "card": 500,
    "upi": 200,
    "balance": 0
  },
  "items": [
    {
      "sno": 1,
      "productId": 1,
      "productName": "A4 Xerox - Black & White",
      "productSerialNo": "1234567890",
      "quantity": 2,
      "rate": 2.00,
      "gross": 4.00,
      "net": 4.00,
      "comments1": "",
      "salesMan": "",
      "freeQty": 0,
      "comments6": ""
    }
  ],
  "adjustments": [
    {
      "accountId": 1,
      "accountName": "Discount - Percentage",
      "accountType": "less",
      "addAmount": 0,
      "lessAmount": 50,
      "comments": "Early payment discount"
    }
  ],
  "summary": {
    "itemCount": 1,
    "totalQty": 2,
    "totalGross": 4.00,
    "totalDiscount": 0,
    "totalAdd": 0,
    "totalLess": 50,
    "totalBillValue": -46.00,
    "ledgerBalance": 0
  }
}
```

#### Get Invoice by Voucher
```
GET /api/invoices/voucher/:voucherSeries/:voucherNo
```
**Example:**
```
GET /api/invoices/voucher/RS24/1
```

#### Get Invoice by ID
```
GET /api/invoices/:invoiceId
```

#### Get All Invoices
```
GET /api/invoices?page=1&limit=20&branch=Head Office&status=Pending
```

#### Update Invoice
```
PUT /api/invoices/:invoiceId
```

#### Delete Invoice
```
DELETE /api/invoices/:invoiceId
```

## 🔧 Configuration

Database configuration is in `src/config/database.js`. Update if needed:

```javascript
const config = {
  server: '103.98.12.218\\SQLEXPRESS',
  port: 59320,
  database: 'mobileApp',
  user: 'Ikonuser',
  password: 'userikon',
  // ...
};
```

## 📝 Notes

- All endpoints return JSON responses
- Error responses include `success: false` and error message
- Success responses include `success: true` and data
- Customer lookup by mobile number is optimized for QR code scanning
- Invoice creation uses transactions to ensure data consistency

## 🐛 Troubleshooting

### Database Connection Error
- Verify SQL Server is running
- Check credentials in `src/config/database.js`
- Ensure database `mobileApp` exists
- Run `database/create_database.sql` script

### Port Already in Use
- Change PORT in `src/server.js` or use environment variable
- Kill process using port 3000

### CORS Issues
- CORS is configured to allow all origins
- For production, update CORS settings in `src/server.js`

