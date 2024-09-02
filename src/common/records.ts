export type OracleIdRecord = {
  oracle_id: number;
  t: string;
  val: number;
};

export type VaultIdRecord = {
  vault_id: number;
  t: string;
  val: number;
};

export type LpBreakdownRecord = {
  oracle_id: number;
  t: string;
  balances: string[];
  total_supply: number;
};

export type TvlByChainRecord = {
  chain_id: number;
  t: string;
  total: number;
  vault: number;
  gov: number;
  clm: number;
};
