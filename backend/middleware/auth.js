const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// Compare password
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  authenticate(req, res, (err) => {
    if (err) return next(err);
    
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    next();
  });
};

// Passenger authentication middleware
const authenticatePassenger = (req, res, next) => {
  authenticate(req, res, (err) => {
    if (err) return next(err);
    
    if (req.user.userType !== 'passenger') {
      return res.status(403).json({
        success: false,
        error: 'Passenger access required'
      });
    }
    
    next();
  });
};

// Optional authentication (allows both authenticated and unauthenticated requests)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without user info
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticate,
  authenticateAdmin,
  authenticatePassenger,
  optionalAuth
};
