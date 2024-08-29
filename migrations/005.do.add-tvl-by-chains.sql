-- Create table for mapping string chain id (e.g. "ethereum") to internal integer id
CREATE TABLE chain_ids
(
    id       SERIAL      NOT NULL,
    chain_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
);

-- Ensure the string chain id only appears once
CREATE UNIQUE INDEX idx_chain_ids ON chain_ids (chain_id ASC NULLS LAST);

-- Create table to store TVL by chain over time
CREATE TABLE tvl_by_chain
(
    chain_id  integer                  NOT NULL REFERENCES chain_ids (id),
    t         timestamp with time zone NOT NULL,
    total_tvl DOUBLE PRECISION,
    clm_tvl   DOUBLE PRECISION,
    vault_tvl DOUBLE PRECISION,
    gov_tvl   DOUBLE PRECISION
);

-- Ensure there is only one entry per chain_id/timestamp pair
ALTER TABLE ONLY tvl_by_chain
    ADD CONSTRAINT tvl_by_chain_t_pkey PRIMARY KEY (chain_id, t);