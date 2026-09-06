const express = require('express');

const {
  getFundableCamps,
  getCampById,
  getMyCamps
} = require('../controllers/campController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.get(
  '/fundable',
  authenticateToken,
  authorizeRoles('csr_admin'),
  getFundableCamps
);

router.get(
  '/mine',
  authenticateToken,
  authorizeRoles('org_admin'),
  getMyCamps
);

router.get(
  '/:id',
  authenticateToken,
  getCampById
);

module.exports = router;
