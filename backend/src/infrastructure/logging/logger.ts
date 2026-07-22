import { env } from '../../config/env.js';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

export interface LogFields {
  readonly requestId?: string;
  readonly err?: unknown;
  readonly [key: string]: unknown;
}

function serializeError(err: unknown): Record<string, unknown> | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: env.NODE_ENV === 'production' ? undefined : err.stack,
    };
  }
  return { value: err };
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[env.LOG_LEVEL as LogLevel];
}

function write(level: LogLevel, message: string, fields: LogFields = {}): void {
  if (!shouldLog(level)) return;

  const { err, ...rest } = fields;
  const payload = {
    level,
    time: new Date().toISOString(),
    service: 'senvirox-api',
    msg: message,
    ...rest,
    ...(err ? { err: serializeError(err) } : {}),
  };

  const line = JSON.stringify(payload);
  if (level === 'error' || level === 'fatal') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export const logger = {
  fatal: (message: string, fields?: LogFields) => write('fatal', message, fields),
  error: (message: string, fields?: LogFields) => write('error', message, fields),
  warn: (message: string, fields?: LogFields) => write('warn', message, fields),
  info: (message: string, fields?: LogFields) => write('info', message, fields),
  debug: (message: string, fields?: LogFields) => write('debug', message, fields),
  trace: (message: string, fields?: LogFields) => write('trace', message, fields),
  child(base: LogFields) {
    return {
      fatal: (message: string, fields?: LogFields) =>
        write('fatal', message, { ...base, ...fields }),
      error: (message: string, fields?: LogFields) =>
        write('error', message, { ...base, ...fields }),
      warn: (message: string, fields?: LogFields) => write('warn', message, { ...base, ...fields }),
      info: (message: string, fields?: LogFields) => write('info', message, { ...base, ...fields }),
      debug: (message: string, fields?: LogFields) =>
        write('debug', message, { ...base, ...fields }),
      trace: (message: string, fields?: LogFields) =>
        write('trace', message, { ...base, ...fields }),
    };
  },
};

export type Logger = typeof logger;
