import express from 'express';
const router = express.Router();
import {
    markAttendance,
    getAttendanceByDate,
    getStudentAttendance,
    updateAttendanceStatus,
    generateDailyReport,
    getAttendanceConfig,
    updateAttendanceConfig,
    getSchoolCalendarEvents,
    addSchoolCalendarEvent
} from '../../../controllers/attendance.controller.js';
import { authenticated, authorizedRoles } from '../../../middleware/auth/auth.js';


router.post('/mark', markAttendance);

router.get('/date', authenticated, getAttendanceByDate);

router.get('/student', authenticated, getStudentAttendance);

router.patch('/:id/status', authenticated, updateAttendanceStatus);

router.get('/reports/daily', authenticated, generateDailyReport);

router.get('/config', authenticated, getAttendanceConfig);

router.put('/config',
    authenticated,
    authorizedRoles('admin', 'manager'),
    updateAttendanceConfig
);

router.get('/calendar', authenticated, getSchoolCalendarEvents);

router.post('/calendar',
    authenticated,
    authorizedRoles('admin', 'manager'),
    addSchoolCalendarEvent
);

export default router;