import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pkg from './models/index.js';
import 'dotenv/config';

const { sequelize, User, Class, Course, GlobalAttendanceConfig } = pkg; // <- Added GlobalAttendanceConfig

export const initDb = async () => {
  try {
    // Sync database
    await sequelize.sync();
    console.log('Database synchronized successfully');

    // Create Admin if not exists
    const adminCount = await User.count({ where: { role: 'admin' } });

    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_DEFAULT_PASSWORD || 'WM8542',
        salt
      );

      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        phoneNumber: process.env.ADMIN_PHONE || '+1234567890',
        profilePhoto: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin+User'
      });

      console.log('Default admin user created');
    }

    // Create Classes if not exists
    const classCount = await Class.count();
    if (classCount === 0) {
      const classes = [];
      const levels = ['L3', 'L4', 'L5'];
      const sections = ['A', 'B'];
      const courseTypes = ['SOD', 'NET', 'MTD'];

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
              id: uuidv4(),
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

      await Class.bulkCreate(classes);
      console.log('Default classes created');
    }

    // Create Courses if not exists
    const courseCount = await Course.count();
    if (courseCount === 0) {
      const courses = [
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
      ];

      await Course.bulkCreate(courses);
      console.log('Default courses created');
    }

    // Create Global Attendance Config if not exists
    const globalConfigCount = await GlobalAttendanceConfig.count();
    if (globalConfigCount === 0) {
      await GlobalAttendanceConfig.create({
        id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', // <- Fixed UUID from your seeder
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Global attendance config created');
    }

  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};
