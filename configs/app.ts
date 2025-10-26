export const appConfig = {
  PORT: Number(process.env.APP_PORT) || 3000,
  HOST: process.env.APP_HOST || 'localhost',
  ENV: process.env.APP_ENV || 'development',
  SECRET_KEY: process.env.SECRET_KEY || 'secret',
};
