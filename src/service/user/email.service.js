import nodemailer from 'nodemailer';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  from: process.env.EMAIL_FROM || 'NFC Masters <support@nfcmasters.com>'
};

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass
  }
});

const emailStyles = `
  /* Base styles for better email client compatibility */
  body, html {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.5;
    color: #333333;
  }
  
  /* Main container */
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  }
  
  /* Header styling */
  .email-header {
    background: linear-gradient(135deg, #4285f4, #34a853);
    padding: 30px 20px;
    text-align: center;
  }
  
  .logo {
    max-width: 180px;
    margin-bottom: 15px;
  }
  
  .header-title {
    color: white;
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    padding: 0;
  }
  
  /* Content area */
  .email-content {
    padding: 30px 40px;
    background-color: #ffffff;
  }
  
  .greeting {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 15px;
    color: #4285f4;
  }
  
  .message {
    font-size: 16px;
    margin-bottom: 20px;
    color: #555555;
  }
  
  /* Button styling */
  .button-container {
    text-align: center;
    margin: 30px 0;
  }
  
  .button {
    display: inline-block;
    background-color: #4285f4;
    color: white !important;
    font-weight: 600;
    text-decoration: none;
    padding: 12px 30px;
    border-radius: 4px;
    font-size: 16px;
    transition: background-color 0.2s;
  }
  
  .button:hover {
    background-color: #3367d6;
    text-decoration: none;
  }
  
  /* Password display */
  .password-container {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 4px;
    border-left: 4px solid #4285f4;
    margin: 20px 0;
  }
  
  .password {
    font-family: 'Courier New', monospace;
    font-size: 18px;
    font-weight: bold;
    color: #3367d6;
    letter-spacing: 1px;
  }
  
  /* Footer styling */
  .email-footer {
    background-color: #f8f9fa;
    padding: 20px;
    text-align: center;
    font-size: 14px;
    color: #757575;
    border-top: 1px solid #eeeeee;
  }
  
  .social-links {
    margin: 15px 0;
  }
  
  .social-icon {
    display: inline-block;
    margin: 0 10px;
    width: 30px;
    height: 30px;
  }
  
  .company-info {
    margin-top: 15px;
    font-size: 12px;
  }
  
  /* Responsive adjustments */
  @media screen and (max-width: 480px) {
    .email-content {
      padding: 20px;
    }
    
    .button {
      width: 100%;
      padding: 12px 10px;
    }
  }
`;

const generateVerificationEmailTemplate = (user, verificationUrl, companyLogo = null) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Verification</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          ${companyLogo ? `<img src="${companyLogo}" alt="NFC Masters Logo" class="logo">` : ''}
          <h1 class="header-title">Welcome to NFC Masters</h1>
        </div>
        
        <div class="email-content">
          <p class="greeting">Hello ${user.firstName} ${user.lastName},</p>
          
          <p class="message">An administrator has created an account for you as a manager on our platform.</p>
          
          <p class="message">To complete your registration and set up your password, please verify your account by clicking the button below:</p>
          
          <div class="button-container">
            <a href="${verificationUrl}" class="button">Verify My Account</a>
          </div>
          
          <p class="message"><strong>Please note:</strong> This verification link will expire in 24 hours for security reasons.</p>
          
          <p class="message">If you did not request this account or believe this email was sent to you by mistake, please disregard it. No action is needed on your part.</p>
          
          <p class="message">If you have any questions or need assistance, please contact our support team.</p>
          
          <p class="message">We're excited to have you on board!</p>
          
          <p class="message">
            Best regards,<br>
            The NFC Masters Team
          </p>
        </div>
        
        <div class="email-footer">
          <div class="social-links">
            <a href="https://facebook.com/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" class="social-icon"></a>
            <a href="https://twitter.com/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" class="social-icon"></a>
            <a href="https://linkedin.com/company/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" class="social-icon"></a>
          </div>
          
          <p>© ${new Date().getFullYear()} NFC Masters. All rights reserved.</p>
          
          <div class="company-info">
            <p>123 Technology Plaza, Suite 500, San Francisco, CA 94107</p>
            <p>If you have questions, please contact <a href="mailto:support@nfcmasters.com">support@nfcmasters.com</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePasswordEmailTemplate = (user, passwordToken, loginUrl, companyLogo = null) => {
  // Generate a one-time password link using the token
  const baseUrl = process.env.BASE_URL;
  const passwordViewUrl = `${baseUrl}/api/auth/view-password/${passwordToken}`;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Account Password</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          ${companyLogo ? `<img src="${companyLogo}" alt="NFC Masters Logo" class="logo">` : ''}
          <h1 class="header-title">Account Activation Successful</h1>
        </div>
        
        <div class="email-content">
          <p class="greeting">Hello ${user.firstName} ${user.lastName},</p>
          
          <p class="message">Your account has been successfully verified and activated. You can now log in to the NFC Masters platform.</p>
          
          <p class="message">Click the button below to view your temporary password. <strong>Note: This password can only be viewed once for security reasons.</strong></p>
          
          <div class="button-container">
            <a href="${passwordViewUrl}" class="button">View Temporary Password</a>
          </div>
          
          <p class="message"><strong>Important:</strong> For security reasons, please change your password immediately after your first login.</p>
          
          <div class="button-container">
            <a href="${loginUrl}" class="button">Log In Now</a>
          </div>
          
          <p class="message">If you experience any issues logging in or have questions about your account, please contact our support team.</p>
          
          <p class="message">
            Best regards,<br>
            The NFC Masters Team
          </p>
        </div>
        
        <div class="email-footer">
          <div class="social-links">
            <a href="https://facebook.com/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" class="social-icon"></a>
            <a href="https://twitter.com/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" class="social-icon"></a>
            <a href="https://linkedin.com/company/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" class="social-icon"></a>
          </div>
          
          <p>© ${new Date().getFullYear()} NFC Masters. All rights reserved.</p>
          
          <div class="company-info">
            <p>123 Technology Plaza, Suite 500, San Francisco, CA 94107</p>
            <p>If you have questions, please contact <a href="mailto:support@nfcmasters.com">support@nfcmasters.com</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendPasswordEmail = async (user, password) => {
  const baseUrl = process.env.BASE_URL;
  const loginUrl = `${baseUrl}/api/auth/login`;
  const companyLogo = process.env.COMPANY_LOGO_URL || null;
  
  // JWT secret - store this securely in environment variables
  const JWT_SECRET = process.env.JWT_PASSWORD_SECRET;
  
  // Create token payload
  const payload = {
    userId: user.id,
    password: password,
    // Add viewed flag
    viewed: false,
    // Set expiration time (e.g., 24 hours)
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };
  
  // Generate JWT token
  const passwordToken = jwt.sign(payload, JWT_SECRET);
  
  const mailOptions = {
    from: emailConfig.from,
    to: user.email,
    subject: 'Your NFC Masters Account is Ready',
    html: generatePasswordEmailTemplate(user, passwordToken, loginUrl, companyLogo)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password email:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (user, token) => {
    const baseUrl = process.env.BASE_URL;
    const verificationUrl = `${baseUrl}/api/auth/verify/${token}`;
    const companyLogo = process.env.COMPANY_LOGO_URL || null;
    
    const mailOptions = {
      from: emailConfig.from,
      to: user.email,
      subject: 'Verify Your NFC Masters Account',
      html: generateVerificationEmailTemplate(user, verificationUrl, companyLogo)
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Verification email sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };  

export const sendPasswordResetEmail = async (user, token) => {
  const baseUrl = process.env.BASE_URL;
  const resetUrl = `${baseUrl}/api/auth/reset-password/${token}/${encodeURIComponent(user.email)}`;
  const companyLogo = process.env.COMPANY_LOGO_URL || null;
  
  const mailOptions = {
    from: emailConfig.from,
    to: user.email,
    subject: 'Reset Your NFC Masters Password',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          ${emailStyles}
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${companyLogo ? `<img src="${companyLogo}" alt="NFC Masters Logo" class="logo">` : ''}
            <h1 class="header-title">Password Reset Request</h1>
          </div>
          
          <div class="email-content">
            <p class="greeting">Hello ${user.firstName} ${user.lastName},</p>
            
            <p class="message">We received a request to reset your password for your NFC Masters account.</p>
            
            <p class="message">To set a new password, please click the button below:</p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <p class="message"><strong>Please note:</strong> This password reset link will expire in 1o minutes for security reasons.</p>
            
            <p class="message">If you did not request a password reset, please ignore this email or contact our support team if you have concerns about your account security.</p>
            
            <p class="message">
              Best regards,<br>
              The NFC Masters Team
            </p>
          </div>
          
          <div class="email-footer">
            <div class="social-links">
              <a href="https://facebook.com/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" class="social-icon"></a>
              <a href="https://twitter.com/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" class="social-icon"></a>
              <a href="https://linkedin.com/company/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" class="social-icon"></a>
            </div>
            
            <p>© ${new Date().getFullYear()} NFC Masters. All rights reserved.</p>
            
            <div class="company-info">
              <p>123 Technology Plaza, Suite 500, San Francisco, CA 94107</p>
              <p>If you have questions, please contact <a href="mailto:support@nfcmasters.com">support@nfcmasters.com</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (user) => {
  const baseUrl = process.env.BASE_URL;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const companyLogo = process.env.COMPANY_LOGO_URL || null;
  
  const mailOptions = {
    from: emailConfig.from,
    to: user.email,
    subject: 'Welcome to NFC Masters!',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NFC Masters</title>
        <style>
          ${emailStyles}
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            ${companyLogo ? `<img src="${companyLogo}" alt="NFC Masters Logo" class="logo">` : ''}
            <h1 class="header-title">Welcome to NFC Masters!</h1>
          </div>
          
          <div class="email-content">
            <p class="greeting">Hello ${user.firstName} ${user.lastName},</p>
            
            <p class="message">Thank you for completing your account setup! We're thrilled to have you as part of the NFC Masters community.</p>
            
            <p class="message">Your account has been fully activated, and you now have access to all the features of our platform.</p>
            
            <div class="button-container">
              <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            </div>
            
            <p class="message">Here are some helpful resources to get you started:</p>
            
            <ul style="color: #555555; margin-bottom: 25px;">
              <li><a href="${baseUrl}/help/getting-started" style="color: #4285f4;">Getting Started Guide</a></li>
              <li><a href="${baseUrl}/help/faq" style="color: #4285f4;">Frequently Asked Questions</a></li>
              <li><a href="${baseUrl}/help/support" style="color: #4285f4;">Contact Support</a></li>
            </ul>
            
            <p class="message">If you have any questions or need assistance, our support team is always here to help.</p>
            
            <p class="message">
              Best regards,<br>
              The NFC Masters Team
            </p>
          </div>
          
          <div class="email-footer">
            <div class="social-links">
              <a href="https://facebook.com/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" class="social-icon"></a>
              <a href="https://twitter.com/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" class="social-icon"></a>
              <a href="https://linkedin.com/company/nfcmasters" target="_blank"><img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" class="social-icon"></a>
            </div>
            
            <p>© ${new Date().getFullYear()} NFC Masters. All rights reserved.</p>
            
            <div class="company-info">
              <p>123 Technology Plaza, Suite 500, San Francisco, CA 94107</p>
              <p>If you have questions, please contact <a href="mailto:support@nfcmasters.com">support@nfcmasters.com</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};