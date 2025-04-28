'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendances', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      studentId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'students',
          key: 'studentId'
        },
        field: 'student_id'
      },
      cardId:{
        type: Sequelize.UUID,
        allowNull: false,
        field: 'card_id'
      },
      classId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'classes',
          key: 'id'
        },
        field: 'class_id'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      status: {
        type: Sequelize.ENUM('PRESENT', 'ABSENT', 'LATE'),
        allowNull: false,
        defaultValue: 'ABSENT'
      },
      tapTime: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'tap_time'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        // field: 'created_at',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        // field: 'updated_at',
      }
    });

    // Add indexes
    await queryInterface.addIndex('attendances', ['student_id'], {
      name: 'attendances_student_id'
    });

    await queryInterface.addIndex('attendances', ['status'], {
      name: 'attendances_status'
    });

    await queryInterface.addIndex('attendances', ['date'], {
      name: 'attendances_date'
    });

    // Add unique constraint for one record per student per day
    await queryInterface.addConstraint('attendances', {
      fields: ['student_id', 'date'],
      type: 'unique',
      name: 'one_attendance_per_student_per_day'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('attendances', 'attendances_student_id');
    await queryInterface.removeIndex('attendances', 'attendances_status');
    await queryInterface.removeIndex('attendances', 'attendances_date');
    
    // Remove unique constraint
    await queryInterface.removeConstraint('attendances', 'one_attendance_per_student_per_day');
    
    // Finally drop the table
    await queryInterface.dropTable('attendances');
  }
};