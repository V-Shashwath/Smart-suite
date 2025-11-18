# Smart Suite Backend API

Backend API for Employee Sales Invoice application with Microsoft SQL Server integration.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Microsoft SQL Server
- npm or yarn

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start

# Or start with nodemon for development
npm run dev
```

## 📦 Database Connection

### Connection Details
- **Server:** `103.98.12.218\sqlexpress,59320`
- **Username:** `Ikonuser`
- **Password:** `userikon`
- **Database:** `SmartSuite` (update in `src/config/database.js`)

### Configuration
Edit `src/config/database.js` to update database connection settings.

```javascript
const config = {
  server: '103.98.12.218\\sqlexpress',
  port: 59320,
  user: 'Ikonuser',
  password: 'userikon',
  database: 'SmartSuite', // Your database name
  // ... other options
};
```

## 📚 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/barcode/:barcode` - Get product by barcode
- `GET /api/products/category/:category` - Get products by category

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/customers/search?query=xxx` - Search customers
- `POST /api/customers` - Create new customer

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create new invoice

### Adjustments
- `GET /api/adjustments` - Get all adjustment accounts

### Transactions
- `GET /api/transactions/dropdown-options` - Get all dropdown options
- `GET /api/transactions/generate-voucher?series=RS24` - Generate voucher number

## 🗄️ Database Schema

See `database-schema.sql` for complete database structure.

### Required Tables:
- `Products` - Product information
- `Customers` - Customer information
- `Invoices` - Invoice headers
- `InvoiceItems` - Invoice line items
- `InvoiceAdjustments` - Invoice adjustments
- `Branches` - Branch information
- `Locations` - Location information
- `Users` - User/Employee information
- `MachineTypes` - Machine type options
- `AdjustmentAccounts` - Adjustment account types

## 🔧 Configuration

### Port Configuration
Default port is `3000`. Change in `src/server.js` or set `PORT` environment variable.

### CORS Configuration
Update CORS settings in `src/server.js` if needed:

```javascript
app.use(cors({
  origin: ['http://localhost:19000', 'http://YOUR_IP:19000']
}));
```

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:3000
```

### Get All Products
```bash
curl http://localhost:3000/api/products
```

### Get Product by Barcode
```bash
curl http://localhost:3000/api/products/barcode/12345
```

### Create Invoice
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d @invoice-data.json
```

## 📱 Connect React Native App

Update the API URL in your React Native app:

```javascript
// In ServiceApp/src/config/api.js (create this file)
const API_URL = 'http://YOUR_COMPUTER_IP:3000/api';

export default API_URL;
```

Replace `YOUR_COMPUTER_IP` with your computer's local IP address (e.g., `192.168.1.100`).

## 🐛 Troubleshooting

### Database Connection Issues
1. Verify SQL Server is running
2. Check firewall settings (port 59320 should be open)
3. Verify SQL Server authentication mode (mixed mode required)
4. Test connection using SQL Server Management Studio first

### Cannot Connect from React Native App
1. Ensure your phone and computer are on the same network
2. Use your computer's IP address, not `localhost`
3. Check firewall allows incoming connections on port 3000
4. Try: `http://192.168.x.x:3000/api` (replace with your IP)

### Port Already in Use
```bash
# Change port in server.js or:
PORT=3001 npm start
```

## 📝 Development

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # Database configuration
│   ├── controllers/
│   │   ├── productsController.js
│   │   ├── customersController.js
│   │   ├── invoicesController.js
│   │   ├── adjustmentsController.js
│   │   └── transactionsController.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── customers.js
│   │   ├── invoices.js
│   │   ├── adjustments.js
│   │   └── transactions.js
│   └── server.js            # Main server file
├── package.json
└── README.md
```

### Adding New Endpoints
1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Register route in `src/server.js`

## 🔒 Security Notes

**⚠️ IMPORTANT:**
- Database credentials are currently hardcoded for development
- In production, use environment variables (.env file)
- Enable SSL/TLS for database connection
- Implement authentication/authorization
- Use HTTPS in production

## 📄 License

Proprietary - Founditup Team

## 🆘 Support

For issues or questions, contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** November 18, 2025

