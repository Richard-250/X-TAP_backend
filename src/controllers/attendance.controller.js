import {
  markAttendance as markAttendanceService,
  getAttendanceByDate as getAttendanceByDateService,
  getStudentAttendance as getStudentAttendanceService,
  updateAttendanceStatus as updateAttendanceStatusService,
  generateDailyReport as generateDailyReportService,
  getAttendanceConfig as getAttendanceConfigService,
  updateAttendanceConfig as updateAttendanceConfigService,
  getSchoolCalendarEvents as getSchoolCalendarEventsService,
  addSchoolCalendarEvent as addSchoolCalendarEventService
} from '../service/attendance/attendance.service.js';

export async function markAttendance(req, res) {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    const result = await markAttendanceService(studentId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to mark attendance'
    });
  }
}

export async function getAttendanceByDate(req, res) {
  try {
    const { date, classId } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }
    const attendance = await getAttendanceByDateService(date, classId);
    return res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get attendance'
    });
  }
}

export async function getStudentAttendance(req, res) {
  try {
    const { studentId, startDate, endDate } = req.query;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    const attendance = await getStudentAttendanceService(studentId, startDate, endDate);
    return res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get student attendance'
    });
  }
}

export async function updateAttendanceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, message: 'Attendance ID and status are required' });
    }
    const updatedAttendance = await updateAttendanceStatusService(id, status, reason, req.user?.id);
    return res.status(200).json({ success: true, data: updatedAttendance });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update attendance status'
    });
  }
}

export async function generateDailyReport(req, res) {
  try {
    const { date, classId } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }
    const report = await generateDailyReportService(date, classId, req.user?.id);
    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to generate report'
    });
  }
}

export async function getAttendanceConfig(req, res) {
  try {
    const config = await getAttendanceConfigService();
    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get attendance configuration'
    });
  }
}

export async function updateAttendanceConfig(req, res) {
  try {
    const { openTime, lateThreshold, closeTime, weekendDays, graceMinutes } = req.body;
    const updatedConfig = await updateAttendanceConfigService({
      openTime,
      lateThreshold,
      closeTime,
      weekendDays,
      graceMinutes
    });
    return res.status(200).json({ success: true, data: updatedConfig });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update attendance configuration'
    });
  }
}

export async function getSchoolCalendarEvents(req, res) {
  try {
    const { startDate, endDate, type } = req.query;
    const events = await getSchoolCalendarEventsService(startDate, endDate, type);
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get calendar events'
    });
  }
}

export async function addSchoolCalendarEvent(req, res) {
  try {
    const { date, name, description, type } = req.body;
    if (!date || !name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Date, name, and type are required'
      });
    }
    const event = await addSchoolCalendarEventService({
      date,
      name,
      description,
      type
    });
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to add calendar event'
    });
  }
}

