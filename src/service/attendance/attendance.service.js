import { PrismaClient } from '@prisma/client';
import { 
  parseTimeString, 
  getTimeOnly, 
  getDayOfWeek 
} from '../../utils/time.utils.js';

const prisma = new PrismaClient();
 
export async function markAttendance(studentId) {
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: { class: true }
  });

  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  if (!student.isActive) {
    const error = new Error('Student is inactive');
    error.statusCode = 400;
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isHoliday = await prisma.schoolCalendar.findFirst({
    where: {
      date: today,
      type: { in: ['holiday', 'teacher_workday'] }
    }
  });

  if (isHoliday) {
    const error = new Error(`No attendance today: ${isHoliday.name}`);
    error.statusCode = 400;
    throw error;
  }

  const config = await prisma.globalAttendanceConfig.findFirst();
  if (!config) {
    const error = new Error('Attendance configuration not found');
    error.statusCode = 500;
    throw error;
  }

  const currentTime = new Date();
  const dayOfWeek = getDayOfWeek(currentTime).toLowerCase();
  
  if (config.weekendDays.includes(dayOfWeek)) {
    const error = new Error('No attendance on weekends');
    error.statusCode = 400;
    throw error;
  }

  const openTime = parseTimeString(config.openTime);
  const closeTime = parseTimeString(config.closeTime);
  const currentTimeOnly = getTimeOnly(currentTime);

//   if (currentTimeOnly < openTime || currentTimeOnly > closeTime) {
//     const error = new Error('Attendance can only be marked during school hours');
//     error.statusCode = 400;
//     throw error;
//   }

  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      studentId: student.studentId,
      date: today
    }
  });

  if (existingAttendance) {
    const error = new Error('Attendance already marked for today');
    error.statusCode = 400;
    throw error;
  }

  const lateThreshold = parseTimeString(config.lateThreshold);
  const lateThresholdWithGrace = lateThreshold + (config.graceMinutes * 60 * 1000);
  
  let status = 'present';
  if (currentTimeOnly > lateThresholdWithGrace) {
    status = 'late';
  }

  const attendance = await prisma.attendance.create({
    data: {
      studentId: student.studentId,
      cardId: student.cardId,
      classId: student.classId,
      status,
      tapTime: currentTime,
      date: today
    }
  });

  return {
    success: true,
    message: `Attendance marked as ${status}`,
    data: attendance
  };
}

export async function getAttendanceByDate(date, classId) {
  const queryDate = new Date(date);
  queryDate.setHours(0, 0, 0, 0);

  const whereClause = {
    date: queryDate
  };

  if (classId) {
    whereClause.classId = classId;
  }

  const attendance = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      student: {
        select: {
          studentId: true,
          firstName: true,
          lastName: true,
          profilePhoto: true,
          class: true
        }
      }
    },
    orderBy: {
      tapTime: 'asc'
    }
  });

  return attendance;
}

export async function getStudentAttendance(studentId, startDate, endDate) {
  const whereClause = {
    studentId
  };

  if (startDate && endDate) {
    whereClause.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else if (startDate) {
    whereClause.date = {
      gte: new Date(startDate)
    };
  } else if (endDate) {
    whereClause.date = {
      lte: new Date(endDate)
    };
  }

  const attendance = await prisma.attendance.findMany({
    where: whereClause,
    orderBy: {
      date: 'desc'
    }
  });

  return attendance;
}

export async function updateAttendanceStatus(id, status, reason, approvedBy) {
  const validStatuses = ['present', 'absent', 'late', 'excused'];
  
  if (!validStatuses.includes(status)) {
    const error = new Error('Invalid attendance status');
    error.statusCode = 400;
    throw error;
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id }
  });

  if (!attendance) {
    const error = new Error('Attendance record not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = {
    status,
    updatedAt: new Date()
  };

  if (reason) {
    updateData.reason = reason;
  }

  if (status === 'excused' && approvedBy) {
    updateData.approvedBy = approvedBy;
  }

  const updatedAttendance = await prisma.attendance.update({
    where: { id },
    data: updateData
  });

  return updatedAttendance;
}

export async function generateDailyReport(date, classId, generatedBy) {
  const queryDate = new Date(date);
  queryDate.setHours(0, 0, 0, 0);

  const whereClause = {
    date: queryDate
  };

  if (classId) {
    whereClause.classId = classId;
  }

  const attendanceRecords = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      student: {
        select: {
          studentId: true,
          firstName: true,
          lastName: true,
          class: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  const classesMap = {};
  const statistics = {
    total: attendanceRecords.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0
  };

  attendanceRecords.forEach(record => {
    statistics[record.status]++;
    
    const className = record.student.class.name;
    if (!classesMap[className]) {
      classesMap[className] = {
        id: record.student.class.id,
        name: className,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
    }
    
    classesMap[className].total++;
    classesMap[className][record.status]++;
  });

  const reportData = {
    date: queryDate,
    statistics,
    byClass: Object.values(classesMap),
    details: attendanceRecords.map(record => ({
      id: record.id,
      studentId: record.studentId,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      class: record.student.class.name,
      status: record.status,
      tapTime: record.tapTime,
      reason: record.reason
    }))
  };

  const report = await prisma.attendanceReport.create({
    data: {
      reportDate: queryDate,
      classId: classId || null,
      reportType: classId ? 'class_based' : 'daily',
      generatedBy: generatedBy || null,
      reportData
    }
  });

  return {
    reportId: report.id,
    reportDate: report.reportDate,
    ...reportData
  };
}

export async function getAttendanceConfig() {
  let config = await prisma.globalAttendanceConfig.findFirst();
  
  if (!config) {
    config = await prisma.globalAttendanceConfig.create({
      data: {
        openTime: '05:00:00',
        lateThreshold: '08:00:00',
        closeTime: '17:00:00',
        weekendDays: ['saturday', 'sunday'],
        graceMinutes: 15
      }
    });
  }
  
  return config;
}

export async function updateAttendanceConfig(configData) {
  const config = await prisma.globalAttendanceConfig.findFirst();
  
  if (!config) {
    return prisma.globalAttendanceConfig.create({
      data: {
        openTime: configData.openTime || '05:00:00',
        lateThreshold: configData.lateThreshold || '08:00:00',
        closeTime: configData.closeTime || '17:00:00',
        weekendDays: configData.weekendDays || ['saturday', 'sunday'],
        graceMinutes: configData.graceMinutes || 15
      }
    });
  }
  
  return prisma.globalAttendanceConfig.update({
    where: { id: config.id },
    data: {
      openTime: configData.openTime || config.openTime,
      lateThreshold: configData.lateThreshold || config.lateThreshold,
      closeTime: configData.closeTime || config.closeTime,
      weekendDays: configData.weekendDays || config.weekendDays,
      graceMinutes: configData.graceMinutes !== undefined ? configData.graceMinutes : config.graceMinutes
    }
  });
}

export async function getSchoolCalendarEvents(startDate, endDate, type) {
  const whereClause = {};
  
  if (startDate && endDate) {
    whereClause.date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  } else if (startDate) {
    whereClause.date = {
      gte: new Date(startDate)
    };
  } else if (endDate) {
    whereClause.date = {
      lte: new Date(endDate)
    };
  }
  
  if (type) {
    whereClause.type = type;
  }
  
  return prisma.schoolCalendar.findMany({
    where: whereClause,
    orderBy: {
      date: 'asc'
    }
  });
}

export async function addSchoolCalendarEvent(eventData) {
  const { date, name, description, type } = eventData;
  
  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);
  
  const existingEvent = await prisma.schoolCalendar.findUnique({
    where: { date: eventDate }
  });
  
  if (existingEvent) {
    const error = new Error('Calendar event already exists for this date');
    error.statusCode = 400;
    throw error;
  }
  
  return prisma.schoolCalendar.create({
    data: {
      date: eventDate,
      name,
      description,
      type
    }
  });
}