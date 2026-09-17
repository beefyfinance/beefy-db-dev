// Mirrors each snapshot to Tiger Cloud after the primary (Heroku) write has committed.
//
// Guarantees: this module never throws and never blocks the primary path beyond the awaited call, which is
// itself bounded by the pool's statement timeout. Any failure is logged and the snapshot is simply missing on
// Tiger until the next top-up (restore-tiger.sh topup). Heroku stays the source of truth for ids: the id rows
// are copied over with their ids so both databases agree on every vault_id / oracle_id / chain_id.
import { getLoggerFor } from '../common/log.js';
import { TIGER_MIRROR_TIMEOUT } from '../common/config.js';
import { getTigerPool, isTigerEnabled } from '../common/tiger-db.js';
import { unixToTimestamp } from '../common/db.js';
import { getOrThrow } from './utils.js';
import type { PriceOracleRow } from './ids.js';
import type { LpBreakdown, TvlBreakdownByChain } from './beefy-api/types.js';

const logger = getLoggerFor('snapshot:tiger');

export type TigerSnapshot = {
  snapshot: number;
  priceData: Record<string, number>;
  lpData: Record<string, number>;
  lbBreakdownData: Record<string, LpBreakdown>;
  apyData: Record<string, number>;
  tvlData: Record<string, number>;
  tvlByChainData: TvlBreakdownByChain;
  oracleData: Record<string, PriceOracleRow>;
  vaultIds: Record<string, number>;
  chainIds: Record<string, number>;
};

export async function mirrorSnapshotToTiger(s: TigerSnapshot): Promise<void> {
  if (!isTigerEnabled()) return;
  const started = Date.now();
  try {
    // overall deadline for the whole mirror, on top of the per-statement timeout of the pool
    await withDeadline(
      (async () => {
        await writeSnapshot(s);
        await refreshAggregates();
      })(),
      TIGER_MIRROR_TIMEOUT * 1000
    );
    logger.info('Mirrored snapshot %d to Tiger in %dms', s.snapshot, Date.now() - started);
  } catch (e) {
    logger.error(
      e,
      'Failed to mirror snapshot %d to Tiger (primary write is unaffected)',
      s.snapshot
    );
  }
}

function withDeadline<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Tiger mirror exceeded ${ms}ms deadline`)), ms);
  });
  // whichever settles first; the late one is swallowed so nothing becomes an unhandled rejection
  return Promise.race([p, deadline]).finally(() => {
    clearTimeout(timer);
    p.catch(() => {});
  });
}

async function writeSnapshot(s: TigerSnapshot) {
  const t = unixToTimestamp(s.snapshot);
  const client = await getTigerPool().connect();
  try {
    await client.query('BEGIN');

    // 1. id tables, with the ids assigned by Heroku
    await upsertIds(client, 'vault_ids', 'vault_id', Object.entries(s.vaultIds));
    await upsertIds(client, 'chain_ids', 'chain_id', Object.entries(s.chainIds));
    const oracles = Object.values(s.oracleData);
    if (oracles.length) {
      // tokens travel as Postgres array literals ('{"a","b"}') inside a text[] and are cast back server-side
      const literal = (tokens: string[]) =>
        '{' + tokens.map(x => '"' + x.replace(/(["\\])/g, '\\$1') + '"').join(',') + '}';
      await client.query(
        `INSERT INTO price_oracles (id, oracle_id, tokens)
         SELECT id, oracle_id, tokens::text[] FROM unnest($1::int[], $2::text[], $3::text[]) AS u(id, oracle_id, tokens)
         ON CONFLICT (id) DO UPDATE SET tokens = EXCLUDED.tokens
         WHERE price_oracles.tokens IS DISTINCT FROM EXCLUDED.tokens`,
        [oracles.map(o => o.id), oracles.map(o => o.oracle_id), oracles.map(o => literal(o.tokens))]
      );
    }

    // 2. snapshot rows; ON CONFLICT DO NOTHING makes retries and top-ups idempotent
    const oracleRows = (data: Record<string, number>) =>
      Object.entries(data).map(([oracle_id, val]) => [getOrThrow(s.oracleData, oracle_id).id, val]);
    const vaultRows = (data: Record<string, number>) =>
      Object.entries(data).map(([vault_id, val]) => [getOrThrow(s.vaultIds, vault_id), val]);

    await insertIdVal(
      client,
      'prices',
      'oracle_id',
      t,
      oracleRows(s.priceData).concat(oracleRows(s.lpData))
    );
    await insertIdVal(client, 'apys', 'vault_id', t, vaultRows(s.apyData));
    await insertIdVal(client, 'tvls', 'vault_id', t, vaultRows(s.tvlData));

    const lp = Object.entries(s.lbBreakdownData);
    if (lp.length) {
      await client.query(
        `INSERT INTO lp_breakdowns (oracle_id, t, balances, total_supply)
         SELECT oracle_id, $1::timestamptz, string_to_array(balances, ',')::double precision[], total_supply
         FROM unnest($2::int[], $3::text[], $4::double precision[]) AS u(oracle_id, balances, total_supply)
         ON CONFLICT DO NOTHING`,
        [
          t,
          lp.map(([oracle_id]) => getOrThrow(s.oracleData, oracle_id).id),
          lp.map(([, v]) => v.balances.join(',')),
          lp.map(([, v]) => parseFloat(v.totalSupply)),
        ]
      );
    }

    const tbc = Object.entries(s.tvlByChainData);
    if (tbc.length) {
      await client.query(
        `INSERT INTO tvl_by_chain (chain_id, t, total, vault, gov, clm)
         SELECT chain_id, $1::timestamptz, total, vault, gov, clm
         FROM unnest($2::int[], $3::double precision[], $4::double precision[], $5::double precision[], $6::double precision[])
              AS u(chain_id, total, vault, gov, clm)
         ON CONFLICT DO NOTHING`,
        [
          t,
          tbc.map(([chainId]) => getOrThrow(s.chainIds, chainId)),
          tbc.map(([, v]) => v.total),
          tbc.map(([, v]) => v.vault),
          tbc.map(([, v]) => v.gov),
          tbc.map(([, v]) => v.clm),
        ]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function upsertIds(
  client: { query: (q: string, p?: unknown[]) => Promise<unknown> },
  table: 'vault_ids' | 'chain_ids',
  column: 'vault_id' | 'chain_id',
  entries: [string, number][]
) {
  if (!entries.length) return;
  await client.query(
    `INSERT INTO ${table} (id, ${column}) SELECT * FROM unnest($1::int[], $2::text[]) ON CONFLICT (id) DO NOTHING`,
    [entries.map(([, id]) => id), entries.map(([name]) => name)]
  );
}

async function insertIdVal(
  client: { query: (q: string, p?: unknown[]) => Promise<unknown> },
  table: 'prices' | 'apys' | 'tvls',
  column: 'oracle_id' | 'vault_id',
  t: string,
  rows: (number | null)[][]
) {
  if (!rows.length) return;
  await client.query(
    `INSERT INTO ${table} (${column}, t, val)
     SELECT id, $1::timestamptz, val FROM unnest($2::int[], $3::double precision[]) AS u(id, val)
     ON CONFLICT DO NOTHING`,
    [t, rows.map(r => r[0]), rows.map(r => r[1])]
  );
}

// apys_daily is a continuous aggregate (incremental: only the buckets that received rows are recomputed),
// apys_agg_mv is a small materialized view over it. Both are cheap; measured 0.3 s + 4 s on 0.5 CPU.
async function refreshAggregates() {
  const pool = getTigerPool();
  await pool.query(
    `CALL refresh_continuous_aggregate('apys_daily', now() - interval '2 days', now() + interval '1 day')`
  );
  await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY apys_agg_mv');
}
