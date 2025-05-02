import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticated = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
        error: 'no_token'
      });
    }

    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return handleJwtError(jwtError, res);
    }

    const user = await findUserByToken(decoded);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User associated with this token no longer exists.',
        error: 'user_not_found'
      });
    }

    if (!user.isEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact support.',
        error: 'account_disabled'
      });
    }

    if (hasPasswordChanged(user, decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Your credentials have changed. Please log in again.',
        error: 'credentials_changed'
      });
    }

    await updateLastLogin(req, user);

    req.user = user;
    res.locals.user = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed due to a server error.',
      error: 'server_error'
    });
  }
};

const extractToken = (req) => {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1].trim();
  }
  
  if (req.signedCookies?.jwt) {
    return req.signedCookies.jwt;
  }
  
  if (req.cookies?.jwt) {
    return req.cookies.jwt;
  }
  
  if (req.headers?.['x-access-token']) {
    return req.headers['x-access-token'];
  }
  
  if (req.query?.token) {
    return req.query.token;
  }
  
  return null;
};

const handleJwtError = (error, res) => {
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token. Please log in again.',
      error: 'invalid_token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired. Please log in again.',
      error: 'expired_token'
    });
  }
  
  return res.status(401).json({
    success: false,
    message: 'Authentication failed. Token error.',
    error: 'token_error'
  });
};

const findUserByToken = async (decoded) => {
  const whereClause = {};
  if (decoded?.email) whereClause.email = decoded.email;
  if (decoded?.id) whereClause.id = decoded.id;
  
  return await prisma.user.findFirst({
    where: whereClause,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isVerified: true,
      isEnabled: true,
      passwordChangedAt: true,
      lastLogin: true
    }
  });
};

const hasPasswordChanged = (user, tokenTimestamp) => {
  if (user?.passwordChangedAt) {
    const changedTimestamp = Number.parseInt(user.passwordChangedAt.getTime() / 1000, 10);
    return tokenTimestamp < changedTimestamp;
  }
  return false;
};

const updateLastLogin = async (req, user) => {
  const skipPaths = ['/me', '/profile', '/verify', '/heartbeat', '/status'];
  const shouldUpdate = !skipPaths.some(path => req.path?.includes(path));
  
  if (shouldUpdate) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    } catch (error) {
      console.warn('Failed to update lastLogin time:', error);
    }
  }
};

export const isAdmin = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      error: 'unauthenticated'
    });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required.',
      error: 'insufficient_privileges'
    });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Your account is not verified. Please check your email for verification instructions.',
      error: 'account_not_verified'
    });
  }

  next();
};

export const isVerified = (req, res, next) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({ 
      success: false,
      message: 'Your account is not verified. Please check your email for verification instructions.',
      error: 'account_not_verified'
    });
  }
  next();
};

export const authorizedRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required',
        error: 'not_authenticated'
      });
    }
    
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: Your role does not have permission to perform this action',
        error: 'insufficient_role'
      });
    }
    
    next();
  };
};

export const isResourceOwner = (paramName, checkOwnership) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params?.[paramName];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: "Resource ID not provided in request parameters",
          error: 'missing_resource_id'
        });
      }
      
      if (req.user?.role === 'admin') {
        return next();
      }
      
      const isOwner = await checkOwnership(req.user?.id, resourceId);
      
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to access this resource',
          error: 'ownership_required'
        });
      }
      
      next();
    } catch (error) {
      console.error('Ownership verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify resource ownership',
        error: 'ownership_verification_failed'
      });
    }
  };
};

export const rateLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress;
    const key = `${ip}-${req.path}`;
    const now = Date.now();
    
    if (attempts.has(key)) {
      const userAttempts = attempts.get(key).filter(time => now - time < windowMs);
      attempts.set(key, userAttempts);
      
      if (userAttempts.length >= maxAttempts) {
        return res.status(429).json({
          success: false,
          message: `Too many attempts. Please try again after ${Math.ceil((windowMs - (now - userAttempts[0])) / 60000)} minutes.`,
          error: 'rate_limited'
        });
      }
    }
    
    attempts.set(key, [...(attempts.get(key) || []), now]);
    next();
  };
};