function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined || value.length === 0) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }

  return parsed;
}
export const NODE_ENV: string = process.env['NODE_ENV'] || 'development';
export const DATABASE_URL: string | undefined = process.env['DATABASE_URL'];
export const DATABASE_SSL: string | undefined = process.env['DATABASE_SSL'];
export const DATABASE_MIN_POOL_SIZE: number = getNumberEnv('DATABASE_MIN_POOL_SIZE', 10);
export const DATABASE_MAX_POOL_SIZE: number = getNumberEnv('DATABASE_MAX_POOL_SIZE', 50);
export const API_PORT: number = getNumberEnv('PORT', 4000);
export const API_CORS_ORIGIN: RegExp = new RegExp(
  process.env['API_CORS_ORIGIN'] ||
    '^(https:\\/\\/app\\.beefy\\.(com|finance)|http:\\/\\/localhost(:[0-9]+)?|http:\\/\\/127.0.0.1(:[0-9]+)?)$'
);
export const API_RANGE_KEY: string | undefined = process.env['API_RANGE_KEY'];
export const SNAPSHOT_INTERVAL: number = getNumberEnv('SNAPSHOT_INTERVAL', 15 * 60);
export const VIEW_REFRESH_INTERVAL: number = getNumberEnv('VIEW_REFRESH_INTERVAL', 6 * 60 * 60);
export const SNAPSHOT_RETRY_DELAY: number = getNumberEnv('SNAPSHOT_RETRY_DELAY', 60);
export const SNAPSHOT_RETRY_MAX: number = getNumberEnv('SNAPSHOT_RETRY_MAX', 5);
export const REFRESH_RETRY_MAX: number = getNumberEnv('REFRESH_RETRY_MAX', 2);
export const CLM_API: string = process.env['CLM_API'] || 'https://clm-api.beefy.finance';

// --- Tiger Cloud shadow deployment (temporary, see src/api/tiger and src/snapshot/tiger-mirror.ts) ---
// When TIGER_DATABASE_URL is set: the API also serves TIGER_API_PREFIX (default /api/tiger) from Tiger, and the snapshot job mirrors
// every snapshot to Tiger after the primary write. When unset, nothing Tiger-related runs.
export const TIGER_DATABASE_URL: string | undefined = process.env['TIGER_DATABASE_URL'];
export const TIGER_DATABASE_SSL: string | undefined = process.env['TIGER_DATABASE_SSL'];
export const TIGER_API_PREFIX: string = process.env['TIGER_API_PREFIX'] || '/api/tiger';
export const TIGER_MIRROR_TIMEOUT: number = getNumberEnv('TIGER_MIRROR_TIMEOUT', 120);
