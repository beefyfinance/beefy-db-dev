CREATE TABLE IF NOT EXISTS apys
(
    id   SERIAL,
    t    BIGINT           NOT NULL,
    name VARCHAR(64)      NOT NULL,
    val  DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS prices
(
    id   SERIAL,
    t    BIGINT           NOT NULL,
    name VARCHAR(64)      NOT NULL,
    val  DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tvls
(
    id   SERIAL,
    t    BIGINT           NOT NULL,
    name VARCHAR(64)      NOT NULL,
    val  DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS apys_t_idx ON apys (t);
CREATE INDEX IF NOT EXISTS prices_t_idx ON prices (t);
CREATE INDEX IF NOT EXISTS tvls_t_idx ON tvls (t);

CREATE INDEX IF NOT EXISTS apys_name_idx ON apys (name);
CREATE INDEX IF NOT EXISTS prices_name_idx ON prices (name);
CREATE INDEX IF NOT EXISTS tvls_name_idx ON tvls (name);