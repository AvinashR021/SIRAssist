const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const documentRoutes = require('./routes/documentRoutes');
const requestRoutes = require('./routes/requestRoutes');
const assistanceRoutes = require('./routes/assistanceRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
