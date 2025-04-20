'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create admin user only if no admin exists
    const adminUsers = await queryInterface.sequelize.query(
      `SELECT * FROM "Users" WHERE role = 'admin' LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (adminUsers.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('WM8542', salt);
      const adminId = uuidv4();
      const firstName = 'Admin';
      const lastName = 'User';
      const email = process.env.ADMIN_EMAIL || 'admin@example.com';
      
      // Generate profile photo URL using first name (using DiceBear avatars)
      const profilePhoto = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName)}&backgroundType=gradientLinear`;
      
      await queryInterface.bulkInsert('Users', [{
        id: adminId,
        firstName,
        lastName,
        email,
        phoneNumber: process.env.ADMIN_PHONE || '+1234567890', // Default phone number
        profilePhoto,
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
      
      console.log('Default admin user seeded with complete profile');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove only the default admin user
    await queryInterface.bulkDelete('Users', { 
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      role: 'admin'
    }, {});
  }
};