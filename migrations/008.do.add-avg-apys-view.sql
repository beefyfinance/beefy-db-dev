CREATE MATERIALIZED VIEW apys_agg_mv AS
SELECT
    vault_id,
    COALESCE(AVG(val::numeric) FILTER (WHERE t >= now() - INTERVAL '7 days')::double precision, 0) AS avg_7d,
    COALESCE(AVG(val::numeric) FILTER (WHERE t >= now() - INTERVAL '30 days')::double precision, 0) AS avg_30d,
    COALESCE(AVG(val::numeric) FILTER (WHERE t >= now() - INTERVAL '90 days')::double precision, 0) AS avg_90d
FROM apys
GROUP BY vault_id;