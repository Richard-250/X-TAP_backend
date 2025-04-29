import db from '../database/models/index.js';
import { Op} from 'sequelize';
const { Student, Class, Course, GlobalAttendanceConfig, Attendance, } = db;


export const recordAttendance = async (req, res) => {
  const { studentId } = req.body;
  const currentTime = new Date();
  const currentDate = currentTime.toISOString().split('T')[0];
  const currentDay = currentTime.getDay(); 

  try {
    // 1. Check if today is a weekend (Saturday or Sunday)
    // if (currentDay === 0 || currentDay === 6) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Attendance cannot be recorded on weekends'
    //   });
    // }

    // 2. Check if student exists and is active
    const student = await Student.findOne({
      where: { studentId, isActive: true },
      include: [{
        model: Class,
        attributes: ['id', 'name'] // Include only the fields you need
      }]
    });
// console.log('student:', student)
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or inactive'
      });
    }

    // 3. Get global attendance configuration
    const globalConfig = await GlobalAttendanceConfig.getConfig();
    if (!globalConfig) {
      return res.status(500).json({
        success: false,
        message: 'Attendance system not configured'
      });
    }

    // 4. Check if current time is within allowed attendance window
    const currentTimeStr = currentTime.toTimeString().split(' ')[0];
    // if (currentTimeStr < globalConfig.openTime || currentTimeStr > globalConfig.closeTime) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Attendance outside allowed time window'
    //   });
    // }

    // 5. Check if student already attended today
    const existingAttendance = await Attendance.findOne({
      where: {
        [Op.and]: [
          { studentId: student.studentId},  // <-- ✔️ Use student.id (UUID)
          { date: currentDate }
        ]
      }
    });
    
// console.log('exsting:', existingAttendance)
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Student already marked attendance today'
      });
    }

    // 6. Determine status based on time
    let status = 'PRESENT';
    if (currentTimeStr > globalConfig.lateThreshold) {
      status = 'LATE';
    }
    await Attendance.create({
      studentId: student.studentId,            
      classId: student.classId, 
      cardId: student.cardId, 
      date: currentDate,
      status,
      tapTime: currentTime     
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: {
        student: student.getFullName(),
        status,
        time: currentTimeStr,
        date: currentDate,
        profilePhoto: student.profilePhoto,
        cardId: student.cardId,
        class: {
          id: student.classId,
          name: student.Class.name // Access the class name from the included Class model
        }
      }
    });

  } catch (error) {
    console.error('Attendance recording error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message
    });
  }
}

export const getClassAttendance = async (req, res) => {
  const { classId } = req.params;
  const { 
    date, 
    startDate,
    endDate,
    page = 1, 
    limit = 10,
    sortBy = 'date',
    sortDir = 'DESC',
    search = ''
  } = req.query;

  try {
    // Validate class exists
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Calculate pagination parameters
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = { class_id: classId };
    
    // Handle date filtering (single date or date range)
    if (date) {
      // Specific single date has priority if provided
      whereConditions.date = date;
    } else if (startDate || endDate) {
      // Date range filtering
      whereConditions.date = {};
      
      if (startDate) {
        whereConditions.date[Op.gte] = new Date(startDate);
      }
      
      if (endDate) {
        whereConditions.date[Op.lte] = new Date(endDate);
      }
    }

    // Build search condition for student name
    const searchCondition = search ? {
      [Op.or]: [
        { '$Student.firstName$': { [Op.iLike]: `%${search}%` } },
        { '$Student.lastName$': { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    // Determine sort field and direction
    const sortField = sortBy === 'name' ? 
      [['Student', 'firstName', sortDir]] : 
      [[sortBy, sortDir]];

    // Fetch attendance records with sorting and filtering
    const { count, rows: attendanceRecords } = await Attendance.findAndCountAll({
      where: {
        ...whereConditions,
        ...searchCondition
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Student,
          attributes: ['firstName', 'lastName', 'profilePhoto'],
          required: true
        }
      ],
      order: sortField
    });

    // Format the attendance records
    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      classId: record.classId,
      date: record.date,
      status: record.status,
      tapTime: record.tapTime,
      studentId: record.studentId,
      fullName: record.Student ? `${record.Student.firstName} ${record.Student.lastName}` : null,
      profilePhoto: record.Student.profilePhoto
    }));

    return res.status(200).json({
      success: true,
      message: 'Class attendance records retrieved successfully',
      data: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        records: formattedRecords
      }
    });

  } catch (error) {
    console.error('Get class attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class attendance records',
      error: error.message
    });
  }
};

export const getStudentAttendance = async (req, res) => {
  const { page = 1, limit = 10, startDate, endDate } = req.query;
  let { studentId } = req.params;
  
  try {
    // Ensure at least one identifier is provided
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: ' student ID must be provided'
      });
    }
    
    // Find the student first
    const whereCondition = {};
    if (studentId) whereCondition.studentId = studentId
 
    
    const student = await Student.findOne({
      where: whereCondition
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Build query for attendance records
    const attendanceWhere = { studentId: student.studentId };
    
    // Add date range if provided
    if (startDate && endDate) {
      attendanceWhere.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      attendanceWhere.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      attendanceWhere.date = {
        [Op.lte]: endDate
      };
    }
    
    // Calculate pagination parameters
    const offset = (page - 1) * limit;
    
    // Fetch attendance records
    const { count, rows: attendanceRecords } = await Attendance.findAndCountAll({
      where: attendanceWhere,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC'], ['tapTime', 'ASC']],
      include: [
        {
          model: Class,
          attributes: ['id', 'name']
        },
        {
          model: Student,
          attributes: ['id', 'courseId'], // adjust as needed
          include: [
            {
              model: Course,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Student attendance records retrieved successfully',
      data: {
        student: {
          id: student.id,
          CourseId:student.courseId,
          cardId: student.cardId,
          name: student.getFullName()
        },
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        records: attendanceRecords
      }
    });
    
  } catch (error) {
    console.error('Get student attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student attendance records',
      error: error.message
    });
  }
};

export const updateAttendanceStatus = async (req, res) => {
  const { studentId } = req.params;
  const { status } = req.body;
  
  // Validate status
  const validStatuses = ['PRESENT', 'LATE', 'ABSENT'];
  if (!validStatuses.includes(status.trim().toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }
  
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Find the student
    const student = await Student.findOne({
      where: { 

           studentId: studentId 

      }
    });
    // console.log('stuent:', student)

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Find today's attendance record for this student
    const attendanceRecord = await Attendance.findOne({
      where: {
        studentId: student.studentId,
        date: today
      }
    });
    
    if(!attendanceRecord) { return res.status(400).json({ success: false, message: 'No attendance record found' })}
    // Update the existing record
    attendanceRecord.status = status.trim().toUpperCase();
    await attendanceRecord.save();
    
    return res.status(200).json({
      success: true,
      message: 'Attendance status updated successfully',
      data: attendanceRecord
    });
    
  } catch (error) {
    console.error('Update attendance status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update attendance status',
      error: error.message
    });
  }
};




















export const searchAttendance = async (req, res) => {
  const { 
    classId, 
    status, 
    date, 
    startDate, 
    endDate, 
    studentName,
    sortBy = 'date', 
    sortOrder = 'DESC',
    page = 1, 
    limit = 10 
  } = req.query;
  
  try {
    const attendanceWhere = {};
    if (classId) attendanceWhere.classId = classId;
    if (status) attendanceWhere.status = status.toUpperCase();
    if (date) {
      attendanceWhere.date = date;
    } else if (startDate || endDate) {
      attendanceWhere.date = {};
      if (startDate) attendanceWhere.date[Op.gte] = startDate;
      if (endDate) attendanceWhere.date[Op.lte] = endDate;
    }

    const studentWhere = {};
    if (studentName) {
      studentWhere[Op.or] = [
        { firstName: { [Op.iLike]: `%${studentName}%` } },
        { lastName: { [Op.iLike]: `%${studentName}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    
    let order = [];
    if (sortBy === 'status') {
      order.push(['status', sortOrder]);
    } else if (sortBy === 'date') {
      order.push(['date', sortOrder]);
      order.push(['tapTime', 'ASC']);
    } else if (sortBy === 'studentName') {
      order.push([{ model: Student, as: 'Student' }, 'lastName', sortOrder]);
      order.push([{ model: Student, as: 'Student' }, 'firstName', sortOrder]);
    } else {
      order.push(['date', 'DESC']);
      order.push(['tapTime', 'ASC']);
    }

    const { count, rows: attendanceRecords } = await Attendance.findAndCountAll({
      where: attendanceWhere,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order,
      include: [
        {
          model: Student,
          where: studentWhere,
          required: true,
          attributes: ['id', 'firstName', 'lastName', 'cardId']
        },
        {
          model: Class,
          attributes: ['id', 'name']
        }
      ],
      distinct: true
    });

    // 🧹 Map to clean response
    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      status: record.status,
      date: record.date,
      tapTime: record.tapTime,
      student: {
        id: record.Student?.id,
        firstName: record.Student?.firstName,
        lastName: record.Student?.lastName,
        cardId: record.Student?.cardId
      },
      class: {
        id: record.Class?.id,
        name: record.Class?.name
      }
    }));

    return res.status(200).json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        records: formattedRecords
      }
    });
    
  } catch (error) {
    console.error('Search attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search attendance records',
      error: error.message
    });
  }
};


export const getClassAttendanceSummary = async (req, res) => {
  const { classId } = req.params;
  const { startDate, endDate } = req.query;
  
  try {
    // Validate class exists
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Build date range condition
    const dateCondition = {};
    if (startDate && endDate) {
      dateCondition[Op.between] = [startDate, endDate];
    } else if (startDate) {
      dateCondition[Op.gte] = startDate;
    } else if (endDate) {
      dateCondition[Op.lte] = endDate;
    }
    
    // Get all students in the class
    const students = await Student.findAll({
      where: { classId, isActive: true },
      attributes: ['id', 'firstName', 'lastName'],
    });
    
    // Get attendance records for all students in this class
    const attendanceData = await Attendance.findAll({
      where: {
        classId,
        ...(Object.keys(dateCondition).length > 0 ? { date: dateCondition } : {})
      },
      attributes: ['studentId', 'status', 'date']
    });
    
    // Calculate total school days in the period
    let totalDays;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      // Remove weekends
      totalDays = [...Array(daysDiff).keys()]
        .map(i => {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          return d.getDay(); // 0 = Sunday, 6 = Saturday
        })
        .filter(day => day !== 0 && day !== 6).length;
    } else {
      const uniqueDates = new Set(attendanceData.map(record => record.date));
      totalDays = uniqueDates.size;
    }
    
    // Process data for each student
    const summaryData = students.map(student => {
      const studentRecords = attendanceData.filter(record => 
        record.studentId === student.id
      );
      
      const present = studentRecords.filter(r => r.status === 'PRESENT').length;
      const late = studentRecords.filter(r => r.status === 'LATE').length;
      const absent = studentRecords.filter(r => r.status === 'ABSENT').length;
      
      const total = present + late + absent;
      
      const presentPercentage = totalDays ? ((present / totalDays) * 100).toFixed(2) : '0.00';
      const latePercentage = totalDays ? ((late / totalDays) * 100).toFixed(2) : '0.00';
      const absentPercentage = totalDays ? ((absent / totalDays) * 100).toFixed(2) : '0.00';
      
      const attendanceRate = totalDays ? 
        (((present + late) / totalDays) * 100).toFixed(2) : '0.00';

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentCode: student.studentId,
        stats: {
          present,
          late,
          absent,
          total,
          presentPercentage: `${presentPercentage}%`,
          latePercentage: `${latePercentage}%`,
          absentPercentage: `${absentPercentage}%`,
          attendanceRate: `${attendanceRate}%`
        }
      };
    });
    
    return res.status(200).json({
      success: true,
      message: 'Class attendance summary retrieved successfully',
      data: {
        className: classExists.name,
        totalSchoolDays: totalDays,
        period: { startDate, endDate },
        students: summaryData
      }
    });
    
  } catch (error) {
    console.error('Get class attendance summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve class attendance summary',
      error: error.message
    });
  }
};
