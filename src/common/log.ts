import createLogger, { Logger, LoggerOptions } from 'pino';
import { NODE_ENV } from './config.js';

const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
const defaultLevel = 'info';
const level =
  process.env['LOG_LEVEL'] && validLevels.includes(process.env['LOG_LEVEL'])
    ? process.env['LOG_LEVEL']
    : defaultLevel;

const loggers: Record<string, Logger> = {};

export function getLoggerOptionsFor(name: string, extraOptions: LoggerOptions = {}) {
  const options: LoggerOptions = {
    name,
    level,
    ...extraOptions,
  };

  if (NODE_ENV === 'development') {
    options.transport = {
      target: 'pino-pretty',
    };
  }

  return options;
}

export function getLoggerFor(name: string, extraOptions: LoggerOptions = {}) {
  if (!loggers[name]) {
    loggers[name] = createLogger(getLoggerOptionsFor(name, extraOptions));
  }

  return loggers[name]!;
}
