import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


const createErrorResponse = (status, message, errorCode) => ({
  status,
  body: {
    success: false,
    message,
    error: errorCode
  }
});


const ERRORS = {
  NO_TOKEN: createErrorResponse(401, 'Access denied. Authentication required.', 'no_token'),
  INVALID_TOKEN: createErrorResponse(401, 'Invalid authentication token. Please log in again.', 'invalid_token'),
  EXPIRED_TOKEN: createErrorResponse(401, 'Your session has expired. Please log in again.', 'expired_token'),
  TOKEN_ERROR: createErrorResponse(401, 'Authentication failed. Token error.', 'token_error'),
  USER_NOT_FOUND: createErrorResponse(404, 'User associated with this token no longer exists.', 'user_not_found'),
  ACCOUNT_DISABLED: createErrorResponse(403, 'Your account has been disabled. Please contact support.', 'account_disabled'),
  CREDENTIALS_CHANGED: createErrorResponse(401, 'Your credentials have changed. Please log in again.', 'credentials_changed'),
  SERVER_ERROR: createErrorResponse(500, 'Authentication failed due to a server error.', 'server_error'),
  UNAUTHENTICATED: createErrorResponse(401, 'Authentication required.', 'unauthenticated'),
  INSUFFICIENT_PRIVILEGES: createErrorResponse(403, 'Access denied: Admin privileges required.', 'insufficient_privileges'),
  ACCOUNT_NOT_VERIFIED: createErrorResponse(403, 'Your account is not verified. Please check your email for verification instructions.', 'account_not_verified'),
  INSUFFICIENT_ROLE: createErrorResponse(403, 'Access denied: Your role does not have permission to perform this action', 'insufficient_role'),
  MISSING_RESOURCE_ID: createErrorResponse(400, 'Resource ID not provided in request parameters', 'missing_resource_id'),
  OWNERSHIP_REQUIRED: createErrorResponse(403, 'Access denied: You do not have permission to access this resource', 'ownership_required'),
  OWNERSHIP_VERIFICATION_FAILED: createErrorResponse(500, 'Failed to verify resource ownership', 'ownership_verification_failed')
};


const sendErrorResponse = (res, error) => {
  return res.status(error.status).json(error.body);
};


const tokenService = {
  extract: (req) => {
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
  },
  
  verify: async (token) => {
    try {
      return await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw ERRORS.INVALID_TOKEN;
      }
      if (error.name === 'TokenExpiredError') {
        throw ERRORS.EXPIRED_TOKEN;
      }
      throw ERRORS.TOKEN_ERROR;
    }
  }
};


const userService = {
  findByToken: async (decoded) => {
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
  },
  
  hasPasswordChanged: (user, tokenTimestamp) => {
    if (user?.passwordChangedAt) {
      const changedTimestamp = Number.parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      return tokenTimestamp < changedTimestamp;
    }
    return false;
  },
  
  updateLastLogin: async (req, user) => {
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
  }
};


export const authenticated = async (req, res, next) => {
  try {
    const token = tokenService.extract(req);
    if (!token) {
      return sendErrorResponse(res, ERRORS.NO_TOKEN);
    }

    const decoded = await tokenService.verify(token);
    const user = await userService.findByToken(decoded);

    if (!user) {
      return sendErrorResponse(res, ERRORS.USER_NOT_FOUND);
    }

    if (!user.isEnabled) {
      return sendErrorResponse(res, ERRORS.ACCOUNT_DISABLED);
    }

    if (userService.hasPasswordChanged(user, decoded.iat)) {
      return sendErrorResponse(res, ERRORS.CREDENTIALS_CHANGED);
    }

    await userService.updateLastLogin(req, user);
    
    req.user = user;
    res.locals.user = user;
    
    next();
  } catch (error) {
    if (error.status && error.body) {
      return sendErrorResponse(res, error);
    }
    
    console.error('Authentication error:', error);
    return sendErrorResponse(res, ERRORS.SERVER_ERROR);
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return sendErrorResponse(res, ERRORS.UNAUTHENTICATED);
  }

  if (req.user.role !== 'admin') {
    return sendErrorResponse(res, ERRORS.INSUFFICIENT_PRIVILEGES);
  }

  if (!req.user.isVerified) {
    return sendErrorResponse(res, ERRORS.ACCOUNT_NOT_VERIFIED);
  }

  next();
};

export const isVerified = (req, res, next) => {
  if (!req.user?.isVerified) {
    return sendErrorResponse(res, ERRORS.ACCOUNT_NOT_VERIFIED);
  }
  next();
};

export const authorizedRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendErrorResponse(res, ERRORS.UNAUTHENTICATED);
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return sendErrorResponse(res, ERRORS.INSUFFICIENT_ROLE);
    }
    
    next();
  };
};

export const isResourceOwner = (paramName, checkOwnership) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params?.[paramName];
      
      if (!resourceId) {
        return sendErrorResponse(res, ERRORS.MISSING_RESOURCE_ID);
      }
      
      if (req.user?.role === 'admin') {
        return next();
      }
      
      const isOwner = await checkOwnership(req.user?.id, resourceId);
      
      if (!isOwner) {
        return sendErrorResponse(res, ERRORS.OWNERSHIP_REQUIRED);
      }
      
      next();
    } catch (error) {
      console.error('Ownership verification error:', error);
      return sendErrorResponse(res, ERRORS.OWNERSHIP_VERIFICATION_FAILED);
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