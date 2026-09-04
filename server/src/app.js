const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');

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
module.exports = app;