const express = require('express');

const {
  acceptTicket
} = require('../controllers/ticketAcceptanceController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/:ticketId/accept',
  authenticateToken,
  authorizeRoles('org_admin'),
  acceptTicket
);

module.exports = router;