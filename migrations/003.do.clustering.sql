CREATE TABLE tvls_new as (SELECT vault_id, to_timestamp(t)::timestamptz as t, val FROM tvls);
CREATE TABLE apys_new as (SELECT vault_id, to_timestamp(t)::timestamptz as t, val FROM apys);
CREATE TABLE prices_new as (SELECT oracle_id, to_timestamp(t)::timestamptz as t, val FROM prices);
CREATE TABLE tvl_by_chains_new as (SELECT chain_id, to_timestamp(t)::timestamptz as t, total_tvl, clms_tvl, vaults_tvl FROM tvl_by_chains);

ALTER TABLE tvls_new ADD CONSTRAINT tvls_t_pkey PRIMARY KEY(vault_id, t);
ALTER TABLE apys_new ADD CONSTRAINT apys_t_pkey PRIMARY KEY(vault_id, t);
ALTER TABLE prices_new ADD CONSTRAINT prices_t_pkey PRIMARY KEY(oracle_id, t);
ALTER TABLE tvl_by_chains_new ADD CONSTRAINT tvl_by_chains_t_pkey PRIMARY KEY(chain_id, t);

CLUSTER tvls_new USING tvls_t_pkey;
CLUSTER apys_new USING apys_t_pkey;
CLUSTER prices_new USING prices_t_pkey;
CLUSTER tvl_by_chains_new USING tvl_by_chains_t_pkey;

DROP TABLE tvls;
DROP TABLE apys;
DROP TABLE prices;
DROP TABLE tvl_by_chains;

ALTER TABLE tvls_new RENAME TO tvls;
ALTER TABLE apys_new RENAME TO apys;
ALTER TABLE prices_new RENAME TO prices;
ALTER TABLE tvl_by_chains_new RENAME TO tvl_by_chains;

ANALYSE tvls;
ANALYSE apys;
ANALYSE prices;
ANALYSE tvl_by_chains;