import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import db from '../../database/models/index.js'; 
const { User } = db;

export const authenticated = async (req, res, next) => {
    try {
      let token;
 
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.signedCookies && req.signedCookies.jwt) {

        token = req.cookies.jwt;
      }
  
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.',
        });
      }
  
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET );
  
      const user = await User.findByPk(decoded.id);
  
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found.',
        });
      }
  
      // Check if user changed password after the token was issued
      if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'User recently changed password. Please log in again.',
        });
      }
  
      // Update last login time (except for the /me route)
      if (!req.path.includes('/me')) {
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });
      }
  
      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please log in again.',
        });
      }
  
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your token has expired. Please log in again.',
        });
      }
  
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed.',
      });
    }
  };
  
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
  next();
};

export const isVerified = (req, res, next) => {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({ message: 'Account not verified' });
  }
  next();
};

export const authorizedRoles = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient role privileges' });
      }
      next();
    };
  };
  