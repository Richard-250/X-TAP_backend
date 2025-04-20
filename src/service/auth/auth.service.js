import { generateToken } from "../../utils/password.js";
import { findUserByEmail, validateUserPassword, generatePasswordResetToken } from "../user/user.service.js";
import { sendPasswordResetEmail } from "../user/email.service.js";

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
      role: user.role
    }
  };
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

