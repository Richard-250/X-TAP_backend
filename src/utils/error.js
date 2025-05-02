export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (statusCode, message) => {
  return new AppError(message, statusCode);
};

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'testing') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map(val => val.message)
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token expired'
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found'
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Something went wrong on our end. Please try again later.'
  });
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(createError(400, errorMessage));
    }
    next();
  };
};

export const normalizeError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  if (error.code) {
    switch (error.code) {
      case 'P2002': 
        return createError(409, 'A record with this value already exists');
      case 'P2025':
        return createError(404, 'Record not found');
      case 'P2001':
        return createError(404, 'Record does not exist');
      case 'P2003':
        return createError(400, 'Foreign key constraint failed');
      case 'P2014':
        return createError(400, 'Invalid ID value provided');
    }
  }

  if (error.name === 'PrismaClientInitializationError') {
    return createError(503, 'Database service unavailable');
  }

  if (error.name === 'ValidationError') {
    return createError(400, error.message);
  }

  if (error.name === 'JsonWebTokenError') {
    return createError(401, 'Invalid authentication token');
  }

  if (error.name === 'TokenExpiredError') {
    return createError(401, 'Authentication token expired');
  }

  return createError(500, 'An unexpected error occurred');
};

export const isSafeError = (error) => {
  return error.isOperational === true;
};

export const logError = (error, req = null) => {
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    path: req?.originalUrl || 'No URL available',
    method: req?.method || 'No method available',
    timestamp: new Date().toISOString(),
    statusCode: error.statusCode || 500
  };

  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(errorDetails));
  } else {
    console.error('\n===== ERROR DETAILS =====');
    console.error(`STATUS: ${errorDetails.statusCode}`);
    console.error(`PATH: ${errorDetails.path}`);
    console.error(`METHOD: ${errorDetails.method}`);
    console.error(`MESSAGE: ${errorDetails.message}`);
    console.error(`STACK: ${errorDetails.stack}`);
    console.error('=========================\n');
  }
};