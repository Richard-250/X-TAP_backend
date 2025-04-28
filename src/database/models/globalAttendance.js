module.exports = (sequelize, DataTypes) => {
  const GlobalAttendanceConfig = sequelize.define('GlobalAttendanceConfig', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    openTime: { 
      type: DataTypes.TIME, 
      defaultValue: '05:00:00' // 5 AM
    },
    lateThreshold: { 
      type: DataTypes.TIME, 
      defaultValue: '08:00:00' // 8 AM
    },
    closeTime: { 
      type: DataTypes.TIME, 
      defaultValue: '17:00:00' // 5 PM
    }
  }, {
    tableName: 'global_attendance_config',
    timestamps: true,
    // hooks: {
    //   // beforeCreate: async (config) => {
    //   //   const count = await GlobalAttendanceConfig.count();
    //   //   if (count >= 1) {
    //   //     throw new Error('Only one global attendance configuration is allowed.');
    //   //   }
    //   // },
    //   // beforeBulkCreate: (configs) => {
    //   //   throw new Error('Bulk creation is disabled for global configuration.');
    //   // }
    // }
  });

  // Add a static method to fetch the singleton config
  GlobalAttendanceConfig.getConfig = async () => {
    return await GlobalAttendanceConfig.findOne();
  };

  return GlobalAttendanceConfig;
};