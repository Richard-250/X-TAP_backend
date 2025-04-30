import 'dotenv/config';
import app from './app.js';
import { initDb } from './database/initializer.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await initDb();

    // Bind to 0.0.0.0 so Railway can reach your app
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
