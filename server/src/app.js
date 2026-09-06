const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const companyRoutes = require('./routes/companyRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const notificationAcceptanceRoutes = require('./routes/notificationAcceptanceRoutes');
const campRoutes = require('./routes/campRoutes');
const fundingRoutes = require('./routes/fundingRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CampConnect API is running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications', notificationAcceptanceRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/funding', fundingRoutes);
app.use('/api', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  let msg = typeof err.message === "string" ? err.message : (err.message?.message || "An internal server error occurred"); if (msg.toLowerCase().includes("api_key") || msg.toLowerCase().includes("cloudinary")) { msg = "Failed to upload proof photo. Please check Cloudinary configuration."; } res.status(500).json({ success: false, message: msg });
});
module.exports = app;
