/*
# Need submission: richer structured fields for /submit-need

## Context
NeedSaaS is adding a standalone /submit-need acquisition flow, mirroring
/submit-product. This adds the structured fields the new submission form
collects, so a Need is genuinely useful to a stranger arriving from a
shared link -- who it's for, what industry, what they've already tried,
how much it matters, and (lightly) what kind of solution it might need --
without forcing the person to know or decide any of that up front.

## What this does
1. New `needs` columns, all nullable/defaulted so every existing Need keeps
   rendering unchanged -- the detail page only shows a section when it has
   content:
   - `who_for` -- small fixed set (myself/my_business/my_team/my_customers/other).
   - `industry` -- free text, same pattern as `starter_packs.industry`
     (an open-ended business-type taxonomy, deliberately not the existing
     `categories` table, which classifies *software function*, e.g.
     "Marketing"/"Dev Tools" -- a different axis from *what kind of
     business has this problem*, e.g. "Cleaning" or "Real Estate").
   - `solution_type` -- possible-solution-type suggestion (saas/ai_agent/
     ai_tool/automation/internal_tool/other), editable by the submitter.
     Computed with a simple client-side keyword heuristic, not an AI
     classifier -- per instruction, no sophisticated classification before
     launch. NULL means "not yet classified" (e.g. every pre-existing
     Need), which is a real, meaningful state, not an error state.
   - `current_solution` -- what they use today, optional.
   - `pain_level` -- fixed set (nice_to_have/significant_time_savings/
     important/critical), optional.
   - `desired_outcome` -- what success looks like, optional.
2. No column-privilege GRANT changes needed here, unlike the equivalent
   products migration -- `needs` has never had a column-level lockdown
   (there's no `paid`-style gated column to protect), so a plain
   authenticated INSERT/UPDATE under the existing `needs_insert_own` /
   `needs_update_own` RLS policies already covers these new columns.
3. No new tables. `vote_count` already serves as the "supporters" signal,
   `contributor_count`/`reward_amount` already serve as pledges, and
   `page_views` already accepts `entity_type = 'need'` for view tracking
   (added in the original schema, just not yet called from the Need detail
   page -- wired up in this same pass, see components/need-detail-view.tsx).
   "Time to first builder interest" / "time to solution" are derivable from
   existing timestamps (`needs.created_at`, `builder_interest.created_at`,
   `needs.committed_at`, `needs.status`) without any new column. Share-click
   counts are intentionally not tracked -- no infrastructure for that exists
   for products either, and building it isn't warranted for a soft launch.
*/

ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS who_for text;
ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS needs_who_for_check;
ALTER TABLE public.needs ADD CONSTRAINT needs_who_for_check
  CHECK (who_for IS NULL OR who_for IN ('myself', 'my_business', 'my_team', 'my_customers', 'other'));

ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS industry text;

ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS solution_type text;
ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS needs_solution_type_check;
ALTER TABLE public.needs ADD CONSTRAINT needs_solution_type_check
  CHECK (solution_type IS NULL OR solution_type IN ('saas', 'ai_agent', 'ai_tool', 'automation', 'internal_tool', 'other'));

ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS current_solution text;

ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS pain_level text;
ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS needs_pain_level_check;
ALTER TABLE public.needs ADD CONSTRAINT needs_pain_level_check
  CHECK (pain_level IS NULL OR pain_level IN ('nice_to_have', 'significant_time_savings', 'important', 'critical'));

ALTER TABLE public.needs ADD COLUMN IF NOT EXISTS desired_outcome text;
