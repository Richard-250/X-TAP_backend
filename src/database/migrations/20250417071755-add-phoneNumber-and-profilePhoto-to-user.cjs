'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns only
    await queryInterface.addColumn('Users', 'phoneNumber', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'profilePhoto', {
      type: Sequelize.STRING,
      allowNull: true
    });
    // No need for email index since it's already handled by the unique constraint
  },

  async down(queryInterface, Sequelize) {
    // Remove columns only
    await queryInterface.removeColumn('Users', 'phoneNumber');
    await queryInterface.removeColumn('Users', 'profilePhoto');
    // No need to touch email index in down migration
  }
};