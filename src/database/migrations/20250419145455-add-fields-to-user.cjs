'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'isEnabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    
    await queryInterface.addColumn('Users', 'isPublic', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    
    await queryInterface.addColumn('Users', 'country', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'city', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'province', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'district', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'sector', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'village', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'road', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'postalCode', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'addressLine1', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Users', 'addressLine2', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'bio');
    await queryInterface.removeColumn('Users', 'isEnabled');
    await queryInterface.removeColumn('Users', 'isPublic');
    await queryInterface.removeColumn('Users', 'country');
    await queryInterface.removeColumn('Users', 'city');
    await queryInterface.removeColumn('Users', 'province');
    await queryInterface.removeColumn('Users', 'district');
    await queryInterface.removeColumn('Users', 'sector');
    await queryInterface.removeColumn('Users', 'village');
    await queryInterface.removeColumn('Users', 'road');
    await queryInterface.removeColumn('Users', 'postalCode');
    await queryInterface.removeColumn('Users', 'addressLine1');
    await queryInterface.removeColumn('Users', 'addressLine2');
  }
};