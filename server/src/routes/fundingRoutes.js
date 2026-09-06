const express = require('express');

const {
  commitFunding,
  getMyFunding
} = require('../controllers/fundingController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  authorizeRoles('csr_admin'),
  commitFunding
);

router.get(
  '/mine',
  authenticateToken,
  authorizeRoles('csr_admin'),
  getMyFunding
);

module.exports = router;