// import { Op } from 'sequelize';
// import db from '../../database/models/index.js';
// const { Student, Class, Attendance, AttendanceWindow, GlobalAttendanceConfig } = db;
// import { getGlobalAttendanceConfig } from '../../config/attendance.config.js';

// function AttendanceWindowError(message) {
//   const error = new Error(message);
//   error.name = 'AttendanceWindowError';
//   return error;
// }

// // async function getGlobalAttendanceConfig(transaction = null) {
// //   let config = await GlobalAttendanceConfig.findOne({
// //     transaction
// //   });

// //   if (!config) {
// //     config = await GlobalAttendanceConfig.create({
// //       openTimeHour: 5,
// //       openTimeMinute: 0,
// //       lateThresholdHour: 8,
// //       lateThresholdMinute: 0,
// //       closeTimeHour: 16,
// //       closeTimeMinute: 30,
// //       windowCreationHour: 0,
// //       windowCreationMinute: 0,
// //       autoCreateWindows: true,
// //       autoManageGates: true
// //     }, { transaction });
// //   }
// // //   console.log('config:', config)
// //   return config;
// // }

// async function initializeAttendanceRecords(windowId, classId, transaction) {
//   const students = await Student.findAll({
//     where: { classId },
//     attributes: ['id'],
//     transaction
//   });

//   const attendanceRecords = students.map(student => ({
//     studentId: student.id,
//     windowId,
//     status: 'ABSENT',
//     tapTime: new Date()
//   }));

//   if (attendanceRecords.length > 0) {
//     await Attendance.bulkCreate(attendanceRecords, {
//       updateOnDuplicate: ['status'],
//       transaction
//     });
//   }
// }



// export async function processStudentAttendance(cardId) {
//   const student = await Student.findOne({
//     where: { cardId },
//     include: [{ model: Class}] // if Class has Course relation
//   });
  
//   if (!student) {
//     return { success: false, message: "Student not found." };
//   }
  
//   if (!student.isActive) {
//     return { success: false, message: "Student is not active." };
//   }
// // console.log('student: ', student)

// const globalConfig = await getGlobalAttendanceConfig();

// if (!globalConfig) {
//   return { success: false, message: "Global attendance config not found." };
// }


//   // const now = new Date();
//   // const currentDate = now.toISOString().split('T')[0];
//   // const currentTime = now.toTimeString().split(' ')[0];

// const classId = student.classId;
// const today = new Date().toISOString().split('T')[0]; 

// let window = await AttendanceWindow.findOne({
//   where: {
//     classId,
//     date: today,
//   }
// });

// console.log('window: ', window)
// if (!window && globalConfig.autoCreateWindows) {
//   window = await AttendanceWindow.create({
//     classId,
//     date: today,
//     startTime: `${String(globalConfig.openTimeHour).padStart(2, '0')}:${String(globalConfig.openTimeMinute).padStart(2, '0')}:00`,
//     endTime: `${String(globalConfig.closeTimeHour).padStart(2, '0')}:${String(globalConfig.closeTimeMinute).padStart(2, '0')}:00`,
//     isActive: true,
//   });
// }

// if (!window) {
//   return { success: false, message: "No attendance window available and auto-create is disabled." };
// }

// console.log('new-Window: ', window);

// const now = new Date();
// const currentTimeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

// const [currentHour, currentMinute] = [now.getHours(), now.getMinutes()];
// const lateHour = globalConfig.lateThresholdHour;
// const lateMinute = globalConfig.lateThresholdMinute;

// let status = 'PRESENT';

// if (
//   currentHour > lateHour ||
//   (currentHour === lateHour && currentMinute > lateMinute)
// ) {
//   status = 'LATE';
// }

// const alreadyMarked = await Attendance.findOne({
//   where: {
//     studentId: student.id,
//     windowId: window.id,
//   }
// });
// console.log('already marked: ', alreadyMarked)
// if (alreadyMarked) {
//   return { success: false, message: "Attendance already marked." };
// }

// const attendance = await Attendance.create({
//   studentId: student.id,
//   windowId: window.id,
//   status,
//   tapTime: now,
// });

// return {
//   success: true,
//   message: "Attendance recorded successfully.",
//   data: {
//     student: {
//       id: student.id,
//       fullName: `{student.firstName} {student.lastName}`,
//       cardId: student.cardId,
//     },
//     class: student.class ? {
//       id: student.class.id,
//       name: student.class.name,
//     } : null,
//     course: student.class?.course ? {
//       id: student.class.course.id,
//       name: student.class.course.name,
//     } : null,
//     attendance: {
//       id: attendance.id,
//       status: attendance.status,
//       tapTime: attendance.tapTime,
//     }
//   }
// };


//   // const attendanceWindow = await AttendanceWindow.findOne({
//   //   where: {
//   //     classId: student.classId,
//   //     date: currentDate,
//   //     isActive: true,
//   //     startTime: { [Op.lte]: currentTime },
//   //     // endTime: { [Op.gte]: currentTime }
//   //   }
//   // });

//   // if (!attendanceWindow) {
//   //   throw new Error('No active attendance window for this class at the current time');
//   // }

//   // const globalConfig = await getGlobalAttendanceConfig();

//   // let status = 'PRESENT';
//   // const lateThresholdTime = `${String(globalConfig.lateThresholdHour).padStart(2, '0')}:${String(globalConfig.lateThresholdMinute).padStart(2, '0')}:00`;

//   // if (currentTime > lateThresholdTime) {
//   //   status = 'LATE';
//   // }

//   // let attendance = await Attendance.findOne({
//   //   where: {
//   //     studentId: student.id,
//   //     // windowId: attendanceWindow.id 
//   //   }
//   // });

//   // if (attendance) {
//   //   attendance = await attendance.update({
//   //     status,
//   //     tapTime: now
//   //   });
//   // } else {
//   //   attendance = await Attendance.create({
//   //     studentId: student.id,
//   //     windowId: attendanceWindow.id,
//   //     status,
//   //     tapTime: now
//   //   });
//   // }

//   // return {
//   //   id: attendance.id,
//   //   studentId: student.id,
//   //   studentName: `${student.firstName} ${student.lastName}`,
//   //   className: student.classId,
//   //   date: currentDate,
//   //   status: attendance.status,
//   //   tapTime: attendance.tapTime,
//   //   message: `Attendance marked as ${status} for ${student.firstName} ${student.lastName}`
//   // };
// }

// export async function getStudentAttendanceHistory(studentId, startDate, endDate) {
//   try {
//     const today = new Date();
//     const end = endDate ? new Date(endDate) : today;
    
//     const defaultStart = new Date(end);
//     defaultStart.setDate(defaultStart.getDate() - 30);
//     const start = startDate ? new Date(startDate) : defaultStart;

//     const formattedStart = start.toISOString().split('T')[0];
//     const formattedEnd = end.toISOString().split('T')[0];

//     const attendanceRecords = await Attendance.findAll({
//       where: {
//         studentId
//       },
//       include: [
//         {
//           model: AttendanceWindow,
//           as: 'window',
//           where: {
//             date: {
//               [Op.between]: [formattedStart, formattedEnd]
//             }
//           }
//         }
//       ],
//       order: [
//         [{ model: AttendanceWindow, as: 'window' }, 'date', 'DESC']
//       ]
//     });

//     return attendanceRecords.map(record => ({
//       id: record.id,
//       date: record.window.date,
//       status: record.status,
//       tapTime: record.tapTime,
//       windowStart: record.window.startTime,
//       windowEnd: record.window.endTime
//     }));
//   } catch (error) {
//     throw error;
//   }
// }

// export async function getClassAttendance(classId, date) {
//   try {
//     const attendanceDate = date || new Date().toISOString().split('T')[0];

//     const attendanceWindow = await AttendanceWindow.findOne({
//       where: {
//         classId,
//         date: attendanceDate
//       }
//     });

//     if (!attendanceWindow) {
//       return {
//         classId,
//         date: attendanceDate,
//         windowExists: false,
//         students: []
//       };
//     }

//     const students = await Student.findAll({
//       where: { classId },
//       attributes: ['id', 'firstName', 'lastName', 'cardId']
//     });

//     const attendanceRecords = await Attendance.findAll({
//       where: {
//         windowId: attendanceWindow.id
//       }
//     });

//     const attendanceMap = {};
//     attendanceRecords.forEach(record => {
//       attendanceMap[record.studentId] = record;
//     });

//     const studentAttendance = students.map(student => {
//       const record = attendanceMap[student.id];
//       return {
//         studentId: student.id,
//         cardId: student.cardId,
//         name: `${student.firstName} ${student.lastName}`,
//         status: record ? record.status : 'ABSENT',
//         tapTime: record ? record.tapTime : null
//       };
//     });

//     const present = studentAttendance.filter(s => s.status === 'PRESENT').length;
//     const late = studentAttendance.filter(s => s.status === 'LATE').length;
//     const absent = studentAttendance.filter(s => s.status === 'ABSENT').length;
//     const total = students.length;

//     return {
//       classId,
//       date: attendanceDate,
//       windowId: attendanceWindow.id,
//       isActive: attendanceWindow.isActive,
//       startTime: attendanceWindow.startTime,
//       endTime: attendanceWindow.endTime,
//       summary: {
//         total,
//         present,
//         late,
//         absent,
//         presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
//         latePercentage: total > 0 ? Math.round((late / total) * 100) : 0,
//         absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0
//       },
//       students: studentAttendance
//     };
//   } catch (error) {
//     throw error;
//   }
// }

// export async function createOrUpdateAttendanceWindow(classId, date, startTime, endTime, isActive = true) {
//   const transaction = await db.sequelize.transaction();
  
//   try {
//     const classExists = await Class.findByPk(classId, { transaction });
//     if (!classExists) {
//       throw new Error(`Class with ID ${classId} not found`);
//     }

//     const formattedDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
//     const globalConfig = await getGlobalAttendanceConfig(transaction);
    
//     const defaultStartTime = `${String(globalConfig.openTimeHour).padStart(2, '0')}:${String(globalConfig.openTimeMinute).padStart(2, '0')}:00`;
//     const defaultEndTime = `${String(globalConfig.closeTimeHour).padStart(2, '0')}:${String(globalConfig.closeTimeMinute).padStart(2, '0')}:00`;
    
//     const windowStartTime = startTime || defaultStartTime;
//     const windowEndTime = endTime || defaultEndTime;

//     let [window, created] = await AttendanceWindow.findOrCreate({
//       where: {
//         classId,
//         date: formattedDate
//       },
//       defaults: {
//         startTime: windowStartTime,
//         endTime: windowEndTime,
//         isActive
//       },
//       transaction
//     });

//     if (!created) {
//       window = await window.update({
//         startTime: windowStartTime,
//         endTime: windowEndTime,
//         isActive
//       }, { transaction });
//     }

//     if (isActive) {
//       await initializeAttendanceRecords(window.id, classId, transaction);
//     }

//     await transaction.commit();
//     return window;
//   } catch (error) {
//     await transaction.rollback();
//     throw error;
//   }
// }


// export async function closeAttendanceWindow(windowId) {
//   try {
//     const window = await AttendanceWindow.findByPk(windowId);
    
//     if (!window) {
//       throw AttendanceWindowError(`Attendance window with ID ${windowId} not found`);
//     }

//     return await window.update({ isActive: false });
//   } catch (error) {
//     throw error;
//   }
// }

// export async function updateAttendanceStatus(attendanceId, status) {
//   try {
//     const attendance = await Attendance.findByPk(attendanceId);
    
//     if (!attendance) {
//       throw new Error(`Attendance record with ID ${attendanceId} not found`);
//     }

//     return await attendance.update({ 
//       status,
//       tapTime: status !== 'ABSENT' ? new Date() : attendance.tapTime
//     });
//   } catch (error) {
//     throw error;
//   }
// }

// export async function updateGlobalAttendanceConfig(configData) {
//   try {
//     let config = await GlobalAttendanceConfig.findOne();
    
//     if (!config) {
//       config = await GlobalAttendanceConfig.create(configData);
//     } else {
//       await config.update(configData);
//     }

//     return config;
//   } catch (error) {
//     throw error;
//   }
// }

// export async function runAttendanceCleanupJob() {
//   const transaction = await db.sequelize.transaction();
  
//   try {
//     const today = new Date().toISOString().split('T')[0];
    
//     const activeWindows = await AttendanceWindow.findAll({
//       where: {
//         date: today,
//         isActive: true
//       },
//       transaction
//     });

//     for (const window of activeWindows) {
//       await window.update({ isActive: false }, { transaction });
      
//       const students = await Student.findAll({
//         where: { classId: window.classId },
//         attributes: ['id'],
//         transaction
//       });
      
//       for (const student of students) {
//         await Attendance.findOrCreate({
//           where: {
//             studentId: student.id,
//             windowId: window.id
//           },
//           defaults: {
//             status: 'ABSENT',
//             tapTime: new Date()
//           },
//           transaction
//         });
//       }
//     }

//     await transaction.commit();
//     return { success: true, processedWindows: activeWindows.length };
//   } catch (error) {
//     await transaction.rollback();
//     throw error;
//   }
// }

// export async function createDailyAttendanceWindows() {
//   const transaction = await db.sequelize.transaction();
  
//   try {
//     const config = await getGlobalAttendanceConfig(transaction);
    
//     if (!config.autoCreateWindows) {
//       return { success: true, message: 'Auto-creation is disabled', windowsCreated: 0 };
//     }

//     const today = new Date().toISOString().split('T')[0];
    
//     const classes = await Class.findAll({
//       transaction
//     });

//     let windowsCreated = 0;
    
//     for (const classItem of classes) {
//       const startTime = `${String(config.openTimeHour).padStart(2, '0')}:${String(config.openTimeMinute).padStart(2, '0')}:00`;
//       const endTime = `${String(config.closeTimeHour).padStart(2, '0')}:${String(config.closeTimeMinute).padStart(2, '0')}:00`;
      
//       const [window, created] = await AttendanceWindow.findOrCreate({
//         where: {
//           classId: classItem.id,
//           date: today
//         },
//         defaults: {
//           startTime,
//           endTime,
//           isActive: true
//         },
//         transaction
//       });

//       if (created) {
//         windowsCreated++;
//         await initializeAttendanceRecords(window.id, classItem.id, transaction);
//       }
//     }

//     await transaction.commit();
//     return { success: true, windowsCreated };
//   } catch (error) {
//     await transaction.rollback();
//     throw error;
//   }
// }