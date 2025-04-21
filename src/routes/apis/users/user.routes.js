import express from 'express';
import * as userController from '../../../controllers/user.controller.js';
import { authorizedRoles, isAdmin, isVerified, authenticated } from '../../../middleware/auth/auth.js';
import validateUserProfile from '../../../validations/userProfile.validation.js';
import { profilePhotoController } from '../../../controllers/user.controller.js';

const router = express.Router();


router.post('/register-manager', validateUserProfile, authenticated, isVerified, isAdmin, authorizedRoles('admin'), userController.createManager);
router.post('/register-user', validateUserProfile, authenticated, isVerified, authorizedRoles('admin', 'manager'), userController.createUser);
router.get('/get-all-users', authenticated, isVerified, isAdmin, authorizedRoles('admin'), userController.getAllUsers);
router.get('/get-all-users-manager', authenticated, isVerified, authorizedRoles('manager'), userController.getUserByManager);
router.get('/get-my-profile', authenticated, isVerified, userController.getMyProfile);
router.patch('/update-my-profile', validateUserProfile, authenticated, isVerified, userController.updateMyProfile);
router.patch('/update-user-role', authenticated, isVerified, authorizedRoles('manager'), userController.updateUserRole);
router.post('/disable-user', authenticated, isVerified, authorizedRoles('manager', 'admin'), userController.disableUserAccount);

router.post('/profile-photo', authenticated,  profilePhotoController.uploadProfilePhoto);
router.delete('/profile-photo', authenticated, profilePhotoController.deleteProfilePhoto);
  

export default router