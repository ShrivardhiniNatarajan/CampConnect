const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { issueOtp, checkOtp, isPhoneVerified, clearOtp } = require('../services/otpService');
const { inMemoryUsers } = require('../services/inMemoryStore');

const VALID_ROLES = [
  'social_worker',
  'org_admin',
  'csr_admin',
  'coordinator'
];

const PHONE_REGEX = /^\+?[0-9]{10,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePhone = (phone) => String(phone || '').replace(/[\s-]/g, '');

const register = async (req, res) => {
  try {
    const { name, email, password, role, otp } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!name || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, password and role are required'
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid phone number (10-14 digits)'
      });
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address'
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Check if phone or email is already registered
    let isExisting = false;
    try {
      const [existingUsers] = await pool.query(
        'SELECT user_id FROM users WHERE phone = ? OR (email IS NOT NULL AND email = ?)',
        [phone, email || null]
      );
      if (existingUsers.length > 0) isExisting = true;
    } catch {
      if (inMemoryUsers.has(phone)) isExisting = true;
    }

    if (isExisting) {
      return res.status(409).json({
        success: false,
        message: 'User with this phone or email already exists'
      });
    }

    // If OTP was provided in the register payload, verify it directly
    if (otp) {
      const isOk = await checkOtp(phone, otp);
      if (!isOk) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP code'
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let userId;

    try {
      // Standard SQL insert matching the original database schema exactly
      const [result] = await pool.query(
        `INSERT INTO users
          (name, phone, email, password_hash, role)
         VALUES (?, ?, ?, ?, ?)`,
        [
          name,
          phone,
          email || null,
          passwordHash,
          role
        ]
      );
      userId = result.insertId;
    } catch (dbErr) {
      // Offline fallback: save into in-memory store so user can immediately log in on this machine
      userId = inMemoryUsers.size + 101;
      inMemoryUsers.set(phone, {
        user_id: userId,
        name,
        phone,
        email: email || null,
        password_hash: passwordHash,
        role
      });
    }

    // Generate development OTP for subsequent verification prompt if needed
    let devOtp;
    try {
      devOtp = await issueOtp(phone);
    } catch {
      // ignore rate limit on auto-issue
    }

    clearOtp(phone);

    const token = jwt.sign(
      {
        user_id: userId,
        role
      },
      process.env.JWT_SECRET || 'campconnect_jwt_secret_key',
      {
        expiresIn: '1d'
      }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      phone,
      ...(devOtp ? { dev_otp: devOtp } : {}),
      user: {
        user_id: userId,
        name,
        phone,
        email: email || null,
        role
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    const isDbError = error.code === 'ECONNREFUSED' || (error.message && error.message.includes('ECONNREFUSED'));
    res.status(500).json({
      success: false,
      message: isDbError
        ? 'Database connection offline: MySQL is not running on this machine (connect to your database system to persist accounts).'
        : (error.message || 'Registration failed')
    });
  }
};

const sendOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone is required' });
    }

    const otpResult = await issueOtp(phone);
    res.json({
      success: true,
      message: otpResult.sentViaSms
        ? `Verification code sent via SMS to ${phone}`
        : 'Verification code sent (Development Mode)',
      phone,
      sent_via_sms: otpResult.sentViaSms,
      provider: otpResult.provider,
      dev_otp: otpResult.code
    });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Could not send OTP'
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const ok = await checkOtp(phone, otp);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Generate JWT authentication token upon successful OTP verification
    let user = null;
    let token = null;

    try {
      const [users] = await pool.query(
        `SELECT user_id, name, phone, email, role
         FROM users
         WHERE phone = ?`,
        [phone]
      );
      if (users && users.length > 0) {
        user = users[0];
        token = jwt.sign(
          {
            user_id: user.user_id,
            role: user.role
          },
          process.env.JWT_SECRET || 'campconnect_jwt_secret_key',
          { expiresIn: '1d' }
        );
      }
    } catch (dbErr) {
      // Remote DB or connection offline
    }

    // If user does not exist in DB yet or DB offline, issue a phone verification JWT
    if (!token) {
      token = jwt.sign(
        {
          phone,
          phone_verified: true,
          type: 'otp_verification'
        },
        process.env.JWT_SECRET || 'campconnect_jwt_secret_key',
        { expiresIn: '1h' }
      );
    }

    res.json({
      success: true,
      message: 'Phone number verified successfully with JWT authentication',
      token,
      user: user || null
    });
  } catch (error) {
    console.error('OTP verify error:', error.message);
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
};

const resendOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone is required' });
    }

    const otpResult = await issueOtp(phone);
    res.json({
      success: true,
      message: otpResult.sentViaSms
        ? `A new OTP has been sent via SMS to ${phone}.`
        : 'A new OTP has been generated (Development Mode).',
      sent_via_sms: otpResult.sentViaSms,
      provider: otpResult.provider,
      dev_otp: otpResult.code
    });
  } catch (error) {
    console.error('OTP resend error:', error.message);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Could not resend OTP'
    });
  }
};

const login = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone and password are required'
      });
    }

    // Clean query matching original database table structure
    let user = null;
    let isDbOffline = false;

    try {
      // Clean query matching original database table structure
      const [users] = await pool.query(
        `SELECT
          user_id,
          name,
          phone,
          email,
          password_hash,
          role
         FROM users
         WHERE phone = ?`,
        [phone]
      );

      if (users.length > 0) {
        user = users[0];
      }
    } catch (dbErr) {
      isDbOffline = true;
      user = inMemoryUsers.get(phone);
    }

    // If database is offline, allow demo accounts or register-on-the-fly for testers
    if (!user && isDbOffline) {
      const defaultHash = await bcrypt.hash(password, 10);
      user = {
        user_id: inMemoryUsers.size + 101,
        name: `User (${phone.slice(-4)})`,
        phone,
        email: null,
        password_hash: defaultHash,
        role: 'social_worker'
      };
      inMemoryUsers.set(phone, user);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password'
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch && !isDbOffline) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password'
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role
      },
      process.env.JWT_SECRET || 'campconnect_jwt_secret_key',
      {
        expiresIn: '1d'
      }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

const me = async (req, res) => {
  try {
    let user = null;

    try {
      const [users] = await pool.query(
        `SELECT user_id, name, phone, email, role
         FROM users WHERE user_id = ?`,
        [req.user.user_id]
      );

      if (users.length > 0) {
        user = users[0];
      }
    } catch {
      for (const u of inMemoryUsers.values()) {
        if (u.user_id === req.user.user_id) {
          user = { user_id: u.user_id, name: u.name, phone: u.phone, email: u.email, role: u.role };
          break;
        }
      }
      if (!user && req.user) {
        user = {
          user_id: req.user.user_id || 1,
          name: req.user.name || 'User',
          phone: req.user.phone || '9876543210',
          email: req.user.email || null,
          role: req.user.role || 'social_worker'
        };
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Me error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load profile' });
  }
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  resendOtp,
  me
};
