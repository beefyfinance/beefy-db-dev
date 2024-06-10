import { getPool, getQueryBuilder } from '../common/db.js';
import { keyBy, uniq, uniqBy } from 'lodash-es';

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

export type PriceOracleRow = {
  id: number;
  oracle_id: string;
  tokens: string[];
};
export type PriceOracleRowData = Omit<PriceOracleRow, 'id'>;

export async function updatePriceOracleRows(
  oracleData: PriceOracleRowData[]
): Promise<Record<string, PriceOracleRow>> {
  const existingMap = await getPriceOraclesRows();
  const newOracleRows = uniqBy(oracleData, r => r.oracle_id).filter(r => !existingMap[r.oracle_id]);

  // we temporarily need to update existing rows in the database
  // to add the tokens field
  // TODO: remove that bit after the next snapshot
  const rowsToUpdate = oracleData
    .map(r => {
      const existingRow = existingMap[r.oracle_id];
      if (!existingRow) {
        return null;
      }
      if (existingRow.tokens.length === 0) {
        return { ...existingRow, tokens: r.tokens };
      }
      if (existingRow.tokens.length !== r.tokens.length) {
        // new tokens can be added but not changed or removed
        for (let i = 0; i < existingRow.tokens.length; i++) {
          if (existingRow.tokens[i] !== r.tokens[i]) {
            throw new Error(`Price oracle tokens mismatch for ${r.oracle_id} at index ${i}`);
          }
        }

        // if we got here, we only are adding tokens to the list
        // so we can update the row. Existing data will still be interpretable
        return { ...existingRow, tokens: r.tokens };
      }
      return null;
    })
    .filter(r => r) as PriceOracleRow[];

  if (rowsToUpdate.length > 0) {
    const builder = await getQueryBuilder();
    for (const row of rowsToUpdate) {
      await builder.table('price_oracles').where('id', row.id).update({
        tokens: row.tokens,
      });
    }
  }

  if (newOracleRows.length === 0) {
    return existingMap;
  }

  await insertPriceOracleRows(newOracleRows);

  return getPriceOraclesRows();
}

async function getPriceOraclesRows(): Promise<Record<string, PriceOracleRow>> {
  const pool = getPool();
  const result = await pool.query<PriceOracleRow>(`
    SELECT id, oracle_id, tokens
    FROM price_oracles
  `);
  return keyBy(result.rows, 'oracle_id');
}

async function insertPriceOracleRows(oracleData: PriceOracleRowData[]): Promise<void> {
  const builder = await getQueryBuilder();
  await builder.table('price_oracles').insert(
    oracleData.map(rowData => ({
      oracle_id: rowData.oracle_id,
      tokens: rowData.tokens,
    }))
  );
}
