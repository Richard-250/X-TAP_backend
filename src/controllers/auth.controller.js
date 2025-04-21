import * as userService from '../service/index.service.js';
import * as authService from '../service/index.service.js';
import { isValidEmail } from "../utils/validators.js";
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const authResult = await authService.authenticateUser(email, password);
    
    if (!authResult.success) {
      return res.status(authResult.code).json({ 
        success: false,
        message: authResult.message 
      });
    }
    
    res.status(200).json({
      success: true,
      message: authResult.message,
      token: authResult.token,
      data: authResult.user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Login failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const verifyAccount = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await userService.findUserByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification token' 
      });
    }
    
    const { user: verifiedUser } = await userService.verifyUserAccount(user);
    
    return res.status(200).json({ 
      success: true,
      message: 'Account verified successfully. Check your email for your password.',
      role: verifiedUser.role
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: 'Verification failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password and new password are required' 
      });
    }
    
    if (newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be exactly 4 digits' 
      });
    }
    
    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    const isPasswordValid = await userService.validateUserPassword(
      currentPassword, 
      user.password
    );
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }
    
    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be different from current password' 
      });
    }
    
    const newPasswordWithPrefix = 'wm' + newPassword;
    await userService.updateUserPassword(user, newPasswordWithPrefix);
    
    try {
      await userService.sendPasswordEmail(user, newPasswordWithPrefix);
    } catch (emailErr) {
      console.error('Failed to send password email:', emailErr.message);
      // Continue even if email fails since password change was successful
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Password changed successfully' 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: 'Failed to change password', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }
    
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'No account found with this email' 
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'Account is already verified' 
      });
    }
    
    if (user.verificationExpires && user.verificationExpires > new Date()) {
      const timeLeft = Math.round((user.verificationExpires - new Date()) / (1000 * 60));
      return res.status(400).json({ 
        success: false,
        message: `Verification token is still valid. Please check your email or try again in ${timeLeft} minutes.`
      });
    }
    
    const { verificationExpires } = await userService.regenerateVerificationToken(user);
    
    return res.status(200).json({ 
      success: true,
      message: 'New verification email sent successfully',
      expiresAt: verificationExpires
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: 'Failed to resend verification email', 
      error: process.env.NODE_ENV === 'testing' ? error.message : 'Internal server error'
    });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }
    
    const result = await authService.processForgotPassword(email);
    
    return res.status(result.code).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.',
      error: process.env.NODE_ENV === 'testing' ? error.message : 'Internal server error'
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, email: encodedEmail } = req.params;
    
    if (!token || !encodedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Token and email are required'
      });
    }
    
    let email;
    try {
      email = decodeURIComponent(encodedEmail);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email encoding'
      });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const user = await userService.findUserByResetToken(token, email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token, expired token, or email mismatch'
      });
    }
    
    const { user: updatedUser } = await userService.resetUserPassword(user);
    
    return res.status(200).json({
      data: updatedUser,
      success: true,
      message: 'Password reset successful. Check your email for the new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during password reset',
      error: process.env.NODE_ENV === 'testing' ? error.message : 'internal server error'
    });
  }
};

export const passwordViewHandler = (req, res) => {
  const { token } = req.params;
  const JWT_SECRET = process.env.JWT_PASSWORD_SECRET;
  
  if (!JWT_SECRET) {
    return res.status(500).render('password-expired', {
      success: false,
      message: 'Server configuration error.'
    });
  }

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    
    if (decodedToken.viewed) {
      return res.status(403).render('password-expired', {
        message: 'This password link has already been viewed.'
      });
    }
    
    const { password, userId } = decodedToken;
    
    return res.render('view-password', {
      password,
      token,
      userId
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).render('password-expired', {
        success: false,
        message: 'This password link has expired.',
      });
    }
    
    return res.status(403).render('password-expired', {
      success: false,
      message: 'Invalid password link.',
      error: process.env.NODE_ENV === 'testing' ? error.message : 'Internal server error'
    });
  }
};

