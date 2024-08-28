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
import { PriceOracleRow, updatePriceOracleRows, updateVaultIds } from './ids.js';
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
  const vaultsByChain = transformVaults(vaultsResponse, govVaultsResponse, cowVaultsResponse);

  const priceOracleRows = createPriceOracleData(
    Object.keys(priceData).concat(Object.keys(lpData)),
    lbBreakdownData
  );

  // Get vault and oracle ids
  const [vaultIds, oracleData] = await Promise.all([
    updateVaultIds(Object.keys(apyData).concat(Object.keys(tvlData))),
    updatePriceOracleRows(Object.values(priceOracleRows)),
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
      insertTvlByChainData(trx, 'tvl_by_chains', nextSnapshot, tvlData, vaultsByChain),
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
  table: 'tvl_by_chains',
  snapshot: number,
  data: Record<string, number>,
  chainIds: Record<string, { clmIds: string[]; vaultIds: string[] }>
) {
  const snapshotTimestamp = unixToTimestamp(snapshot);

  await builder.table(table).insert(
    Object.keys(chainIds).map(chainId => ({
      chain_id: chainId,
      t: snapshotTimestamp,
      ...getTvlByChainId(data, chainIds[chainId] || { clmIds: [], vaultIds: [] }),
    }))
  );
}

function getTvlByChainId(
  tvlData: Record<string, number>,
  vaultsByChain: { clmIds: string[]; vaultIds: string[] }
) {
  const commonVaultsTvl = vaultsByChain.vaultIds.reduce((acc, vaultId) => {
    acc += tvlData[vaultId] || 0;

    return acc;
  }, 0);

  const clmVaultsTvl = vaultsByChain.clmIds.reduce((acc, clmId) => {
    acc += tvlData[clmId] || 0;

    return acc;
  }, 0);

  return {
    clms_tvl: clmVaultsTvl,
    vaults_tvl: commonVaultsTvl,
    total_tvl: clmVaultsTvl + commonVaultsTvl,
  };
}
