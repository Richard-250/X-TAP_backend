import express from 'express';
import { isVerified, authenticated } from '../../../middleware/auth/auth.js';
import * as authController from '../../../controllers/auth.controller.js';
import validateLogin from '../../../validations/login.validation.js';
import validateChangePassword from '../../../validations/changePasswword.validation.js';
import validateEmail from '../../../validations/email.validation.js';

const router = express.Router();


router.post('/login', validateLogin, authController.login);
router.get('/verify/:token', authController.verifyAccount);
router.post('/change-password', validateChangePassword, authenticated, isVerified, authController.changePassword);
router.post('/resend-verification', validateEmail, authController.resendVerificationEmail);
router.post('/forgot-password', validateEmail, authController.forgotPassword);
router.patch('/reset-password/:token/:email', authController.resetPassword);
router.get('/view-password/:token', authController.passwordViewHandler);

export default router