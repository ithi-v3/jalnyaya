// JalNyaya - Authentication & RBAC Middleware
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * Authenticates incoming request using JWT Bearer token
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please log in.'
      });
    }

    const secret = process.env.JWT_SECRET || 'jalnyaya_super_secure_jwt_secret_token_key_2026';
    const decoded = jwt.verify(token, secret);

    // Retrieve user and their role from database
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      include: {
        role: true,
        street: {
          select: { street_id: true, street_name: true, area_name: true, panchayat_name: true }
        }
      }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User session is invalid or account is deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session token has expired. Please log in again.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token authentication failed.' });
  }
}

/**
 * Role-Based Access Control (RBAC) authorization middleware
 * @param  {...string} allowedRoles - 'ADMIN', 'OPERATOR', 'RESIDENT'
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Access denied: role not identified.' });
    }

    const userRole = req.user.role.role_name;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User with role '${userRole}' is not authorized to access this resource. Allowed: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};
