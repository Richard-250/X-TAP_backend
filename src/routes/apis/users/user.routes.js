import express from 'express';
import * as userController from '../../../controllers/user.controller.js';
import { authorizedRoles, isAdmin, isVerified, authenticated } from '../../../middleware/auth/auth.js';
import validateUserProfile from '../../../validations/userProfile.validation.js';
import validateUserUpdate from '../../../validations/userUpdate.validation.js';
import { profilePhotoController } from '../../../controllers/user.controller.js';
import validateRoleUpdate from '../../../validations/roleUpdate.validation.js';
import validateUserId from '../../../validations/userId.validation.js';
import validateProfilePhoto from '../../../validations/profilePhoto.validate.js';
import { validateCreateManager } from '../../../validations/createManager.validation.js';
import { validateCreateUser } from '../../../validations/createUser.validation.js';

const router = express.Router();


router.post('/create/manager', validateCreateManager, authenticated,isAdmin, userController.createManager);
router.post('/create/user', validateCreateUser, authenticated,authorizedRoles('admin', 'manager'), userController.createUser);


router.get('/', authenticated, isVerified, isAdmin, authorizedRoles('admin'), userController.getAllUsers);

router.get('/get-all-users-manager', authenticated, isVerified, authorizedRoles('manager'), userController.getUserByManager);
router.get('/get-my-profile', authenticated, isVerified, userController.getMyProfile);
router.patch('/update-my-profile', validateUserUpdate, authenticated, isVerified, userController.updateMyProfile);
router.patch('/update-user-role', validateRoleUpdate, authenticated, isVerified, authorizedRoles('manager'), userController.updateUserRole);
router.post('/disable-user', validateUserId, authenticated, isVerified, authorizedRoles('manager', 'admin'), userController.disableUserAccount);

router.post('/profile-photo', validateProfilePhoto, authenticated,  profilePhotoController.uploadProfilePhoto);
router.delete('/profile-photo', authenticated, profilePhotoController.deleteProfilePhoto);
  

export default router