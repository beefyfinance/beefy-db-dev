-- This should have been in 005 which can't be modified now it was applied in prod
SELECT SETVAL(pg_get_serial_sequence('chain_ids', 'id'), (SELECT MAX(id) FROM chain_ids));
