const express = require('express');
const {
  evaluateDraftTicket,
  getUserTrustProfile
} = require('../controllers/trustController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Real-time evaluation of draft ticket
router.post('/evaluate-ticket', evaluateDraftTicket);

// Fetch user profile trust evaluation
router.get('/user/:id', authenticateToken, getUserTrustProfile);

module.exports = router;
