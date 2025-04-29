import express from 'express';
import * as attendanceController from '../../../controllers/attendance.controller.js'


const router = express.Router();

router.post('/tap', attendanceController.recordAttendance);
router.get('/class/:classId', attendanceController.getClassAttendance);
router.get('/student/:studentId', attendanceController.getStudentAttendance);
// router.get('/class/summary/:classId', attendanceController.getClassAttendanceSummary);
router.put('/update/:studentId',attendanceController.updateAttendanceStatus);
// router.get('/search', attendanceController.searchAttendance);

export default router