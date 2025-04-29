import express from 'express';
import * as studentController from '../../../controllers/student.controller.js'
import { authorizedRoles, isVerified, authenticated } from '../../../middleware/auth/auth.js';
import validateStudentRegistration from '../../../validations/studentRegister.validation.js';

const router = express.Router();

router.post('/register-student', validateStudentRegistration, authenticated, isVerified, authorizedRoles('manager', 'accountant'), studentController.registerStudent);
router.get('/get-all-students',  authenticated, isVerified, authorizedRoles('manager', 'accountant'), studentController.getAllStudents);
router.get('/class/single-student/:classId',  authenticated, isVerified, authorizedRoles('manager', 'accountant'), studentController.getStudentsByClass);
router.get('/course/single-student/:courseId',  authenticated, isVerified, authorizedRoles('manager', 'accountant'), studentController.getStudentsByCourse);
router.get('/search-student',  authenticated, isVerified, authorizedRoles('manager', 'accountant'), studentController.searchStudents);

export default router