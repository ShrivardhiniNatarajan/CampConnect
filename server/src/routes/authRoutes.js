const express = require('express');

const {
  register,
  login,
  sendOtp,
  verifyOtp,
  resendOtp,
  me
} = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/me', authenticateToken, me);

module.exports = router;
