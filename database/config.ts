import 'dotenv/config';
import { config } from '../configs';

// Import the database configuration from configs/database.ts
// Since sequelize-cli requires CommonJS, we need to use require
const { databases } = require('../configs/database.ts');

// Use USER database configuration as the default
const USERConfig = databases.USER;

module.exports = {
  development: {
    username: USERConfig.DB_USER,
    password: USERConfig.DB_PASSWORD,
    database: USERConfig.DB_NAME,
    host: USERConfig.DB_HOST_WRITE,
    port: USERConfig.DB_PORT,
    dialect: USERConfig.DB_DIALECT,
    logging: config.logging.level === 'debug' ? console.log : false,
  },
  test: {
    username: USERConfig.DB_USER,
    password: USERConfig.DB_PASSWORD,
    database: `${USERConfig.DB_NAME}_test`,
    host: USERConfig.DB_HOST_WRITE,
    port: USERConfig.DB_PORT,
    dialect: USERConfig.DB_DIALECT,
    logging: false,
  },
  production: {
    username: USERConfig.DB_USER,
    password: USERConfig.DB_PASSWORD,
    database: USERConfig.DB_NAME,
    host: USERConfig.DB_HOST_WRITE,
    port: USERConfig.DB_PORT,
    dialect: USERConfig.DB_DIALECT,
    logging: false,
  },
};
