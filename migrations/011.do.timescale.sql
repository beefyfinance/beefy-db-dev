-- TimescaleDB layer for the time-series tables: hypertables, compression, the apys_daily aggregate and apys_agg_mv.
-- Every piece is skipped when it already exists, and everything is skipped when TimescaleDB is not installed
-- (the extension is never installed from here). One statement, so a failure leaves nothing behind.
DO
$migration$
DECLARE
    tb          text;
    seg         text;
    hypertables constant text[][] := ARRAY [
        ['prices', 'oracle_id'],
        ['lp_breakdowns', 'oracle_id'],
        ['tvls', 'vault_id'],
        ['apys', 'vault_id'],
        ['tvl_by_chain', 'chain_id']];
    i           int;
BEGIN
    IF NOT EXISTS (SELECT FROM pg_extension WHERE extname = 'timescaledb') THEN
        RAISE NOTICE '011: TimescaleDB is not installed in this database, nothing to do';
        RETURN;
    END IF;

    -- 1. Hypertables: 30-day chunks, compressed after 35 days
    FOR i IN 1 .. array_length(hypertables, 1)
        LOOP
            tb := hypertables[i][1];
            seg := hypertables[i][2];

            -- existing rows move into chunks; no index on t, the (id, t) primary key is enough
            IF EXISTS (SELECT
                       FROM timescaledb_information.hypertables
                       WHERE hypertable_schema = 'public'
                         AND hypertable_name = tb) THEN
                RAISE NOTICE '011: % is already a hypertable, skipped', tb;
            ELSE
                PERFORM create_hypertable(format('public.%I', tb)::regclass, 't',
                                          chunk_time_interval => INTERVAL '30 days',
                                          if_not_exists => TRUE,
                                          migrate_data => TRUE,
                                          create_default_indexes => FALSE);
                RAISE NOTICE '011: % converted to a hypertable', tb;
            END IF;

            -- one segment per oracle / vault / chain, newest first
            IF (SELECT compression_enabled
                FROM timescaledb_information.hypertables
                WHERE hypertable_schema = 'public'
                  AND hypertable_name = tb) THEN
                RAISE NOTICE '011: compression is already configured on %, skipped', tb;
            ELSE
                EXECUTE format(
                        'ALTER TABLE public.%I SET (timescaledb.compress, timescaledb.compress_segmentby = %L, timescaledb.compress_orderby = %L)',
                        tb, seg, 't DESC');
                RAISE NOTICE '011: compression configured on %', tb;
            END IF;

            IF EXISTS (SELECT
                       FROM timescaledb_information.jobs
                       WHERE proc_name = 'policy_compression'
                         AND hypertable_schema = 'public'
                         AND hypertable_name = tb) THEN
                RAISE NOTICE '011: % already has a compression policy, skipped', tb;
            ELSE
                PERFORM add_compression_policy(format('public.%I', tb)::regclass, compress_after => INTERVAL '35 days',
                                               if_not_exists => TRUE);
                RAISE NOTICE '011: compression policy added on %', tb;
            END IF;
        END LOOP;

    -- 2. apys_daily: sum and count of APY samples per vault and day
    IF EXISTS (SELECT
               FROM timescaledb_information.continuous_aggregates
               WHERE view_schema = 'public'
                 AND view_name = 'apys_daily') THEN
        RAISE NOTICE '011: apys_daily already exists, skipped';
    ELSE
        CREATE MATERIALIZED VIEW public.apys_daily
            WITH (timescaledb.continuous, timescaledb.materialized_only = FALSE) AS
        SELECT vault_id,
               time_bucket('1 day', t) AS day,
               sum(val::numeric)       AS sum_val,
               count(val)              AS n
        FROM public.apys
        GROUP BY vault_id, time_bucket('1 day', t)
        WITH NO DATA;
        RAISE NOTICE '011: apys_daily created';
    END IF;

    IF (SELECT compression_enabled
        FROM timescaledb_information.continuous_aggregates
        WHERE view_schema = 'public'
          AND view_name = 'apys_daily') THEN
        RAISE NOTICE '011: compression is already configured on apys_daily, skipped';
    ELSE
        ALTER MATERIALIZED VIEW public.apys_daily SET (timescaledb.compress = TRUE);
        RAISE NOTICE '011: compression configured on apys_daily';
    END IF;

    IF EXISTS (SELECT
               FROM timescaledb_information.jobs
               WHERE proc_name = 'policy_compression'
                 AND hypertable_schema = 'public'
                 AND hypertable_name = 'apys_daily') THEN
        RAISE NOTICE '011: apys_daily already has a compression policy, skipped';
    ELSE
        PERFORM add_compression_policy('public.apys_daily'::regclass, compress_after => INTERVAL '40 days',
                                       if_not_exists => TRUE);
        RAISE NOTICE '011: compression policy added on apys_daily';
    END IF;

    IF EXISTS (SELECT
               FROM timescaledb_information.jobs
               WHERE proc_name = 'policy_refresh_continuous_aggregate'
                 AND hypertable_schema = 'public'
                 AND hypertable_name = 'apys_daily') THEN
        RAISE NOTICE '011: apys_daily already has a refresh policy, skipped';
    ELSE
        PERFORM add_continuous_aggregate_policy('public.apys_daily'::regclass,
                                                start_offset => INTERVAL '3 days',
                                                end_offset => INTERVAL '0',
                                                schedule_interval => INTERVAL '1 hour',
                                                if_not_exists => TRUE);
        RAISE NOTICE '011: refresh policy added on apys_daily';
    END IF;

    -- 3. apys_agg_mv over apys_daily, replacing the full-scan version from 008; windows are whole UTC days
    IF EXISTS (SELECT
               FROM pg_matviews
               WHERE schemaname = 'public'
                 AND matviewname = 'apys_agg_mv'
                 AND definition LIKE '%apys_daily%') THEN
        RAISE NOTICE '011: apys_agg_mv already reads apys_daily, skipped';
    ELSE
        DROP MATERIALIZED VIEW IF EXISTS public.apys_agg_mv;
        CREATE MATERIALIZED VIEW public.apys_agg_mv AS
        WITH d AS (SELECT vault_id,
                          sum(sum_val) FILTER (WHERE day >= date_trunc('day', now(), 'UTC') - INTERVAL '6 days')  AS s7,
                          sum(n) FILTER (WHERE day >= date_trunc('day', now(), 'UTC') - INTERVAL '6 days')        AS n7,
                          sum(sum_val) FILTER (WHERE day >= date_trunc('day', now(), 'UTC') - INTERVAL '29 days') AS s30,
                          sum(n) FILTER (WHERE day >= date_trunc('day', now(), 'UTC') - INTERVAL '29 days')       AS n30,
                          sum(sum_val)                                                                     AS s90,
                          sum(n)                                                                           AS n90
                   FROM public.apys_daily
                   WHERE day >= date_trunc('day', now(), 'UTC') - INTERVAL '89 days'
                   GROUP BY vault_id),
             all_vaults AS (SELECT DISTINCT vault_id FROM public.apys_daily)
        SELECT v.vault_id,
               COALESCE((d.s7 / NULLIF(d.n7, 0))::double precision, 0)   AS avg_7d,
               COALESCE((d.s30 / NULLIF(d.n30, 0))::double precision, 0) AS avg_30d,
               COALESCE((d.s90 / NULLIF(d.n90, 0))::double precision, 0) AS avg_90d
        FROM all_vaults v
                 LEFT JOIN d USING (vault_id);
        RAISE NOTICE '011: apys_agg_mv rebuilt on top of apys_daily';
    END IF;

    -- needed for REFRESH ... CONCURRENTLY
    IF EXISTS (SELECT
               FROM pg_indexes
               WHERE schemaname = 'public'
                 AND tablename = 'apys_agg_mv'
                 AND indexname = 'apys_agg_mv_vault_id_idx') THEN
        RAISE NOTICE '011: apys_agg_mv_vault_id_idx already exists, skipped';
    ELSE
        CREATE UNIQUE INDEX apys_agg_mv_vault_id_idx ON public.apys_agg_mv (vault_id);
        RAISE NOTICE '011: apys_agg_mv_vault_id_idx created';
    END IF;
END
$migration$;
