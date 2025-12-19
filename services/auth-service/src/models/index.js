const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, {
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  pool: dbConfig.pool
});

const User = require('./user.model')(sequelize);

const db = {
  sequelize,
  Sequelize,
  User
};

module.exports = db;
