const express = require('express');

const {
  submitReport,
  getPendingReports,
  getVerifiedReports,
  verifyReport
} = require('../controllers/reportController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post(
  '/reports',
  authenticateToken,
  authorizeRoles('org_admin'),
  upload.single('proof_photo'),
  submitReport
);

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

router.get(
  '/reports/verified',
  authenticateToken,
  authorizeRoles('coordinator'),
  getVerifiedReports
);

module.exports = router;
