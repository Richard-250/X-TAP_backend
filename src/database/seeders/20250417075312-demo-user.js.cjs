'use strict';
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Only seed test users in development environment
    if (process.env.NODE_ENV !== 'production') {
      // Get admin user to set as createdBy
      const [admin] = await queryInterface.sequelize.query(
        `SELECT id FROM "Users" WHERE role = 'admin' LIMIT 1;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      const adminId = admin?.id || null;
      const password = await bcrypt.hash('Test123!', 10);
      
      // Test users data
      const testUsers = [
        // Managers
        ...this.generateUsers('manager', [
          'alex.johnson@example.com',
          'sarah.williams@example.com',
          'michael.brown@example.com'
        ], adminId, password),
        
        // Mentors
        ...this.generateUsers('mentor', [
          'david.miller@example.com',
          'emma.davis@example.com',
          'james.wilson@example.com'
        ], adminId, password),
        
        // Staff
        ...this.generateUsers('staff', [
          'olivia.moore@example.com',
          'liam.taylor@example.com',
          'ava.anderson@example.com'
        ], adminId, password)
      ];
      
      await queryInterface.bulkInsert('Users', testUsers);
      console.log(`Seeded ${testUsers.length} test users (managers, mentors, staff)`);
    }
  },

  async down(queryInterface, Sequelize) {
    if (process.env.NODE_ENV !== 'production') {
      await queryInterface.bulkDelete('Users', {
        email: {
          [Sequelize.Op.like]: '%@example.com'
        },
        role: {
          [Sequelize.Op.in]: ['manager', 'mentor', 'staff']
        }
      });
      console.log('Removed all test users');
    }
  },

  // Helper method to generate user objects
  generateUsers(role, emails, createdBy, password) {
    const genders = ['male', 'female', 'other', 'prefer_not_to_say'];
    const countries = ['United States', 'Canada', 'United Kingdom', 'Rwanda', 'South Africa'];
    const usCities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    const rwandaDistricts = ['Kigali', 'Gasabo', 'Nyarugenge', 'Kicukiro', 'Rubavu'];
    const rwandaSectors = ['Gikondo', 'Kacyiru', 'Kimihurura', 'Remera', 'Gatsata'];
    
    return emails.map((email, index) => {
      const firstName = email.split('.')[0];
      const lastName = email.split('.')[1].split('@')[0];
      const verificationToken = crypto.randomBytes(16).toString('hex');
      
      // Generate random date of birth between 18 and 65 years ago
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - (18 + Math.floor(Math.random() * 47)); // 18-65 years old
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const dateOfBirth = new Date(birthYear, birthMonth - 1, birthDay).toISOString().split('T')[0];
      
      // Randomly select gender
      const gender = genders[Math.floor(Math.random() * genders.length)];
      
      // Set last login to random time in the past 30 days (for some users)
      const lastLogin = Math.random() > 0.3 ? 
        new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) : 
        null;
      
      // Generate random address data
      const country = countries[Math.floor(Math.random() * countries.length)];
      let city, province, district, sector, village, road, postalCode;
      
      if (country === 'Rwanda') {
        city = 'Kigali';
        province = 'Kigali';
        district = rwandaDistricts[Math.floor(Math.random() * rwandaDistricts.length)];
        sector = rwandaSectors[Math.floor(Math.random() * rwandaSectors.length)];
        village = `Village ${Math.floor(Math.random() * 20) + 1}`;
        road = `Street ${Math.floor(Math.random() * 100) + 1}`;
        postalCode = `P0${Math.floor(Math.random() * 9) + 1}`;
      } else {
        city = usCities[Math.floor(Math.random() * usCities.length)];
        province = ['California', 'Texas', 'New York', 'Florida', 'Illinois'][Math.floor(Math.random() * 5)];
        district = `District ${Math.floor(Math.random() * 10) + 1}`;
        sector = `Sector ${Math.floor(Math.random() * 10) + 1}`;
        village = '';
        road = `${['Main', 'Oak', 'Pine', 'Maple', 'Cedar'][Math.floor(Math.random() * 5)]} St`;
        postalCode = `${Math.floor(10000 + Math.random() * 90000)}`;
      }
      
      // Generate gender-appropriate avatar
      let profilePhoto;
      if (gender === 'female') {
        profilePhoto = `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}+${lastName}&hair=longHair,pixie&accessories=roundGlasses,kurt&facialHair=blank`;
      } else if (gender === 'male') {
        profilePhoto = `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}+${lastName}&hair=shortHair,balding&facialHair=beard,scruff&accessories=prescription02`;
      } else {
        profilePhoto = `https://api.dicebear.com/7.x/identicon/svg?seed=${firstName}+${lastName}`;
      }
      
      // Generate bio based on role and gender
      const bios = {
        manager: [
          `Experienced ${gender === 'female' ? 'female' : 'male'} manager with a proven track record.`,
          `Leadership-focused professional with ${Math.floor(Math.random() * 10) + 5} years in management.`,
          `Strategic thinker and team builder passionate about organizational growth.`
        ],
        mentor: [
          `Dedicated mentor committed to helping others achieve their potential.`,
          `${gender === 'female' ? 'She' : 'He'} has mentored ${Math.floor(Math.random() * 50) + 10} individuals.`,
          `Passionate about sharing knowledge and fostering professional development.`
        ],
        staff: [
          `Detail-oriented team player with strong organizational skills.`,
          `Reliable professional with expertise in ${['operations', 'customer service', 'administration'][Math.floor(Math.random() * 3)]}.`,
          `Committed to excellence in every task ${gender === 'female' ? 'she' : 'he'} undertakes.`
        ]
      };
      
      return {
        id: uuidv4(),
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        email,
        phoneNumber: country === 'Rwanda' ? 
          `+2507${Math.floor(80 + Math.random() * 20)}${Math.floor(100000 + Math.random() * 900000)}` :
          `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
        profilePhoto,
        password,
        role,
        verificationToken,
        verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isVerified: true,
        createdBy,
        lastLogin,
        dateOfBirth,
        gender,
        // New fields
        bio: bios[role][Math.floor(Math.random() * bios[role].length)],
        isEnabled: true,
        isPublic: Math.random() > 0.2, // 80% chance of being public
        // Address fields
        country,
        city,
        province,
        district,
        sector,
        village: country === 'Rwanda' ? village : '',
        road,
        postalCode,
        addressLine1: `${Math.floor(Math.random() * 9999) + 1} ${road}`,
        addressLine2: `${sector}, ${city}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
  }
};