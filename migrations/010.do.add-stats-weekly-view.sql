-- weekly aggregate harvests/revenue/buyback stats, Monday-Sunday UTC, limited to 1 year
CREATE MATERIALIZED VIEW stats_weekly AS

WITH bifi_buyback_weekly
         AS (SELECT DATE_TRUNC('week', bb.txn_timestamp, 'UTC') AS week,
                    SUM(bb.bifi_amount)                         AS total_amount,
                    AVG(bb.bifi_price)                          AS avg_price,
                    SUM(bb.buyback_total)                       AS total_usd
             FROM bifi_buyback bb
             WHERE bb.txn_timestamp >= DATE_TRUNC('week', NOW() - INTERVAL '1 year', 'UTC')
             GROUP BY 1
             ORDER BY 1 DESC),


     harvests_weekly
         AS (SELECT DATE_TRUNC('week', h.txn_timestamp, 'UTC') AS week,
                    SUM(h.harvest_amount * h.want_price)       AS total_usd
             FROM harvests h
             WHERE h.harvest_amount IS NOT NULL
               AND h.want_price IS NOT NULL
               AND h.txn_timestamp IS NOT NULL
               AND h.harvest_amount > 0
               AND h.want_price > 0
               AND h.txn_timestamp >= DATE_TRUNC('week', NOW() - INTERVAL '1 year', 'UTC')
               -- filter some invalid data
               AND h.harvest_amount * h.want_price < 30000000
               AND (h.chain_id, LOWER(h.txn_hash))
                 NOT IN (
                         (43114 /* avax */,
                          '0xfd904cb8742ea0caa10bc8a1475f487a2af885938997ff00dcbc195533961162'),
                         (43114 /* avax */,
                          '0xffe824f13634da2f10daedb3c3cc123fea419e1b03fb6d169e9a98c89a29100e'),
                         (43114 /* avax */,
                          '0x058d86ee2e888dbbf3bcbd20adc71739e6d29feae0074a944dfaad6a892384c3'),
                         (43114 /* avax */,
                          '0x83a4b2356d4d18228d02755ddd13a5b6f932fa8a611620580b6ed8d04320c021'),
                         (10 /* optimism */,
                          '0x079606a933abf8dce650c09da15a065afca30fa34e8c3aa714205d63015031a2'),
                         (10 /* optimism */,
                          '0x5d0538d3c5888cfa803329410df043a289f8cca32563c497e8b9ba835d28a3c7'),
                         (10 /* optimism */,
                          '0xf5db5dff133fee010a2ee689f1fd62a2fb9879d9e34533028daa641ab05a2c4b'),
                         (1 /* ethereum */,
                          '0xec308aaa41bea030e06de958af46179803f96c3c78950b8da2c4912a1775d87a'),
                         (1 /* ethereum */,
                          '0x31b8083e467ed217523655f9b26b71f154fd1358e633b275011123c268a88901'),
                         (1 /* ethereum */,
                          '0x06163765e870e2adfbe047560c62162a9aab772007b313ea2c96827c4277d1d1'),
                         (43114 /* avax */,
                          '0x091c7e4427dedf0c35bf327f2a7d88541667b322036d8935a8e7c276d7a66091'),
                         (8453 /* base */,
                          '0x2d27615057903b479a5c2ba5c2c7a85633563bf36074ac918c6b8c4eaf3f4cc0'),
                         (8453 /* base */,
                          '0xb19cb06de752f37fb548e91f23b0e7fbd94a27bcbb2952c10c431a57694519de')
                       )
             GROUP BY 1
             ORDER BY 1 DESC),

     feebatch_harvests_weekly
         AS (SELECT DATE_TRUNC('week', fh.txn_timestamp, 'UTC') AS week,
                    SUM(fh.harvest_usd)                         AS platform_usd,
                    SUM(fh.treasury_amt)                        AS treasury_usd,
                    SUM(fh.rewardpool_amt)                      AS pool_native
             FROM feebatch_harvests fh
             WHERE fh.treasury_amt IS NOT NULL
               AND fh.harvest_usd IS NOT NULL
               AND fh.harvest_usd > 0
               AND fh.txn_timestamp >= DATE_TRUNC('week', NOW() - INTERVAL '1 year', 'UTC')
             GROUP BY 1
             ORDER BY 1 DESC)

SELECT hw.week,
       hw.total_usd     AS harvests_total_usd,
       bbw.total_amount AS buyback_amount,
       bbw.avg_price    AS buyback_avg_price,
       bbw.total_usd    AS buyback_total_usd,
       fhw.platform_usd AS fees_platform_usd,
       fhw.treasury_usd AS fees_treasury_usd,
       fhw.pool_native  AS fees_pool_native
FROM harvests_weekly hw
         LEFT JOIN bifi_buyback_weekly bbw ON bbw.week = hw.week
         LEFT JOIN feebatch_harvests_weekly fhw ON fhw.week = hw.week
ORDER BY hw.week DESC;