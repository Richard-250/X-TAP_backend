'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'title', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Professional title or designation of the user'
    });

    await queryInterface.addColumn('Users', 'nfcLoginToken', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Token used for NFC-based authentication'
    });

    await queryInterface.addColumn('Users', 'nfcLoginTokenExpires', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Expiration date for the NFC login token'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'title');
    await queryInterface.removeColumn('Users', 'nfcLoginToken');
    await queryInterface.removeColumn('Users', 'nfcLoginTokenExpires');
  }
};