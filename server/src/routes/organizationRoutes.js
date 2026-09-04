const express = require('express');

const {
  createOrganization,
  getOrganization
} = require('../controllers/organizationController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  authorizeRoles('org_admin'),
  createOrganization
);

router.get(
  '/:id',
  authenticateToken,
  getOrganization
);

module.exports = router;