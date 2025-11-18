# Backend Setup Guide

Complete guide to set up the Smart Suite Backend API with SQL Server.

## 📋 Prerequisites

1. **Node.js** (v14 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **Microsoft SQL Server** (already running at `103.98.12.218\sqlexpress,59320`)
   - Username: `Ikonuser`
   - Password: `userikon`

3. **Database** named `SmartSuite` (or update in config)

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd "C:\Users\user\Desktop\founditup\smart suite\backend"
npm install
```

✅ This installs:
- `express` - Web framework
- `mssql` - SQL Server client
- `cors` - Cross-origin resource sharing
- `body-parser` - Request body parsing
- `dotenv` - Environment variables
- `nodemon` - Auto-restart during development

### Step 2: Create Database and Tables

1. Open **SQL Server Management Studio (SSMS)**
2. Connect to: `103.98.12.218\sqlexpress,59320`
3. Login with: `Ikonuser` / `userikon`
4. Create database:
   ```sql
   CREATE DATABASE SmartSuite;
   GO
   ```
5. Execute the schema file:
   - Open: `backend/database-schema.sql`
   - Execute all queries (this will create all tables and sample data)

### Step 3: Verify Database Configuration

Open `backend/src/config/database.js` and verify:

```javascript
const config = {
  server: '103.98.12.218\\sqlexpress',
  port: 59320,
  user: 'Ikonuser',
  password: 'userikon',
  database: 'SmartSuite', // ← Your database name
  // ...
};
```

### Step 4: Start the Backend Server

```bash
cd "C:\Users\user\Desktop\founditup\smart suite\backend"
npm start
```

You should see:

```
=============================================================
🚀 Smart Suite Backend Server Started
=============================================================
📡 Server running on: http://localhost:3000
🌐 Network access: http://YOUR_IP:3000
💾 Database: SQL Server connected
📝 Environment: development
=============================================================
```

### Step 5: Test the API

Open browser or use `curl`:

#### Health Check:
```
http://localhost:3000
```

#### Get All Products:
```
http://localhost:3000/api/products
```

#### Get Product by Barcode:
```
http://localhost:3000/api/products/barcode/1
```

#### Get All Customers:
```
http://localhost:3000/api/customers
```

## 📱 Connect React Native App

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

### Step 2: Update React Native App

Create `ServiceApp/src/config/api.js`:

```javascript
// Replace with your computer's IP address
const API_BASE_URL = 'http://192.168.1.100:3000/api';

export default API_BASE_URL;
```

### Step 3: Test Connection

In your React Native app:

```javascript
import API_BASE_URL from './config/api';

// Fetch products
fetch(`${API_BASE_URL}/products`)
  .then(response => response.json())
  .then(data => console.log('Products:', data))
  .catch(error => console.error('Error:', error));
```

## 🔧 Troubleshooting

### Problem 1: Database Connection Failed

**Error:** `❌ Database connection failed: Login failed for user`

**Solution:**
1. Verify SQL Server is running
2. Check username/password in `src/config/database.js`
3. Ensure SQL Server uses **Mixed Mode** authentication:
   - SSMS → Right-click server → Properties → Security
   - Select "SQL Server and Windows Authentication mode"
   - Restart SQL Server service

### Problem 2: Connection Timeout

**Error:** `Connection timeout`

**Solution:**
1. Check firewall allows port `59320`
2. Verify SQL Server TCP/IP is enabled:
   - SQL Server Configuration Manager
   - SQL Server Network Configuration
   - Protocols for SQLEXPRESS
   - Enable TCP/IP
   - Restart SQL Server

### Problem 3: React Native Can't Connect

**Error:** `Network request failed`

**Solutions:**
1. ✅ Use your computer's IP address (not `localhost`)
2. ✅ Ensure phone and computer on same Wi-Fi network
3. ✅ Check Windows Firewall allows port `3000`:
   ```powershell
   # Run as Administrator
   netsh advfirewall firewall add rule name="Node API" dir=in action=allow protocol=TCP localport=3000
   ```
4. ✅ Test from phone's browser: `http://192.168.x.x:3000`

### Problem 4: Port 3000 Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Option 1: Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Option 2: Use different port
PORT=3001 npm start
```

### Problem 5: CORS Error

**Error:** `Access to fetch blocked by CORS policy`

**Solution:**
Update `src/server.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:19000', 'http://YOUR_IP:19000'],
  credentials: true
}));
```

## 🗄️ Database Tables

The schema creates these tables:

1. **Products** - Product catalog
2. **Customers** - Customer information
3. **Invoices** - Invoice headers
4. **InvoiceItems** - Invoice line items
5. **InvoiceAdjustments** - Adjustments (discounts, fees)
6. **Branches** - Branch locations
7. **Locations** - Storage locations
8. **Users** - Employee/user accounts
9. **MachineTypes** - Machine type options
10. **AdjustmentAccounts** - Adjustment account types

## 📊 Sample Data Included

The schema includes sample data:
- ✅ 12 Products (Xerox, Printing, Lamination, etc.)
- ✅ 11 Branches
- ✅ 3 Locations
- ✅ 4 Users
- ✅ 5 Machine Types
- ✅ 14 Adjustment Accounts
- ✅ 3 Customers

## 🔒 Security Checklist (Before Production)

- [ ] Move credentials to `.env` file
- [ ] Hash user passwords
- [ ] Enable database encryption
- [ ] Implement JWT authentication
- [ ] Add request rate limiting
- [ ] Use HTTPS in production
- [ ] Sanitize all user inputs
- [ ] Add SQL injection protection
- [ ] Set up backup strategy
- [ ] Configure proper CORS origins

## 📝 Development Workflow

### Run in Development Mode (auto-restart)
```bash
npm run dev
```

### Run in Production Mode
```bash
npm start
```

### Test Database Connection
```bash
node
> const { testConnection } = require('./src/config/database');
> testConnection();
```

## 🎯 Next Steps

1. ✅ Backend is running
2. ✅ Database is connected
3. ✅ Sample data is loaded
4. 🔄 Update React Native app to use API
5. 🔄 Replace mockData with API calls
6. 🔄 Test barcode scanning with real data
7. 🔄 Test invoice creation
8. 🔄 Deploy to production

## 📞 Support

**Database Issues:** Contact your DBA or check SQL Server logs

**Backend Issues:** Check `backend/README.md` or server logs

**React Native Issues:** Check `ServiceApp/README.md`

---

**Version:** 1.0.0  
**Last Updated:** November 18, 2025  
**Status:** ✅ Ready for Integration

