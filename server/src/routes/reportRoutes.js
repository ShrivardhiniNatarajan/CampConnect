const express = require('express');

const {
  submitReport,
  getPendingReports,
  verifyReport
} = require('../controllers/reportController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/reports/:id/verify',
  authenticateToken,
  authorizeRoles('coordinator'),
  verifyReport
);

router.get(
  '/reports/pending',
  authenticateToken,
  authorizeRoles('coordinator'),
  getPendingReports
);

module.exports = router;