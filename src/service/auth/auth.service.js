import { generateToken, generateNfcToken } from "../../utils/password.js";
import { findUserByEmail, validateUserPassword, generatePasswordResetToken } from "../user/user.service.js";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../user/email.service.js";
import jwt from 'jsonwebtoken'
import db from '../../database/models/index.js'
const { User } = db

export const authenticateUser = async (email, password) => {
  // Check if user exists
  const user = await findUserByEmail(email);
  if (!user) {
    return { success: false, code: 404, message: 'User not found' };
  }
  
  // Check if user is verified
  if (!user.isVerified) {
    return { 
      success: false, 
      code: 403, 
      message: 'Account not verified. Please check your email for verification link.' 
    };
  }
  
  // Verify password
  const isPasswordValid = await validateUserPassword(password, user.password);
  if (!isPasswordValid) {
    return { success: false, code: 401, message: 'Invalid password' };
  }

  if (user.isFirstLogin === true) {
    // Fire-and-forget the email (won't delay login)
   await sendWelcomeEmail(user).catch(emailError => {
      if (process.env.NODE_ENV === 'testing') console.error(emailError);
    });
    
    // Always update the flag regardless of email success
    await user.update({ isFirstLogin: false }); 
  }
  
  // Generate JWT token
  const token = generateToken(user);
  
  return {
    success: true,
    code: 200,
    message: 'Login successful',
    token,
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
};

export const generateNfcLoginToken = async (email, password) => {
  try {
    // Validate credentials
    // const authResult = await authenticateUser(email, password);
    // if (!authResult.success) return authResult;

    
    // Find user (make sure to include raw: true if needed)
    const user = await findUserByEmail(email);
    if (!user) {
      return { 
        success: false, 
        code: 404, 
        message: 'User not found' 
      };
    }

    const isPasswordValid = await validateUserPassword(password, user.password);
    if (!isPasswordValid) {
      return { success: false, code: 401, message: 'Invalid password' };
    }
    
  
    const nfcToken = generateNfcToken(email, password, '30d');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Method 1: Using save() (often more reliable for first-time saves)
    user.nfcLoginToken = nfcToken;
    user.nfcLoginTokenExpires = expiresAt;
    await user.save();

    return {
      success: true,
      code: 200,
      message: 'NFC token generated and stored successfully',
      nfcToken,
      expiresAt,
      title: user.title,
      profilePhoto: user.profilePhoto
    };

  } catch (error) {
    console.error('Error in generateNfcLoginToken:', error);
    return { 
      success: false, 
      code: 500, 
      message: 'Failed to store NFC token',
      error: error.message 
    };
  }
};

export const authenticateWithNfcToken = async (nfcToken) => {
  if (!nfcToken || typeof nfcToken !== 'string') {
    return { 
      success: false, 
      code: 400, 
      message: 'Invalid NFC token format',
      data: null
    };
  }

  try {
    // Decode token to get email
    const decoded = jwt.decode(nfcToken);
    const userEmail = decoded?.email;
    
    if (!userEmail) {
      return { 
        success: false, 
        code: 401, 
        message: 'Invalid NFC token payload - missing email',
        data: null
      };
    }

    // Find user by email
    const user = await User.findOne({ where: { email: userEmail } });
    
    if (!user) {
      return { 
        success: false, 
        code: 404, 
        message: 'User not found',
        data: null
      };
    }

    // Verify token matches and is not expired
    if (user.nfcLoginToken !== nfcToken) {
      return { 
        success: false, 
        code: 401, 
        message: 'NFC token mismatch',
        data: null
      };
    }

    if (new Date() > new Date(user.nfcLoginTokenExpires)) {
      await user.update({ 
        nfcLoginToken: null,
        nfcLoginTokenExpires: null 
      });
      return { 
        success: false, 
        code: 401, 
        message: 'NFC token expired',
        data: null
      };
    }

    // Cryptographic verification
    jwt.verify(nfcToken, process.env.JWT_SECRET);

    // Generate session token
    const sessionToken = generateToken(user);
    await user.update({ lastLogin: new Date() });

    return {
      success: true,
      code: 200,
      message: 'NFC login successful',
      data: {
        token: sessionToken,
        expiresAt: user.nfcLoginTokenExpires,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          title: user.title,
          profilePhoto: user.profilePhoto
        }
      }
    };
    
  } catch (error) {
    console.error('NFC login error:', error);

    // Clear invalid token if possible
    if (error instanceof jwt.JsonWebTokenError) {
      try {
        const decoded = jwt.decode(nfcToken);
        if (decoded?.email) {
          await User.update(
            { nfcLoginToken: null, nfcLoginTokenExpires: null },
            { where: { email: decoded.email } }
          );
        }
      } catch (cleanupError) {
        console.error('Token cleanup failed:', cleanupError);
      }
    }

    return { 
      success: false, 
      code: 401, 
      message: 'Authentication failed',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

export const processForgotPassword = async (email) => {
  // Find user by email
  const user = await findUserByEmail(email);
  
  // If no user found or user not verified, return generic success message for security
  if (!user) {
    return {
      success: true,
      code: 200,
      message: 'If this email exists and is verified, a password reset link has been sent'
    };
  }
  
  // Check if user is verified
  if (!user.isVerified) {
    return {
      success: false,
      code: 403,
      message: 'Account not verified. Please verify your account first.'
    };
  }
  
  try {
    // Generate reset token
    const { resetToken } = await generatePasswordResetToken(user);
    
    // Send password reset email
    await sendPasswordResetEmail(user, resetToken);
    
    return {
      success: true,
      code: 200,
      message: 'Password reset link sent to your email'
    };
  } catch (error) {
    // Clear token if email fails
    await user.update({
      passwordResetToken: null,
      passwordResetExpires: null
    });
    
    return {
      success: false,
      code: 500,
      message: 'Error sending email. Please try again.',
      error: error.message
    };
  }
};

