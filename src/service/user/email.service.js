import nodemailer from 'nodemailer';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  from: process.env.EMAIL_FROM || 'X-TAP <support@x-tap.com>'
};


const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass
  },
 
  pool: true,
  maxConnections: 5,
  rateDelta: 20000,
  rateLimit: 5
});

/**
 * Send an email using the transporter
 * @param {Object} options - Email options 
 * @returns {Promise} - Email sending result
 */
export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: emailConfig.from,
    to,
    subject,
    html
  };

  try {
    // Using promise to improve performance
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    if (process.env.NODE_ENV === 'testing') {
      throw error;
    }
    console.error('Email sending failed:', error);
    error.statusCode = 500;
    error.message = 'Email delivery failed';
    throw error;
  }
};

/**
 * Verification email template
 * @param {Object} user - User object
 * @param {String} token - Verification token
 * @returns {String} - HTML email template
 */
const createVerificationEmailTemplate = (user, token) => {
  const baseUrl = process.env.BASE_URL;
  const verificationUrl = `${baseUrl}/api/auth/verify/${token}`;
  const currentYear = new Date().getFullYear();
  
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your X-TAP Account</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 font-sans">
    <div class="max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Header -->
      <div class="bg-blue-600 px-6 py-4">
        <h1 class="text-white text-xl font-bold">Welcome to X-TAP</h1>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <p class="text-gray-800 mb-4">Hello ${user?.firstName || ''} ${user?.lastName || ''},</p>
        
        <p class="text-gray-700 mb-4">An administrator has created an account for you as a manager on our platform.</p>
        
        <p class="text-gray-700 mb-4">To complete your registration and set up your password, please verify your account by clicking the button below:</p>
        
        <div class="text-center my-8">
          <a href="${verificationUrl}" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md inline-block">Verify My Account</a>
        </div>
        
        <p class="text-gray-700 mb-4"><strong>Note:</strong> This verification link will expire in 24 hours for security reasons.</p>
        
        <p class="text-gray-700 mb-4">If you did not request this account, please disregard this email.</p>
        
        <p class="text-gray-700 mt-6">Best regards,<br>The X-TAP Team</p>
      </div>
      
      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 text-center border-t border-gray-200">
        <p class="text-gray-600 text-sm">&copy; ${currentYear} X-TAP. All rights reserved.</p>
        <p class="text-gray-500 text-sm mt-2">Questions? Contact <a href="mailto:support@x-tap.com" class="text-blue-600 hover:underline">support@x-tap.com</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Password reset email template
 * @param {Object} user - User object
 * @param {String} token - Password reset token
 * @returns {String} - HTML email template
 */
const createPasswordResetEmailTemplate = (user, token) => {
  const baseUrl = process.env.BASE_URL;
  const resetUrl = `${baseUrl}/api/auth/reset-password/${token}/${encodeURIComponent(user?.email || '')}`;
  const currentYear = new Date().getFullYear();
  
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your X-TAP Password</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 font-sans">
    <div class="max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Header -->
      <div class="bg-blue-600 px-6 py-4">
        <h1 class="text-white text-xl font-bold">Password Reset Request</h1>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <p class="text-gray-800 mb-4">Hello ${user?.firstName || ''} ${user?.lastName || ''},</p>
        
        <p class="text-gray-700 mb-4">We received a request to reset your password for your X-TAP account.</p>
        
        <p class="text-gray-700 mb-4">To set a new password, please click the button below:</p>
        
        <div class="text-center my-8">
          <a href="${resetUrl}" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md inline-block">Reset My Password</a>
        </div>
        
        <p class="text-gray-700 mb-4"><strong>Note:</strong> This password reset link will expire in 10 minutes for security reasons.</p>
        
        <p class="text-gray-700 mb-4">If you did not request a password reset, please ignore this email or contact our support team.</p>
        
        <p class="text-gray-700 mt-6">Best regards,<br>The X-TAP Team</p>
      </div>
      
      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 text-center border-t border-gray-200">
        <p class="text-gray-600 text-sm">&copy; ${currentYear} X-TAP. All rights reserved.</p>
        <p class="text-gray-500 text-sm mt-2">Questions? Contact <a href="mailto:support@x-tap.com" class="text-blue-600 hover:underline">support@x-tap.com</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * New account with password email template
 * @param {Object} user - User object
 * @param {String} password - User password
 * @returns {String} - HTML email template
 */
const createPasswordEmailTemplate = (user, password) => {
  const baseUrl = process.env.BASE_URL;
  const loginUrl = `${baseUrl}/signin`;
  const currentYear = new Date().getFullYear();
  
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your X-TAP Account is Ready</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 font-sans">
    <div class="max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Header -->
      <div class="bg-blue-600 px-6 py-4">
        <h1 class="text-white text-xl font-bold">Welcome to X-TAP</h1>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <p class="text-gray-800 mb-4">Hello ${user?.firstName || ''} ${user?.lastName || ''},</p>
        
        <p class="text-gray-700 mb-4">Your X-TAP account has been created. Below are your login details:</p>
        
        <div class="bg-gray-50 p-4 border-l-4 border-blue-500 rounded-md my-6">
          <p class="font-medium text-gray-700 mb-2">Email: ${user?.email || ''}</p>
          <p class="font-medium text-gray-700 mb-2">Password: ${password || ''}</p>
        
        </div>
        
        <p class="text-gray-700 mb-6">For security reasons, we recommend changing your password after your first login.</p>
        
        <div class="text-center my-8">
          <a href="${loginUrl}" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md inline-block">Login to Your Account</a>
        </div>
        
        <p class="text-gray-700 mt-6">Best regards,<br>The X-TAP Team</p>
      </div>
      
      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 text-center border-t border-gray-200">
        <p class="text-gray-600 text-sm">&copy; ${currentYear} X-TAP. All rights reserved.</p>
        <p class="text-gray-500 text-sm mt-2">Questions? Contact <a href="mailto:support@x-tap.com" class="text-blue-600 hover:underline">support@x-tap.com</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Welcome email template after first login
 * @param {Object} user - User object
 * @returns {String} - HTML email template
 */
const createWelcomeEmailTemplate = (user) => {
  const baseUrl = process.env.BASE_URL;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const currentYear = new Date().getFullYear();
  
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to X-TAP!</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 font-sans">
    <div class="max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Header -->
      <div class="bg-blue-600 px-6 py-4">
        <h1 class="text-white text-xl font-bold">Welcome to X-TAP!</h1>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <p class="text-gray-800 mb-4">Hello ${user?.firstName || ''} ${user?.lastName || ''},</p>
        
        <p class="text-gray-700 mb-4">Thank you for completing your account setup! We're thrilled to have you as part of the X-TAP community.</p>
        
        <p class="text-gray-700 mb-4">Your account has been fully activated, and you now have access to all the features of our platform.</p>
        
        <p class="text-gray-700 mb-4">Here are some helpful resources to get you started:</p>
        
        <ul class="list-disc pl-8 mb-6 text-gray-700">
          <li class="mb-2"><a href="${baseUrl}/help/getting-started" class="text-blue-600 hover:underline">Getting Started Guide</a></li>
          <li class="mb-2"><a href="${baseUrl}/help/faq" class="text-blue-600 hover:underline">Frequently Asked Questions</a></li>
          <li><a href="${baseUrl}/help/support" class="text-blue-600 hover:underline">Contact Support</a></li>
        </ul>
        
        <p class="text-gray-700 mb-6">If you have any questions or need assistance, our support team is always here to help.</p>
        
        <div class="text-center my-8">
          <a href="${dashboardUrl}" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md inline-block">Go to Dashboard</a>
        </div>
        
        <p class="text-gray-700 mt-6">Best regards,<br>The X-TAP Team</p>
      </div>
      
      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 text-center border-t border-gray-200">
        <p class="text-gray-600 text-sm">&copy; ${currentYear} X-TAP. All rights reserved.</p>
        <p class="text-gray-500 text-sm mt-2">Questions? Contact <a href="mailto:support@x-tap.com" class="text-blue-600 hover:underline">support@x-tap.com</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Password reset confirmation email template
 * @param {Object} user - User object
 * @param {String} newPassword - New password
 * @returns {String} - HTML email template
 */
const createPasswordResetConfirmationEmailTemplate = (user, newPassword) => {

  const baseUrl = process.env.BASE_URL;
  const loginUrl = `${baseUrl}/signin`;
  const currentYear = new Date().getFullYear();
  
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your X-TAP Account is Ready</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-100 font-sans">
    <div class="max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Header -->
      <div class="bg-blue-600 px-6 py-4">
        <h1 class="text-white text-xl font-bold">Welcome to X-TAP</h1>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <p class="text-gray-800 mb-4">Hello ${user?.firstName || ''} ${user?.lastName || ''},</p>
        
        <p class="text-gray-700 mb-4">Your X-TAP account has be rested. Below are your login details:</p>
        
      <div class="bg-gray-50 p-4 border-l-4 border-blue-500 rounded-md my-6">
          <p class="font-medium text-gray-700 mb-2">Email: ${user?.email || ''}</p>
          <p class="font-medium text-gray-700 mb-2">Password: ${newPassword || ''}</p>
        
        </div>
        
     
        <div class="text-center my-8">
          <a href="${loginUrl}" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md inline-block">Login to Your Account</a>
        </div>
        
        <p class="text-gray-700 mt-6">Best regards,<br>The X-TAP Team</p>
      </div>
      
      <!-- Footer -->
      <div class="bg-gray-50 px-6 py-4 text-center border-t border-gray-200">
        <p class="text-gray-600 text-sm">&copy; ${currentYear} X-TAP. All rights reserved.</p>
        <p class="text-gray-500 text-sm mt-2">Questions? Contact <a href="mailto:support@x-tap.com" class="text-blue-600 hover:underline">support@x-tap.com</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
};


export const sendVerificationEmail = async (user, token) => {
  const emailHtml = createVerificationEmailTemplate(user, token);
  
  return sendEmail({
    to: user.email,
    subject: 'Verify Your X-TAP Account',
    html: emailHtml
  });
};


export const sendPasswordResetEmail = async (user, token) => {
  const emailHtml = createPasswordResetEmailTemplate(user, token);
  
  return sendEmail({
    to: user.email,
    subject: 'Reset Your X-TAP Password',
    html: emailHtml
  });
};



export const sendPasswordEmail = async (user, password) => {
  const emailHtml = createPasswordEmailTemplate(user, password);

  return sendEmail({
    to: user.email,
    subject: 'Your X-TAP Account is Ready',
    html: emailHtml
  });
};

/**
 * Send welcome email to a user after first login
 * @param {Object} user - User object
 * @returns {Promise} - Email sending result
 */
export const sendWelcomeEmail = async (user) => {
  const emailHtml = createWelcomeEmailTemplate(user);
  
  return sendEmail({
    to: user.email,
    subject: 'Welcome to X-TAP!',
    html: emailHtml
  });
};

/**
 * Send password reset confirmation email to a user
 * @param {Object} user - User object
 * @param {String} newPassword - New password
 * @returns {Promise} - Email sending result
 */
export const sendPasswordResetConfirmationEmail = async (user, newPassword) => {
  const emailHtml = createPasswordResetConfirmationEmailTemplate(user, newPassword);
  
  return sendEmail({
    to: user.email,
    subject: 'Your Password Has Been Changed',
    html: emailHtml
  });
};