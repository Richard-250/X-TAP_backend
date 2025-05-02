import express from 'express';
import * as studentController from '../../../controllers/student.controller.js';

const router = express.Router();

/**
 * @route   POST /api/students
 * @desc    Register a new student
 * @access  Private
 */
router.post('/', studentController.registerStudent);

/**
 * @route   GET /api/students
 * @desc    Get all students with pagination
 * @access  Private
 */
router.get('/', studentController.getAllStudents);

/**
 * @route   GET /api/students/search
 * @desc    Search for students
 * @access  Private
 */
router.get('/search', studentController.searchStudents);

/**
 * @route   GET /api/students/class/:classId
 * @desc    Get students by class ID
 * @access  Private
 */
router.get('/class/:classId', studentController.getStudentsByClass);

/**
 * @route   GET /api/students/course/:courseId
 * @desc    Get students by course ID
 * @access  Private
 */
router.get('/course/:courseId', studentController.getStudentsByCourse);

/**
 * @route   GET /api/students/card/:cardId
 * @desc    Get student by card ID
 * @access  Private
 */
router.get('/card/:cardId', studentController.getStudentCard);

/**
 * @route   GET /api/students/:id
 * @desc    Get a single student by ID
 * @access  Private
 */
router.get('/:id', studentController.getSingleStudent);

/**
 * @route   PUT /api/students/:id
 * @desc    Update a student
 * @access  Private
 */
router.put('/:id', studentController.updateStudent);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete a student
 * @access  Private
 */
router.delete('/:id', studentController.deleteStudent);

export default router;