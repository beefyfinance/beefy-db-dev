
--
-- TVL Chain Ids
-- 
CREATE TABLE chain_ids
(
    id        SERIAL      NOT NULL,
    chain_id  VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
);

-- Insert unique chain ids from tvl_by_chains table
INSERT INTO chain_ids (chain_id) (SELECT DISTINCT name FROM tvl_by_chains);

CREATE UNIQUE INDEX idx_chain_ids ON chain_ids (chain_id ASC NULLS LAST);

-- Create new tvl_by_chains table with chain_id instead of name
CREATE TABLE tvl_by_chains_new AS SELECT DISTINCT ON (t.t, t.name) c.id as chain_id, t.t, t.total_tvl, t.clms_tvl, t.vaults_tvl FROM tvl_by_chains t INNER JOIN chain_ids c ON c.chain_id = t.name;

-- Add the primary key on chain_id and t
ALTER TABLE tvl_by_chains_new ADD PRIMARY KEY (chain_id, t);

-- Delete the old table
DROP TABLE tvl_by_chains;

ALTER TABLE tvl_by_chains_new RENAME TO tvl_by_chains;

--
-- Price oracles
--

-- New table to store price oracles <-> id mapping
CREATE TABLE price_oracles
(
    id        SERIAL      NOT NULL,
    oracle_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
);

-- Insert unique oracle ids
INSERT INTO price_oracles (oracle_id) (SELECT DISTINCT name FROM prices);

-- oracle_id should be unique
CREATE UNIQUE INDEX idx_price_oracles ON price_oracles (oracle_id ASC NULLS LAST);

-- Create new table with oracle_id instead of name
CREATE TABLE prices_new AS SELECT DISTINCT ON (p.t, p.name) o.id as oracle_id, p.t, p.val FROM prices p INNER JOIN price_oracles o ON o.oracle_id = p.name;

-- Add the primary key on oracle_id and t
ALTER TABLE prices_new ADD PRIMARY KEY (oracle_id, t);

-- Delete the old table
DROP TABLE prices;

-- Rename the new table
ALTER TABLE prices_new RENAME TO prices;

--
-- Vault ids
--

-- New table to store vault id <-> id mapping
CREATE TABLE vault_ids
(
    id        SERIAL      NOT NULL,
    vault_id  VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
);

--
-- TVL vault ids
--

-- Insert unique vault ids from tvls table (still with -chainId)
INSERT INTO vault_ids (vault_id) (SELECT DISTINCT name FROM tvls);

-- temporary non-unique index to speed up the next statement
CREATE INDEX idx_vault_ids_temp ON vault_ids (vault_id ASC NULLS LAST);

-- Create new tvl table with vault_id instead of name
CREATE TABLE tvls_new AS SELECT DISTINCT ON (t.t, t.name) v.id as vault_id, t.t, t.val FROM tvls t INNER JOIN vault_ids v ON v.vault_id = t.name;

-- Add the primary key on vault_id and t
ALTER TABLE tvls_new ADD PRIMARY KEY (vault_id, t);

-- Delete the old table
DROP TABLE tvls;

-- Rename the new table
ALTER TABLE tvls_new RENAME TO tvls;

--
-- Vault ids tidy
--

-- Fix known duplicates
UPDATE vault_ids SET vault_id = 'sushi-poly-btc-eth-old' WHERE vault_id = 'sushi-btc-eth-137';
UPDATE vault_ids SET vault_id = 'sushi-ftm-btc-eth-old' WHERE vault_id = 'sushi-btc-eth-250';
UPDATE vault_ids SET vault_id = 'sushi-poly-eth-dai-old' WHERE vault_id = 'sushi-eth-dai-137';
UPDATE vault_ids SET vault_id = 'sushi-ftm-eth-dai-old' WHERE vault_id = 'sushi-eth-dai-250';

-- Remove the "-{chainId}" from the end of the name of the vault_ids from tvl entries
UPDATE vault_ids SET vault_id = REGEXP_REPLACE(vault_id, '(.*)-([0-9]+)$', '\1');

-- oracle_id should be unique
CREATE UNIQUE INDEX idx_vault_ids ON vault_ids (vault_id ASC NULLS LAST);

-- Remove the temporary index
DROP INDEX idx_vault_ids_temp;

--
-- APY vault ids
--

-- Insert possible missing vault ids from APY table
INSERT INTO vault_ids (vault_id) (SELECT DISTINCT name FROM apys) ON CONFLICT DO NOTHING;

-- Create new apy table with vault_id instead of name
CREATE TABLE apys_new AS SELECT DISTINCT ON (a.t, a.name) v.id as vault_id, a.t, a.val FROM apys a INNER JOIN vault_ids v ON v.vault_id = a.name;

-- Add the primary key on vault_id and t
ALTER TABLE apys_new ADD PRIMARY KEY (vault_id, t);

-- Delete the old table
DROP TABLE apys;

-- Rename the new table
ALTER TABLE apys_new RENAME TO apys;



