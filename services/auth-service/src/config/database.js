require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    url: process.env.TEST_DATABASE_URL || 'sqlite::memory:',
    dialect: 'sqlite',
    logging: false,
    storage: process.env.TEST_DATABASE_STORAGE,
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
