import type { QueryResultRow } from 'pg';
import { getPool } from '../../common/db.js';
import { DB_FORCE_BITMAP_SCANS, DB_SCAN_IO_CONCURRENCY } from '../../common/config.js';

/**
 * Stop-gap before switch to TimescaleDB
 *
 * prices/apys/tvls ordered by insert time, not by oracle_id/vault_id.
 * Rows end up roughly one per 8KB heap page, so a 1Y/all bucket has to fetch ~38k separate pages to return a few hundred points.
 *
 * A plain Index Scan walks those pages strictly serially.
 * A Bitmap Heap Scan instead can load pages in parallel.
 *
 * enable_indexscan=off is needed because the planner costs both plans as if I/O were serial.
 *
 * Both are SET LOCAL, so they apply only to this transaction and never leak to a pooled client.
 */
const SCAN_PLAN_OVERRIDES = [
  'SET LOCAL enable_indexscan = off',
  `SET LOCAL effective_io_concurrency = ${Math.min(Math.max(DB_SCAN_IO_CONCURRENCY, 1), 1000)}`,
].join('; ');

/**
 * Runs a single query with the above plan overrides above applied.
 * Falls back to a plain pooled query when DB_FORCE_BITMAP_SCANS is off.
 */
export async function queryWithScanOverrides<R extends QueryResultRow>(
  query: string,
  params: (string | number)[]
): Promise<R[]> {
  const pool = getPool();

  if (!DB_FORCE_BITMAP_SCANS) {
    const result = await pool.query<R>(query, params);
    return result.rows;
  }

  const client = await pool.connect();
  let failure: Error | undefined;
  try {
    await client.query(`BEGIN; ${SCAN_PLAN_OVERRIDES};`);
    const result = await client.query<R>(query, params);
    await client.query('COMMIT');
    return result.rows;
  } catch (err) {
    failure = err instanceof Error ? err : new Error(String(err));
    throw err;
  } finally {
    // discard rather than reuse on failure: the client may still be inside the transaction
    client.release(failure);
  }
}
