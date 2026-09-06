const express = require('express');

const {
  createTicket,
  getTicketById,
  getMyTickets
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

router.get(
  '/mine',
  authenticateToken,
  authorizeRoles('social_worker'),
  getMyTickets
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('social_worker'),
  getTicketById
);

module.exports = router;