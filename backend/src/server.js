const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { testConnection, closePool } = require('./config/database');

// Import routes
const productsRoutes = require('./routes/products');
const customersRoutes = require('./routes/customers');
const invoicesRoutes = require('./routes/invoices');
const adjustmentsRoutes = require('./routes/adjustments');
const transactionsRoutes = require('./routes/transactions');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Suite Backend API is running!',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      customers: '/api/customers',
      invoices: '/api/invoices',
      adjustments: '/api/adjustments',
      transactions: '/api/transactions'
    }
  });
});

// API Routes
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/adjustments', adjustmentsRoutes);
app.use('/api/transactions', transactionsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('⚠️  Warning: Database connection failed. Server will start but API calls may fail.');
    }
    
    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(60));
      console.log('🚀 Smart Suite Backend Server Started');
      console.log('='.repeat(60));
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🌐 Network access: http://YOUR_IP:${PORT}`);
      console.log(`💾 Database: SQL Server connected`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(60));
      console.log('\n📚 Available Endpoints:');
      console.log(`  GET  /api/products - Get all products`);
      console.log(`  GET  /api/products/:id - Get product by ID`);
      console.log(`  GET  /api/products/barcode/:barcode - Get product by barcode`);
      console.log(`  GET  /api/customers - Get all customers`);
      console.log(`  GET  /api/customers/:id - Get customer by ID`);
      console.log(`  POST /api/invoices - Create new invoice`);
      console.log(`  GET  /api/invoices/:id - Get invoice by ID`);
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, closing server gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, closing server gracefully...');
  await closePool();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

