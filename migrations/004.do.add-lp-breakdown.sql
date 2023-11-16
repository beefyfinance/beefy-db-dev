
CREATE TABLE lp_breakdowns (
    vault_id integer NOT NULL,
    t timestamp with time zone NOT NULL,
    balances DOUBLE PRECISION[] -- sorted by token address
);

ALTER TABLE ONLY lp_breakdowns
    ADD CONSTRAINT lp_breakdowns_t_pkey PRIMARY KEY (vault_id, t);

ALTER TABLE lp_breakdowns CLUSTER ON lp_breakdowns_t_pkey;
