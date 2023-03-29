CREATE TABLE tvls_new as (SELECT vault_id, to_timestamp(t)::timestamptz as t, val FROM tvls);
CREATE TABLE apys_new as (SELECT vault_id, to_timestamp(t)::timestamptz as t, val FROM apys);
CREATE TABLE prices_new as (SELECT oracle_id, to_timestamp(t)::timestamptz as t, val FROM prices);

ALTER TABLE tvls_new ADD CONSTRAINT tvls_t_pkey PRIMARY KEY(vault_id, t);
ALTER TABLE apys_new ADD CONSTRAINT apys_t_pkey PRIMARY KEY(vault_id, t);
ALTER TABLE prices_new ADD CONSTRAINT prices_t_pkey PRIMARY KEY(oracle_id, t);

CLUSTER tvls_new USING tvls_t_pkey;
CLUSTER apys_new USING apys_t_pkey;
CLUSTER prices_new USING prices_t_pkey;

DROP TABLE tvls;
DROP TABLE apys;
DROP TABLE prices;

ALTER TABLE tvls_new RENAME TO tvls;
ALTER TABLE apys_new RENAME TO apys;
ALTER TABLE prices_new RENAME TO prices;

ANALYSE tvls;
ANALYSE apys;
ANALYSE prices;