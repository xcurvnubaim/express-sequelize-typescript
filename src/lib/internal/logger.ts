import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import {
  logging,
  type ChannelName,
  type ConsoleChannelCfg,
  type FileChannelCfg,
  type LoggingConfig,
  type LogLevel,
  type NewRelicChannelCfg,
  type SentryChannelCfg,
} from '../../../configs/logging';
const require = createRequire(import.meta.url);

// Minimal interface, Laravel-like API
export interface Logger {
  debug: (message: string, context?: any) => void;
  info: (message: string, context?: any) => void;
  warn: (message: string, context?: any) => void;
  error: (message: string | Error, context?: any) => void;
  withContext?: (context: Record<string, any>) => Logger;
}

type LevelNum = { [K in LogLevel]: number };
const levelToNumber: LevelNum = { debug: 10, info: 20, warn: 30, error: 40 };

function shouldLog(current: LogLevel, messageLevel: LogLevel) {
  return levelToNumber[messageLevel] >= levelToNumber[current];
}

function errorToString(e: Error): string {
  return `${e.name}: ${e.message}`;
}

function getCallerInfo(): string {
  const stack = new Error().stack;
  if (!stack) return '';

  const lines = stack.split('\n');
  // Skip frames: Error, getCallerInfo, formatLine, adapter.log, base.log, api.info/error/etc
  // Line 6 or 7 is usually the actual caller
  let callerLine = lines[6];

  // Fallback if frame 6 doesn't exist
  if (!callerLine && lines[5]) callerLine = lines[5];
  if (!callerLine && lines[4]) callerLine = lines[4];

  if (!callerLine) return '';

  const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)|at\s+(.+?):(\d+):(\d+)/);
  if (!match) return '';

  const functionName = match[1] || 'anonymous';
  const file = match[2] || match[5];
  const line = match[3] || match[6];

  const fileName = file ? file.split('/').pop() : '';
  const cleanFunctionName = functionName.split('.').pop() || functionName;
  return `fn: ${cleanFunctionName} (${fileName}:${line})`;
}

function formatLine(level: LogLevel, message: string | Error, context?: any): string {
  const timestamp = new Date().toISOString();
  const caller = getCallerInfo();
  const messageStr = message instanceof Error ? errorToString(message) : message;
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level}] [${caller}] ${messageStr}${contextStr}`;
}

class ConsoleAdapter {
  constructor(private level: LogLevel) {}
  log(level: LogLevel, message: string | Error, context?: any) {
    if (!shouldLog(this.level, level)) return;
    const baseCtx =
      message instanceof Error && message.stack ? { ...context, stack: message.stack } : context;
    const line = formatLine(level, message, baseCtx);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }
}

class FileAdapter {
  private stream: fs.WriteStream;
  constructor(
    private level: LogLevel,
    private filePath: string
  ) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    this.stream = fs.createWriteStream(filePath, { flags: 'a' });
  }
  log(level: LogLevel, message: string | Error, context?: any) {
    if (!shouldLog(this.level, level)) return;
    const baseCtx =
      message instanceof Error && (message as Error).stack
        ? { ...context, stack: (message as Error).stack }
        : context;
    this.stream.write(formatLine(level, message, baseCtx) + '\n');
  }
}

class SentryAdapter {
  private sentry: any | undefined;
  private inited = false;
  constructor(
    private level: LogLevel,
    private cfg: SentryChannelCfg
  ) {
    if (!cfg.enabled || !cfg.dsn) return;
    try {
      // Dynamically import so it's optional
      this.sentry = require('@sentry/node');
      this.sentry.init({
        dsn: cfg.dsn,
        environment: cfg.environment,
        release: cfg.release,
      });
      this.inited = true;
    } catch {
      // Sentry not installed; ignore
    }
  }
  log(level: LogLevel, message: string | Error, context?: any) {
    if (!this.inited || !shouldLog(this.level, level)) return;
    if (level === 'error') {
      const err = message instanceof Error ? message : new Error(String(message));
      this.sentry.captureException(err, { extra: context });
    } else {
      this.sentry.captureMessage(String(message), {
        level,
        extra: context,
      });
    }
  }
}

class NewRelicAdapter {
  private nr: any | undefined;
  constructor(
    private level: LogLevel,
    private cfg: NewRelicChannelCfg
  ) {
    if (!cfg.enabled) return;
    try {
      // The New Relic Node agent patches global; importing "newrelic" returns the API
      this.nr = require('newrelic');
    } catch {
      // not installed; ignore
    }
  }
  log(level: LogLevel, message: string | Error, context?: any) {
    if (!this.nr || !shouldLog(this.level, level)) return;
    const attrs = context && typeof context === 'object' ? context : { context };
    if (level === 'error') {
      this.nr.noticeError(new Error(String(message)), attrs);
    } else {
      this.nr.recordCustomEvent('Log', {
        level,
        message: message instanceof Error ? errorToString(message) : String(message),
        ...attrs,
        timestamp: Date.now(),
      });
    }
  }
}

// Build adapter by channel key using the channel config and global level fallback
function buildAdapter(
  name: ChannelName,
  cfg: ConsoleChannelCfg | FileChannelCfg | SentryChannelCfg | NewRelicChannelCfg,
  globalLevel?: LogLevel
) {
  const level = (cfg.level || globalLevel || 'info') as LogLevel;
  switch (name) {
    case 'console':
      return new ConsoleAdapter(level);
    case 'file':
      return new FileAdapter(level, (cfg as FileChannelCfg).path);
    case 'sentry':
      return new SentryAdapter(
        (cfg.level as LogLevel) || ('error' as LogLevel),
        cfg as SentryChannelCfg
      );
    case 'newrelic':
      return new NewRelicAdapter(
        (cfg.level as LogLevel) || ('error' as LogLevel),
        cfg as NewRelicChannelCfg
      );
    default:
      return new ConsoleAdapter(level);
  }
}

export function createLogger(
  config: LoggingConfig = logging as LoggingConfig,
  name?: ChannelName
): Logger {
  const cfg = config || (logging as LoggingConfig);
  const defaultChannelName = (name || cfg.default || 'console') as ChannelName;
  const adapters: Array<{ log: (l: LogLevel, m: string | Error, c?: any) => void }> = [];

  // Add enabled channels; if none enabled, add default; if still none, fallback to console
  const entries = Object.entries(cfg.channels || {}) as [ChannelName, any][];
  const enabled = entries.filter(([, c]) => c && c.enabled);

  if (enabled.length > 0) {
    enabled.forEach(([key, ch]) => adapters.push(buildAdapter(key, ch, cfg.level)));
  } else {
    const defCfg = cfg.channels?.[defaultChannelName];
    if (defCfg) {
      adapters.push(buildAdapter(defaultChannelName, defCfg as any, cfg.level));
    } else {
      adapters.push(new ConsoleAdapter((cfg.level as LogLevel) || 'info'));
    }
  }

  const base = {
    log(level: LogLevel, message: string | Error, context?: any) {
      adapters.forEach((a) => a.log(level, message, context));
    },
  };

  const api: Logger = {
    debug: (m, ctx) => base.log('debug', m, ctx),
    info: (m, ctx) => base.log('info', m, ctx),
    warn: (m, ctx) => base.log('warn', m, ctx),
    error: (m, ctx) => base.log('error', m, ctx),
    withContext(context) {
      return {
        debug: (m, c) => base.log('debug', m, { ...context, ...c }),
        info: (m, c) => base.log('info', m, { ...context, ...c }),
        warn: (m, c) => base.log('warn', m, { ...context, ...c }),
        error: (m, c) => base.log('error', m, { ...context, ...c }),
      } as Logger;
    },
  };

  return api;
}

export default createLogger;
