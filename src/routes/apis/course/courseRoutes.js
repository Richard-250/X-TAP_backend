import express from 'express';
import * as courseController from '../../../controllers/course.controller.js'
import { authorizedRoles, isVerified, authenticated } from '../../../middleware/auth/auth.js';

const router = express.Router();

router.get('/get-all-course',  authenticated, isVerified, authorizedRoles('manager', 'accountant'), courseController.getAllCourses);
router.get('/single-course/:id',  authenticated, isVerified, authorizedRoles('manager', 'accountant'), courseController.getSingleCourse);


export default router