'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('global_attendance_config', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      openTime: {
        type: Sequelize.TIME,
        defaultValue: '05:00:00'
      },
      lateThreshold: {
        type: Sequelize.TIME,
        defaultValue: '08:00:00'
      },
      closeTime: {
        type: Sequelize.TIME,
        defaultValue: '17:00:00'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
   
    
    await queryInterface.dropTable('global_attendance_config');
  }
};