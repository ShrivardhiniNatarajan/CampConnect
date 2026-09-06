const express = require('express');

const {
  acceptNotification,
  rejectNotification
} = require('../controllers/ticketAcceptanceController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/:id/accept',
  authenticateToken,
  authorizeRoles('org_admin'),
  acceptNotification
);

router.post(
  '/:id/reject',
  authenticateToken,
  authorizeRoles('org_admin'),
  rejectNotification
);

module.exports = router;