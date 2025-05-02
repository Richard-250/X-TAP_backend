import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createError } from '../../utils/error.js';
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendWelcomeEmail,
  sendPasswordResetConfirmationEmail 
} from "../user/email.service.js";

const prisma = new PrismaClient();

// JWT token generation
export const generateToken = (user, expiresIn = '1d') => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const generateNfcToken = (email, password, expiresIn = '30d') => {
  const payload = {
    email,
    password: `${password.substring(0, 1)}***`
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// User lookup functions
export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email }
  });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id }
  });
};

export const findUserByVerificationToken = async (token) => {
  return prisma.user.findFirst({
    where: { 
      verificationToken: token,
      verificationExpires: {
        gt: new Date()
      }
    }
  });
};

export const findUserByResetToken = async (token, email) => {
  return prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      email,
      passwordResetExpires: {
        gt: new Date()
      }
    }
  });
};

// Password handling
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const validateUserPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export const generatePasswordResetToken = async (user) => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: expiresAt
    }
  });
  
  return { resetToken, expiresAt };
};



export const regenerateVerificationToken = async (user) => {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); 
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationExpires
    }
  });
  
  await sendVerificationEmail(user, verificationToken);
  return { verificationToken, verificationExpires };
};


export const updateUserPassword = async (user, newPassword) => {
  const hashedPassword = await hashPassword(newPassword);
  
  return prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    }
  });
};

export const resetUserPassword = async (user) => {
  
  const newPassword = `${Math.floor(1000 + Math.random() * 9000)}!`;
  const hashedPassword = await hashPassword(newPassword);
  
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      isFirstLogin: true
    }
  });
  
  await sendPasswordResetConfirmationEmail(user, newPassword);
  
  return { 
    user: updatedUser,
    newPassword
  };
};







export const authenticateUser = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error('Account not verified. Please check your email for verification link.');
    error.status = 403;
    throw error;
  }

  const isPasswordValid = await validateUserPassword(password, user.password);

  if (!isPasswordValid) {
    const error = new Error('Invalid password');
    error.status = 401;
    throw error;
  }

  if (user.isFirstLogin) {
    try {
      await sendWelcomeEmail(user);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isFirstLogin: false,
        lastLogin: new Date(),
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      title: user.title,
      profilePhoto: user.profilePhoto,
    },
  };
};





// NFC token-related functions
export const generateNfcLoginToken = async (email, password) => {
  const user = await findUserByEmail(email);
  
  if (!user) {
    throw createError(404, 'User not found');
  }
  
  const isPasswordValid = await validateUserPassword(password, user.password);
  
  if (!isPasswordValid) {
    throw createError(401, 'Invalid password');
  }
  
  const nfcToken = generateNfcToken(email, password, '30d');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      nfcLoginToken: nfcToken,
      nfcLoginTokenExpires: expiresAt
    }
  });
  
  return {
    nfcToken,
    expiresAt,
    user: {
      title: user.title,
      profilePhoto: user.profilePhoto
    }
  };
};

export const authenticateWithNfcToken = async (nfcToken) => {
  if (!nfcToken || typeof nfcToken !== 'string') {
    throw createError(400, 'Invalid NFC token format');
  }
  
  try {
    const decoded = jwt.decode(nfcToken);
    const userEmail = decoded?.email;
    
    if (!userEmail) {
      throw createError(401, 'Invalid NFC token payload - missing email');
    }
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      throw createError(404, 'User not found');
    }
    
    if (user.nfcLoginToken !== nfcToken) {
      throw createError(401, 'NFC token mismatch');
    }
    
    if (new Date() > new Date(user.nfcLoginTokenExpires)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          nfcLoginToken: null,
          nfcLoginTokenExpires: null 
        }
      });
      throw createError(401, 'NFC token expired');
    }
    
    // Verify token signature
    jwt.verify(nfcToken, process.env.JWT_SECRET);
    
    const sessionToken = generateToken(user);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    return {
      token: sessionToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        title: user.title,
        profilePhoto: user.profilePhoto
      }
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      try {
        const decoded = jwt.decode(nfcToken);
        if (decoded?.email) {
          await prisma.user.update({
            where: { email: decoded.email },
            data: {
              nfcLoginToken: null,
              nfcLoginTokenExpires: null
            }
          });
        }
      } catch (cleanupError) {
        console.error('Token cleanup failed:', cleanupError);
      }
    }
    throw error;
  }
};

// Password reset flow
export const processForgotPassword = async (email) => {
  const user = await findUserByEmail(email);
  
  if (!user) {
    // Don't reveal if email exists or not
    return;
  }
  
  if (!user.isVerified) {
    throw createError(403, 'Account not verified. Please verify your account first.');
  }
  
  // Generate token
  const { resetToken } = await generatePasswordResetToken(user);
  
  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch (error) {
    // Clear the token if email sending fails
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });
    throw createError(500, 'Error sending email. Please try again.');
  }
};