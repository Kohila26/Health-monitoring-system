require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` AI-POWERED HEALTH MONITORING SYSTEM - BACKEND API `);
    console.log(` Server running on: http://localhost:${PORT}`);
    console.log(` Health Check:     http://localhost:${PORT}/api/health`);
    console.log(` Environment:      ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection]: ${err.message}`);
  });
}).catch((err) => {
  console.error('[Startup Error]:', err.message);
});
