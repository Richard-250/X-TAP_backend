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
      error: process.env.NODE_ENV === 'testing' ? error.message : 'Internal server error'
    });
  }
};

export const generateNfcToken = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required',
        data: null
      });
    }
    
    const nfcResult = await authService.generateNfcLoginToken(email, password);
    
    if (!nfcResult.success) {
      return res.status(nfcResult.code).json({ 
        success: false,
        message: nfcResult.message,
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'NFC login token generated successfully',
      data: {
        nfcToken: nfcResult.nfcToken,
        expiresAt: nfcResult.expiresAt,
        user: {
          title: nfcResult.title,
          profilePhoto: nfcResult.profilePhoto
          // Add other user fields if available from the service
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'NFC token generation failed',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const loginWithNfcToken = async (req, res) => {
  try {
    const { nfcToken } = req.body;
    
    if (!nfcToken) {
      return res.status(400).json({ 
        success: false,
        message: 'NFC token is required' 
      });
    }
    
    const authResult = await authService.authenticateWithNfcToken(nfcToken);
    
    if (!authResult.success) {
      return res.status(authResult.code).json({ 
        success: false,
        message: authResult.message 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'NFC login successful',
      token: authResult.token,
      data: authResult.data
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'NFC login failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const verifyAccount = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Start token lookup
    const userPromise = userService.findUserByVerificationToken(token);
    
    // Send immediate acknowledgment response
    res.status(202).json({ 
      success: true,
      message: 'Verification request received. Processing...',
    });
    
    // Continue processing in the background
    const user = await userPromise;
    if (!user) {
      // Log error since we already sent a response
      console.error('Invalid or expired verification token');
      return;
    }
    
    // Process verification
    await userService.verifyUserAccount(user);
    
    // No need to send another response - process is complete
  } catch (error) {
    console.error('Verification failed:', error.message);
    // No need to send error response since we already responded
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

