import { defaultLogger } from './log.js';

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type WithRetriesOptions = {
  maxRetries?: number;
  delayMs?: number;
  action?: string;
};

const DEFAULT_WITH_RETRIES_OPTIONS: Required<WithRetriesOptions> = {
  maxRetries: 2,
  delayMs: 1000,
  action: 'perform action',
} as const;

export class RetriesExceededError extends Error {
  constructor(action: string, maxRetries: number, public readonly cause: Error) {
    super(`Failed to ${action} after ${maxRetries} retries`);
    this.name = 'RetriesExceededError';
  }
}

export function withRetries<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: WithRetriesOptions = DEFAULT_WITH_RETRIES_OPTIONS
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  const { maxRetries, delayMs, action } = { ...DEFAULT_WITH_RETRIES_OPTIONS, ...options };
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    let retries = 0;

    while (true) {
      try {
        return await fn(...args);
      } catch (e) {
        // if this was the last retry, rethrow
        if (retries++ >= maxRetries) {
          throw new RetriesExceededError(action, maxRetries, e as Error);
        }

        defaultLogger.error(
          e,
          `[%d/%d] Failed to ${action}, retrying in %dms...`,
          retries,
          maxRetries,
          delayMs
        );

        await sleep(delayMs);
      }
    }
  };
}
