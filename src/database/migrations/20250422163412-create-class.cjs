'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('classes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      level: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      section: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'computer',
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'blue',
      },
      bgColor: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes
    await queryInterface.addIndex('classes', ['level']);
    await queryInterface.addIndex('classes', ['section']);
    await queryInterface.addIndex('classes', ['level', 'section']);
    await queryInterface.addIndex('classes', ['color']);
    await queryInterface.addIndex('classes', ['icon']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('classes');
  },
};