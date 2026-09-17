import { getTigerPool } from '../../../common/tiger-db.js';

// same shape as snapshot/ids.ts getChainIds(), read from Tiger
export async function getChainIds(): Promise<Record<string, number>> {
  const result = await getTigerPool().query('SELECT id, chain_id FROM chain_ids');
  return result.rows.reduce((acc, row) => {
    acc[row.chain_id] = Number(row.id);
    return acc;
  }, {} as Record<string, number>);
}
