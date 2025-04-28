module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    cardId: {  // Remove if not needed
      type: DataTypes.UUID,
      allowNull: false,
      field: 'card_id'  
      // Remove references unless you need direct card-based queries
    },
    studentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'students',
        key: 'studentId'
      },
      field: 'student_id'  
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id'
      },
      field: 'class_id',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE'),
      allowNull: false,
      defaultValue: 'ABSENT'
    },
    tapTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'tap_time',
    },
   
  }, {
    tableName: 'attendances',
    timestamps: true,
    indexes: [
      // 1. Speed up student queries
      { fields: ['id'] },
      
      // 3. Speed up status filtering
      { fields: ['status'] },
      
      // 4. Enforce one record per student per day
      {
        unique: true,
        fields: ['student_id', 'date'],  // Use database column names in indexes
        name: 'one_attendance_per_student_per_day'
      },
      
      // 5. Optional: Speed up date reports
      { fields: ['date'] }
    ],
    hooks: {
      beforeCreate: (attendance) => {
        // Auto-set status if tapped
        // if (attendance.tapTime) {
        //   attendance.status = 'PRESENT';
        //   // Auto-mark as LATE if tapTime exceeds a threshold (e.g., 8 AM)
        //   const tapHour = attendance.tapTime.getHours();
        //   if (tapHour >= 8) attendance.status = 'LATE';
        // }
        
        // Sync date from tapTime if missing
        if (!attendance.date && attendance.tap_time) {
          attendance.date = attendance.tap_time.toISOString().split('T')[0];
        }
      }
    }
  });
    Attendance.associate = (models) => {
    Attendance.belongsTo(models.Student, { foreignKey: 'studentId',  targetKey: 'studentId' });
    Attendance.belongsTo(models.Class, { foreignKey: 'classId' });
  };

  return Attendance;
};