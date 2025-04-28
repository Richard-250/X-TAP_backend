// seeders/YYYYMMDDHHMMSS-demo-courses.js
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('courses', [
      {
        id: uuidv4(),
        name: 'SOD',
        description: 'Comprehensive training in modern software development practices including full-stack development, agile methodologies, and software architecture.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'NET',
        description: 'Training in computer networking fundamentals, network administration, security, and infrastructure management.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'MLTD',
        description: 'Training in digital media production including graphic design, video editing, animation, and multimedia content creation.',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('courses', {
      name: [
        'SOD',
        'NET',
        'MLTD'
      ]
    }, {});
  },
};