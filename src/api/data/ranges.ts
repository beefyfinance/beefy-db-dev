import { getPool } from '../../common/db.js';

export type Range = {
  min: number;
  max: number;
};

export type Ranges = {
  apys: Range;
  tvls: Range;
  prices: Range;
};

export async function getRanges(vaultId: number, oracleId: number): Promise<Ranges> {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT MIN(a.t) as min, MAX(a.t) as max
      FROM apys a
      WHERE a.vault_id = $1
      UNION ALL
      SELECT MIN(t.t) as min, MAX(t.t) as max
      FROM tvls t
      WHERE t.vault_id = $1
      UNION ALL
      SELECT MIN(p.t) as min, MAX(p.t) as max
      FROM prices p
      WHERE p.oracle_id = $2
  `,
    [vaultId, oracleId]
  );

  return {
    apys: result.rows[0],
    tvls: result.rows[1],
    prices: result.rows[2],
  };
}
