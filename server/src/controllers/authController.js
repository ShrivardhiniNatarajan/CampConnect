const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const VALID_ROLES = [
  'social_worker',
  'org_admin',
  'csr_admin',
  'coordinator'
];

const register = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      role
    } = req.body;

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

    const [existingUsers] = await pool.query(
      'SELECT user_id FROM users WHERE phone = ? OR (email IS NOT NULL AND email = ?)',
      [phone, email || null]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this phone or email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

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

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        user_id: result.insertId,
        name,
        phone,
        email: email || null,
        role
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

const login = async (req, res) => {
  try {
    const {
      phone,
      password
    } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone and password are required'
      });
    }

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

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password'
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
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
      process.env.JWT_SECRET,
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
      message: 'Login failed'
    });
  }
};

module.exports = {
  register,
  login
};