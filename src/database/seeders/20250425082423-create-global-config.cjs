'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('global_attendance_config', [{
      id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
    // All other fields will use their default values from the migration
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('global_attendance_config', null, {});
  }
};