CREATE TABLE tvl_by_chains (
    chain_id   integer NOT NULL REFERENCES,
    t timestamp with time zone NOT NULL,
    name VARCHAR(64)      NOT NULL,
    total_tvl DOUBLE PRECISION,
    clms_tvl DOUBLE PRECISION,
    vaults_tvl DOUBLE PRECISION,
    gov_vaults_tvl DOUBLE PRECISION
)

ALTER TABLE ONLY tvl_by_chains
    ADD CONSTRAINT tvl_by_chains_t_pkey PRIMARY KEY (chain_id, t);


CREATE TABLE chain_ids
(
    id        SERIAL      NOT NULL,
    chain_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO chain_ids (chain_id) (SELECT DISTINCT name FROM tvl_by_chains);