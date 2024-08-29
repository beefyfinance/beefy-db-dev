import { getLoggerFor } from '../common/log.js';
import {
  getApys,
  getCowVaults,
  getGovVaults,
  getLpBreakdown,
  getPrices,
  getTvls,
  getVaults,
} from './beefy-api/api.js';
import { getNextSnapshot } from './utils.js';
import {
  createPriceOracleData,
  transformApy,
  transformLpBreakdown,
  transformLpBreakdownToPrices,
  transformPrices,
  transformTvl,
  transformVaults,
} from './transform.js';
import { getQueryBuilder, unixToTimestamp } from '../common/db.js';
import type { Knex } from 'knex';
import { sleep } from '../common/promise.js';
import { SNAPSHOT_RETRY_DELAY, SNAPSHOT_RETRY_MAX } from '../common/config.js';
import { PriceOracleRow, updateChainIds, updatePriceOracleRows, updateVaultIds } from './ids.js';
import { LpBreakdown } from './beefy-api/types.js';

const logger = getLoggerFor('snapshot');

async function performUpdate() {
  const nextSnapshot = getNextSnapshot();
  logger.info('Performing snapshot for %d...', nextSnapshot);

  // All or nothing fetch
  const cacheBuster = nextSnapshot.toString();
  const [
    priceResponse,
    lbBreakdownResponse,
    apyResponse,
    tvlResponse,
    vaultsResponse,
    govVaultsResponse,
    cowVaultsResponse,
  ] = await Promise.all([
    getPrices(cacheBuster),
    getLpBreakdown(cacheBuster),
    getApys(cacheBuster),
    getTvls(cacheBuster),
    getVaults(cacheBuster),
    getGovVaults(cacheBuster),
    getCowVaults(cacheBuster),
  ]);

  // Remove invalid data / transform to same format
  const priceData = transformPrices(priceResponse);
  const lpData = transformLpBreakdownToPrices(lbBreakdownResponse);
  const lbBreakdownData = transformLpBreakdown(lbBreakdownResponse);
  const apyData = transformApy(apyResponse);
  const tvlData = transformTvl(tvlResponse);
  const vaultsByChain = transformVaults(
    vaultsResponse,
    govVaultsResponse,
    cowVaultsResponse,
    tvlData
  );

  const priceOracleRows = createPriceOracleData(
    Object.keys(priceData).concat(Object.keys(lpData)),
    lbBreakdownData
  );

  // Get vault and oracle ids
  const [vaultIds, oracleData, chainIds] = await Promise.all([
    updateVaultIds(Object.keys(apyData).concat(Object.keys(tvlData))),
    updatePriceOracleRows(Object.values(priceOracleRows)),
    updateChainIds(Object.keys(vaultsByChain)),
  ]);

  // All or nothing insert
  const builder = getQueryBuilder();
  await builder.transaction(async trx => {
    await Promise.all([
      insertOracleData(trx, 'prices', nextSnapshot, priceData, oracleData),
      insertOracleData(trx, 'prices', nextSnapshot, lpData, oracleData),
      insertOracleLpBreakdownData(trx, 'lp_breakdowns', nextSnapshot, lbBreakdownData, oracleData),
      insertVaultIdData(trx, 'apys', nextSnapshot, apyData, vaultIds),
      insertVaultIdData(trx, 'tvls', nextSnapshot, tvlData, vaultIds),
      insertTvlByChainData(trx, 'tvl_by_chain', nextSnapshot, vaultsByChain, chainIds),
    ]);
  });

  logger.info('Done.');
}

export function performScheduledUpdate() {
  performUpdateWithRetries().catch(e => logger.error(e));
}

export async function performUpdateWithRetries(
  maxRetries: number = SNAPSHOT_RETRY_MAX,
  delay: number = SNAPSHOT_RETRY_DELAY
) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await performUpdate();
      return;
    } catch (e) {
      retries++;
      logger.error(
        e,
        `[%d/%d] Failed to update snapshot, retrying in %ds...`,
        retries,
        maxRetries,
        delay
      );
      await sleep(delay * 1000);
    }
  }

  throw new Error(`Failed to update snapshot after ${maxRetries} retries`);
}

async function insertOracleData(
  builder: Knex,
  table: 'prices',
  snapshot: number,
  data: Record<number, number>,
  oracleRows: Record<string, PriceOracleRow>
) {
  const snapshotTimestamp = unixToTimestamp(snapshot);

  await builder.table(table).insert(
    Object.entries(data).map(([oracle_id, val]) => ({
      oracle_id: oracleRows[oracle_id]?.id, // map string to numeric id
      t: snapshotTimestamp,
      val,
    }))
  );
}

async function insertVaultIdData(
  builder: Knex,
  table: 'apys' | 'tvls',
  snapshot: number,
  data: Record<number, number>,
  vaultIds: Record<string, number>
) {
  const snapshotTimestamp = unixToTimestamp(snapshot);

  await builder.table(table).insert(
    Object.entries(data).map(([vault_id, val]) => ({
      vault_id: vaultIds[vault_id], // map string to numeric id
      t: snapshotTimestamp,
      val,
    }))
  );
}

async function insertOracleLpBreakdownData(
  builder: Knex,
  table: 'lp_breakdowns',
  snapshot: number,
  data: Record<number, LpBreakdown>,
  oracleRows: Record<string, PriceOracleRow>
) {
  const snapshotTimestamp = unixToTimestamp(snapshot);

  await builder.table(table).insert(
    Object.entries(data).map(([oracle_id, val]) => ({
      oracle_id: oracleRows[oracle_id]?.id, // map string to numeric id
      t: snapshotTimestamp,
      balances: val.balances,
      total_supply: parseFloat(val.totalSupply),
    }))
  );
}

async function insertTvlByChainData(
  builder: Knex,
  table: 'tvl_by_chain',
  snapshot: number,
  data: Record<string, { total_tvl: number; clm_tvl: number; vault_tvl: number; gov_tvl: number }>,
  chainIds: Record<string, number>
) {
  const snapshotTimestamp = unixToTimestamp(snapshot);

  await builder.table(table).insert(
    Object.entries(data).map(([chainId, val]) => ({
      chain_id: chainIds[chainId], // map string to numeric id
      t: snapshotTimestamp,
      ...val,
    }))
  );
}
