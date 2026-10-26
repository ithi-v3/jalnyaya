// JalNyaya - Authentication Controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * Handles user login and generates JWT
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Lookup user in single Users table
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true,
        street: {
          select: { street_id: true, street_name: true, area_name: true, panchayat_name: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact Panchayat Administration.'
      });
    }

    // Compare bcrypt password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const secret = process.env.JWT_SECRET || 'jalnyaya_super_secure_jwt_secret_token_key_2026';
    const payload = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role.role_name,
      role_id: user.role_id,
      street_id: user.street_id
    };

    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    // Safe user object excluding password_hash
    const safeUser = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.role_name,
      role_description: user.role.description,
      street: user.street,
      created_at: user.created_at
    };

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns currently authenticated user information
 */
async function getCurrentUser(req, res, next) {
  try {
    const user = req.user;
    return res.json({
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.role_name,
        role_description: user.role.description,
        street: user.street,
        is_active: user.is_active,
        created_at: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Handles logout
 */
async function logout(req, res) {
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}

/**
 * Returns available system roles
 */
async function getRoles(req, res, next) {
  try {
    const roles = await prisma.role.findMany();
    return res.json({ success: true, roles });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  getCurrentUser,
  logout,
  getRoles
};
