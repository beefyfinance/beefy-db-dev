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

export async function getRanges(vault: string, oracle: string): Promise<Ranges> {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT MIN(a.t) as min, MAX(a.t) as max
      FROM apys a
      WHERE a.name = $1
      UNION ALL
      SELECT MIN(t.t) as min, MAX(t.t) as max
      FROM tvls t
      WHERE t.name = $1
      UNION ALL
      SELECT MIN(p.t) as min, MAX(p.t) as max
      FROM prices p
      WHERE p.name = $2
  `,
    [vault, oracle]
  );

  return {
    apys: result.rows[0],
    tvls: result.rows[1],
    prices: result.rows[2],
  };
}
