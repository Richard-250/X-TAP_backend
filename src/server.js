import 'dotenv/config';
import app from './app.js';
import main from './config/db_test.js';
import { PrismaClient } from '@prisma/client';

const PORT = process.env.PORT || 8888;

main()
  .then(() => {
    console.log('Database connection successful');
  })
  .catch((error) => {
    console.error('Database connection error:', error);
  });

const startServer = async () => {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
