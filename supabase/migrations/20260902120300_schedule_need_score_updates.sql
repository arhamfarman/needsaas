/*
# Schedule periodic NeedScore recalculation

## Problem
`calculate_need_score()` / `update_need_scores()` were added by
needscore_analytics_functions.sql.sql but nothing ever calls
`update_need_scores()` — no cron job, no trigger. Every need's `need_score`
sits frozen at its default (0) forever.

## Fix
Use pg_cron (available on Supabase-hosted Postgres) to run
`update_need_scores()` every 15 minutes. This is additive and safe to
re-run: `cron.schedule` upserts by job name.

If pg_cron isn't enabled on this project, this migration will fail on the
CREATE EXTENSION line — in that case enable "pg_cron" from the Supabase
Dashboard under Database > Extensions and re-run just this file.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule(
  'update-need-scores',
  '*/15 * * * *',
  $$SELECT public.update_need_scores();$$
);
