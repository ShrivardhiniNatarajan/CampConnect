const express = require('express');

const {
  createTicket
} = require('../controllers/ticketController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  authorizeRoles('social_worker'),
  createTicket
);

module.exports = router;