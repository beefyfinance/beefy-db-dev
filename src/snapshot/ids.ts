import { getPool, getQueryBuilder } from '../common/db.js';
import { uniq } from 'lodash-es';

export async function updateVaultIds(vault_ids: string[]): Promise<Record<string, number>> {
  const existingMap = await getVaultIds();
  const newVaultIds = uniq(vault_ids).filter(vault_id => !existingMap[vault_id]);

  if (newVaultIds.length === 0) {
    return existingMap;
  }

  await insertVaultIds(newVaultIds);

  return getVaultIds();
}

async function getVaultIds(): Promise<Record<string, number>> {
  const pool = getPool();
  const result = await pool.query(`SELECT id, vault_id
                                   FROM vault_ids`);
  return result.rows.reduce((acc, row) => {
    acc[row.vault_id] = Number(row.id);
    return acc;
  }, {} as Record<string, number>);
}

async function insertVaultIds(vault_ids: string[]): Promise<void> {
  const builder = await getQueryBuilder();
  await builder.table('vault_ids').insert(vault_ids.map(vault_id => ({ vault_id })));
}

export async function updateOracleIds(oracle_ids: string[]): Promise<Record<string, number>> {
  const existingMap = await getOracleIds();
  const newOracleIds = uniq(oracle_ids).filter(oracle_id => !existingMap[oracle_id]);

  if (newOracleIds.length === 0) {
    return existingMap;
  }

  await insertOracleIds(newOracleIds);

  return getOracleIds();
}

async function getOracleIds(): Promise<Record<string, number>> {
  const pool = getPool();
  const result = await pool.query(`SELECT id, oracle_id
                                   FROM price_oracles`);
  return result.rows.reduce((acc, row) => {
    acc[row.oracle_id] = Number(row.id);
    return acc;
  }, {} as Record<string, number>);
}

async function insertOracleIds(oracle_ids: string[]): Promise<void> {
  const builder = await getQueryBuilder();
  await builder.table('price_oracles').insert(oracle_ids.map(oracle_id => ({ oracle_id })));
}
