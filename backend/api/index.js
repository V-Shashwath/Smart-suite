// Vercel Serverless Function Entry Point
// This file exports the Express app for Vercel's serverless environment

const app = require('../src/server');

// Export the app for Vercel
module.exports = app;

