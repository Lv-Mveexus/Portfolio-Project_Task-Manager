const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// DB_PATH is injected by Electron main process in production.
// Falls back to a local file in dev.
const dbPath = process.env.DB_PATH
  || path.join(__dirname, '../../taskflow.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

module.exports = sequelize;
