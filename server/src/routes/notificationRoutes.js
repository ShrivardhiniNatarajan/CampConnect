const express = require('express');

const {
  getMyNotifications
} = require('../controllers/notificationController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.get(
  '/mine',
  authenticateToken,
  authorizeRoles('org_admin'),
  getMyNotifications
);

module.exports = router;