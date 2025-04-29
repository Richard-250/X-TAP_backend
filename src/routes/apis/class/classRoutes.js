import express from 'express';
import * as classController from '../../../controllers/class.controller.js'
import { authorizedRoles, isVerified, authenticated } from '../../../middleware/auth/auth.js';

const router = express.Router();

router.get('/get-all-classes',  authenticated, isVerified, authorizedRoles('manager', 'accountant'), classController.getAllClassesWithStats);
router.get('/single-class/:id',  authenticated, isVerified, authorizedRoles('manager', 'accountant'), classController.getSingleClassWithStats);

export default router