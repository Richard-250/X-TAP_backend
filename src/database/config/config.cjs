// Keep database configuration in CommonJS
module.exports = {
    development: {
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'poprich',
      database: process.env.DB_NAME || 'iTunda-system',
      host: process.env.DB_HOST || '127.0.0.1',
      dialect: 'postgres',
      logging: false
    },
    test: {
      // Test configuration
    },
    production: {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    }
  };
  