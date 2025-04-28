
// async function determineAttendanceStatus({ tapTime, windowId, models }) {
//     const [config, window] = await Promise.all([
//       models.GlobalAttendanceConfig.findOne(),
//       models.AttendanceWindow.findByPk(windowId),
//     ]);
  
//     if (!config || !window) {
//       throw new Error('Required config or window not found');
//     }
  
//     const tapDate = new Date(tapTime);
//     const tapMinutes = tapDate.getHours() * 60 + tapDate.getMinutes();
//     const lateThreshold = config.lateThresholdHour * 60 + config.lateThresholdMinute;
//     const closeTime = config.closeTimeHour * 60 + config.closeTimeMinute;
  
//     if (tapMinutes <= lateThreshold) return 'PRESENT';
//     if (tapMinutes <= closeTime) return 'LATE';
//     return 'ABSENT';
//   }
  
//   module.exports = {
//     determineAttendanceStatus,
//   };
  