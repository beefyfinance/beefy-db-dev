import { NODE_ENV } from './config.js';
import pino, { type Logger, type LoggerOptions } from 'pino';

const pinoPretty = NODE_ENV === 'development' ? (await import('pino-pretty')).default : undefined;
const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
const defaultLevel = 'info';
const LOG_LEVEL =
  process.env['LOG_LEVEL'] && validLevels.includes(process.env['LOG_LEVEL'])
    ? process.env['LOG_LEVEL']
    : defaultLevel;

const loggers: Record<string, Logger> = {};

export function createDefaultLogger(name: string) {
  const options: LoggerOptions = {
    name,
    level: LOG_LEVEL,
  };

  if (pinoPretty) {
    // pretty sync mode in dev so pino output is correct order with other output to stdout
    return pino(options, pinoPretty({ sync: true }));
  }

  return pino(options);
}

export const defaultLogger = createDefaultLogger('beefy-db-dev');

export function getLoggerFor(name: string) {
  return (loggers[name] ??= defaultLogger.child({ name }));
}
