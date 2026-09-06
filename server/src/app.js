const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const companyRoutes = require('./routes/companyRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

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

module.exports = app;