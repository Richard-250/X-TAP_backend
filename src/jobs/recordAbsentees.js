import cron from 'node-cron';
import 'dotenv/config';
import db from '../database/models/index.js';
const { Student, GlobalAttendanceConfig, Attendance } = db;

// Flag to track if the job has been scheduled
let isSchedulerRunning = false;

export const scheduleAbsentMarking = async () => {
  // Prevent rescheduling if already running
  if (isSchedulerRunning) {
    console.log('Scheduler is already running.');
    return;
  }

  try {
    const config = await GlobalAttendanceConfig.getConfig();
    if (!config?.closeTime) {
      console.error('No closeTime set in global config');
      return;
    }
    // console.log('config:', config)
    const [hour, minute, second] = config.closeTime.split(':');
    const cronTime = `${second} ${minute} ${hour} * * *`; // run every day at closeTime
    // Schedule cron job
    cron.schedule(cronTime, async () => {
      // Mark that the scheduler is running
      isSchedulerRunning = true;

      const currentDate = new Date().toISOString().split('T')[0];

      try {
        // ⛔ Prevent duplicate recording
        const alreadyRecorded = await Attendance.findOne({
          where: {
            date: currentDate,
            status: 'ABSENT'
          }
        });
        console.log('already recorded:', alreadyRecorded)
        if (alreadyRecorded) {
          console.log(`[${currentDate}] Absences already recorded — skipping.`);
          isSchedulerRunning = false; // Reset the flag once done
          return;
        }

        const activeStudents = await Student.findAll({
            where: { isActive: true },
            attributes: ['id', 'studentId', 'classId', 'cardId']
          });
        console.log('students:', activeStudents)
        const attendedStudents = await Attendance.findAll({
          where: { date: currentDate },
          attributes: ['studentId']
        });

        // console.log('attended students:', attendedStudents)
        const attendedIds = attendedStudents.map(s => s.studentId);

        const absentStudents = activeStudents.filter(
          s => !attendedIds.includes(s.studentId)
        );

        await Promise.all(
          absentStudents.map(s =>
            Attendance.create({
              cardId: s.cardId,
              studentId: s.studentId,
              classId: s.classId,
              date: currentDate,
              status: 'ABSENT',
              tapTime: null,
            })
          )
        );

        if (process.env.NODE_ENV === 'testing') {
          console.log(`[${new Date().toISOString()}] Absent students recorded: ${absentStudents.length}`);
        }
        
      } catch (err) {
        console.error('Scheduled absent marking failed:', err.message);
      } finally {
        // Reset the flag once job finishes
        isSchedulerRunning = false;
      }
    });

  } catch (error) {
    console.error('Failed to initialize absence scheduler:', error.message);
  }
};
