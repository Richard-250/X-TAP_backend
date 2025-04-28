'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const classes = [];
    const levels = ['L3', 'L4', 'L5'];
    const sections = ['A', 'B'];
    const courseTypes = ['SOD', 'NET', 'MTD'];

    // Generate classes
    courseTypes.forEach(courseType => {
      levels.forEach(level => {
        sections.forEach(section => {
          const icon = courseType === 'SOD' ? 'laptop-code' : 
                       courseType === 'NET' ? 'network-wired' : 
                       'photo-video';

          const color = courseType === 'SOD' ? 'blue' : 
                        courseType === 'NET' ? 'green' : 
                        'purple';

          const bgColor = `${color}-light`;

          classes.push({
            id: uuidv4(), // << Using UUID here
            name: `${level} ${courseType} ${section}`,
            level: level,
            section: section,
            description: `${courseType} class for ${level} students in section ${section}`,
            icon: icon,
            color: color,
            bgColor: bgColor,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });
      });
    });

    await queryInterface.bulkInsert('classes', classes, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('classes', null, {});
  },
};