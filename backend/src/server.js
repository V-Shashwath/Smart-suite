require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { testConnection } = require('./config/database');

// Import routes
const customersRoutes = require('./routes/customers');
const invoicesRoutes = require('./routes/invoices');
const executivesRoutes = require('./routes/executives');
const productsRoutes = require('./routes/products');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for mobile app
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Health check endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Backend API is running' });
});

// API Routes
app.use('/api/customers', customersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/executives', executivesRoutes);
app.use('/api/products', productsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
      error: undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection (non-blocking)
    testConnection().catch(() => {
      console.warn('⚠️  Database connection test failed - will retry on first API call');
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend Server running on port ${PORT}`);
      console.log(`🌐 Local API: http://localhost:${PORT}/api`);
      console.log(`🌐 Public API: http://223.186.254.245:${PORT}/api`);
      console.log(`📱 Accessible from internet on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const { closePool } = require('./config/database');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  const { closePool } = require('./config/database');
  await closePool();
  process.exit(0);
});

startServer();

module.exports = app;

