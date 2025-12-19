const { Sequelize } = require('sequelize');

const isTest = process.env.NODE_ENV === 'test';
const databaseUrl = isTest
  ? process.env.TEST_DATABASE_URL || 'sqlite::memory:'
  : process.env.DATABASE_URL;
const dialect = isTest ? 'sqlite' : 'postgres';

const sequelize = new Sequelize(databaseUrl, {
  dialect,
  storage: isTest ? process.env.TEST_DATABASE_STORAGE : undefined,
  logging: false,
  pool: {
    max: isTest ? 1 : 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const Media = require('./media.model')(sequelize);

const db = {
  sequelize,
  Sequelize,
  Media
};

module.exports = db;
