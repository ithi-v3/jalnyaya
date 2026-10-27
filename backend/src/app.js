// JalNyaya - Express Application Entry Configuration
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

// Fix for MySQL COUNT/SUM returning BigInt that fails JSON.stringify
BigInt.prototype.toJSON = function () {
  const intVal = Number(this);
  return Number.isSafeInteger(intVal) ? intVal : this.toString();
};

const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'JalNyaya Water Tanker Distribution & Equity Tracker',
    timestamp: new Date().toISOString()
  });
});

// Mount Main API Routes (support both /api and root paths)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Catch 404s
app.use(notFoundHandler);

// Centralized Exception & Error Handler
app.use(errorHandler);

module.exports = app;
