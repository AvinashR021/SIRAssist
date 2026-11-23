const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const errorHandler = require('./middleware/errorHandler');
const securityHeaders = require('./middleware/securityHeaders');

const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const documentRoutes = require('./routes/documentRoutes');
const requestRoutes = require('./routes/requestRoutes');
const assistanceRoutes = require('./routes/assistanceRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const demoRoutes = require('./routes/demoRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const explorerRoutes = require('./routes/explorerRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware
app.use(securityHeaders);

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit body payload to prevent DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health Check & Disclaimer API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'SIRAssist API',
    disclaimer: 'SIRAssist is an academic citizen-assistance project. It is not an official government or Election Commission application.'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/citizens', citizenRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/assistance', assistanceRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/explorer', explorerRoutes);

// Volunteer Document Review Workflow Endpoints (supports both singular and plural)
app.use('/api/volunteer/document-reviews', reviewRoutes);
app.use('/api/volunteers/document-reviews', reviewRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Express Server
app.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(`🚀 SIRAssist Backend API running on http://localhost:${PORT}`);
  console.log(`📘 Academic Citizen Assistance & Verification Management System`);
  console.log(`=============================================================`);
});

module.exports = app;
