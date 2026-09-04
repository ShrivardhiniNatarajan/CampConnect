const express = require('express');

const {
  createCompany,
  getCompany
} = require('../controllers/companyController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  authorizeRoles('csr_admin'),
  createCompany
);

router.get(
  '/:id',
  authenticateToken,
  getCompany
);

module.exports = router;