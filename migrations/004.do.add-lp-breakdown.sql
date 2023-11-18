ALTER TABLE price_oracles ADD COLUMN tokens TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE lp_breakdowns (
    oracle_id integer NOT NULL REFERENCES price_oracles (id),
    t timestamp with time zone NOT NULL,
    balances DOUBLE PRECISION[],
    total_supply DOUBLE PRECISION
);

ALTER TABLE ONLY lp_breakdowns
    ADD CONSTRAINT lp_breakdowns_t_pkey PRIMARY KEY (oracle_id, t);

ALTER TABLE lp_breakdowns CLUSTER ON lp_breakdowns_t_pkey;
