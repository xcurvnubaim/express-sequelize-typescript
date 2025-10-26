export const logging: LoggingConfig = {
  default: (process.env.LOG_CHANNEL as ChannelName) || 'console',
  level: (process.env.APP_LOG_LEVEL as LogLevel) || 'info',
  channels: {
    // Console logger (useful for local/dev or containers)
    console: {
      level: (process.env.APP_LOG_LEVEL as LogLevel) || 'info',
      enabled: process.env.LOG_CHANNEL === 'console',
    },

    // File-based logging
    file: {
      level: (process.env.APP_LOG_LEVEL as LogLevel) || 'info',
      path: process.env.LOG_FILE_PATH || './storage/logs/app.log',
      enabled: process.env.LOG_CHANNEL === 'file',
    },

    // Sentry channel (requires @sentry/node at runtime)
    sentry: {
      level: (process.env.SENTRY_LOG_LEVEL as LogLevel) || 'error',
      dsn: process.env.SENTRY_DSN || '',
      environment: process.env.SENTRY_ENVIRONMENT || process.env.APP_ENV || 'development',
      release: process.env.SENTRY_RELEASE || undefined,
      enabled: process.env.LOG_CHANNEL === 'sentry',
    },

    // New Relic channel (requires newrelic agent configured in the app)
    newrelic: {
      level: (process.env.NEW_RELIC_LOG_LEVEL as LogLevel) || 'error',
      appName: process.env.NEW_RELIC_APP_NAME || undefined,
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY || undefined,
      enabled: process.env.LOG_CHANNEL === 'newrelic',
    },
  },
};

export default logging;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LoggingConfig = {
  default: ChannelName;
  level?: LogLevel;
  channels: ChannelsMap;
};

// Define local channel/config types to mirror configs/logging.ts
export type ChannelName = 'console' | 'file' | 'sentry' | 'newrelic';

export type ConsoleChannelCfg = { level?: LogLevel; enabled?: boolean };
export type FileChannelCfg = { level?: LogLevel; path: string; enabled?: boolean };
export type SentryChannelCfg = {
  level?: LogLevel;
  dsn?: string;
  environment?: string;
  release?: string;
  enabled?: boolean;
};
export type NewRelicChannelCfg = {
  level?: LogLevel;
  appName?: string;
  licenseKey?: string;
  enabled?: boolean;
};

export type ChannelsMap = {
  console?: ConsoleChannelCfg;
  file?: FileChannelCfg;
  sentry?: SentryChannelCfg;
  newrelic?: NewRelicChannelCfg;
};
