// Load environment variables from .env file
require('dotenv').config();

module.exports = {
    development: {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    },
  test: {
    username: process.env.DB_USERNAME || 'postgres', // Fallback for local testing
    password: process.env.DB_PASSWORD || 'poprich', // Fallback (remove in production)
    database: process.env.DB_NAME || 'iTunda-system_testing', // Fallback
    host: process.env.DB_HOST || '127.0.0.1', // Fallback
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USERNAME, // Must be set in production
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: { // Required for most cloud DBs
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};