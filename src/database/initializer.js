import bcrypt from 'bcryptjs';
import pkg from './models/index.js';
import 'dotenv/config'
const { sequelize, User } = pkg;

export const initDb = async () => {
  try {
    // Sync database
    await sequelize.sync();
    console.log('Database synchronized successfully');
    
    // Check if admin user exists
    const adminCount = await User.count({ where: { role: 'admin' } });
    
    if (adminCount === 0) {
      // Create default admin user
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
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};