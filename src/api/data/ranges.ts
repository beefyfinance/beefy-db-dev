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
      SELECT EXTRACT(EPOCH FROM MIN(a.t))::integer as min, EXTRACT(EPOCH FROM MAX(a.t))::integer as max
      FROM apys a
      WHERE a.vault_id = $1
      UNION ALL
      SELECT EXTRACT(EPOCH FROM MIN(t.t))::integer as min, EXTRACT(EPOCH FROM MAX(t.t))::integer as max
      FROM tvls t
      WHERE t.vault_id = $1
      UNION ALL
      SELECT EXTRACT(EPOCH FROM MIN(p.t))::integer as min, EXTRACT(EPOCH FROM MAX(p.t))::integer as max
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
