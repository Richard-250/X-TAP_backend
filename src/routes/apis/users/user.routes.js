import express from 'express';
import * as userController from '../../../controllers/user.controller.js';
import { authorizedRoles, isAdmin, isVerified, authenticated } from '../../../middleware/auth/auth.js';
import validateUserUpdate from '../../../validations/userUpdate.validation.js';
import { profilePhotoController } from '../../../controllers/user.controller.js';
import validateRoleUpdate from '../../../validations/roleUpdate.validation.js';
import validateUserId from '../../../validations/userId.validation.js';
import validateProfilePhoto from '../../../validations/profilePhoto.validate.js';
import { validateCreateManager } from '../../../validations/createManager.validation.js';
import { validateCreateUser } from '../../../validations/createUser.validation.js';
import  imageUploader  from '../../../service/user/upload.service.js';

const router = express.Router();


router.post('/create/manager', validateCreateManager, authenticated,isAdmin, userController.createManager);
router.post('/create/user', validateCreateUser, authenticated,authorizedRoles('admin', 'manager'), userController.createUser);


router.get('/', authenticated, isVerified, isAdmin, authorizedRoles('admin'), userController.getAllUsers);

router.get('/manager', authenticated, isVerified, authorizedRoles('manager'), userController.getUserByManager);
router.get('/me', authenticated, isVerified, userController.getMyProfile);
router.patch('/profile/update', validateUserUpdate, authenticated,userController.updateMyProfile);
router.patch('/update/role', validateRoleUpdate, authenticated, authorizedRoles('manager', 'admin'), userController.updateUserRole);
router.post('/disable-user', validateUserId, authenticated, authorizedRoles('manager', 'admin'), userController.disableUserAccount);

router.post('/profile-photo',authenticated, profilePhotoController.uploadProfilePhoto);
router.delete('/profile-photo', authenticated, profilePhotoController.deleteProfilePhoto);
  

export default router