// Vercel Serverless Function Entry Point
// This file exports the Express app for Vercel's serverless environment

const app = require('../src/server');

// Export the app directly - Vercel will handle it
module.exports = app;

