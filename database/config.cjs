require('dotenv').config();

// For sequelize-cli, we need to read the config directly from environment variables
// since it can't handle TypeScript imports

module.exports = {
  development: {
    username: process.env.DB_USER_USER || 'user',
    password: process.env.DB_PASSWORD_USER || 'password',
    database: process.env.DB_NAME_USER || 'database',
    host: process.env.DB_HOST_WRITE_USER || 'localhost',
    port: Number(process.env.DB_PORT_USER) || 3306,
    dialect: 'mysql',
    logging: console.log,
  },
  test: {
    username: process.env.DB_USER_USER || 'user',
    password: process.env.DB_PASSWORD_USER || 'password',
    database: `${process.env.DB_NAME_USER || 'database'}_test`,
    host: process.env.DB_HOST_WRITE_USER || 'localhost',
    port: Number(process.env.DB_PORT_USER) || 3306,
    dialect: 'mysql',
    logging: false,
  },
  production: {
    username: process.env.DB_USER_USER,
    password: process.env.DB_PASSWORD_USER,
    database: process.env.DB_NAME_USER,
    host: process.env.DB_HOST_WRITE_USER,
    port: Number(process.env.DB_PORT_USER) || 3306,
    dialect: 'mysql',
    logging: false,
  },
};
