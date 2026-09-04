/*
# Fix: get_opportunity_feed() fails on every call (ambiguous column references)

Root cause: get_opportunity_feed()'s RETURNS TABLE declares output columns
(need_id, category_id, created_at, match_score, ...). Inside a plpgsql
function these output columns are also implicitly usable as variables, so
any BARE (unqualified) reference to a name that is *both* one of those
output columns *and* a real column on a table in scope is rejected by
Postgres as ambiguous (error 42702) -- this is what Phase 6 QA hit.

This migration re-creates the function with every such reference fully
qualified by table name. It changes no scoring weights, no ranking logic,
no Pro gating, and no return type -- CREATE OR REPLACE FUNCTION with an
identical signature and RETURNS TABLE list, so every existing caller
(components/opportunity-feed.tsx via supabase.rpc('get_opportunity_feed',
...)) keeps working unchanged.

Confirmed ambiguous/broken references (verified against the real schema
in 20260804114937_create_needsaas_schema.sql.sql and
20260806081533_add_build_rewards_tables.sql before writing this fix):

1. `category_id` in the builder-categories lookup (products.category_id
   vs. the output column) -- this is the one Phase 6 QA's direct RPC call
   surfaced as the reported 42702 error.
2. `need_id` and `created_at` in the 7-day vote-growth subquery
   (votes.need_id / votes.created_at vs. the output columns), duplicated
   in two places: the growth_rate output column and the match_score
   formula.
3. `need_id` in the builder_interest lateral subquery
   (builder_interest.need_id vs. the output column).
4. `need_id` in the opportunity_dismissals exclusion subquery
   (opportunity_dismissals.need_id vs. the output column).

All four are the *same* class of bug as the one QA reported -- they were
undiscovered only because plpgsql raises one error at a time and
execution never got past #1 to reach #2-4. Fixing only #1 (the
originally documented "one-line" fix) would still leave the function
broken on its very next statement.

A fifth, related-but-different defect was also found and fixed here:
`ORDER BY match_score DESC` (no table in this query has a column named
match_score, so this is *not* a parse-time ambiguity) silently resolves
to the function's uninitialized `match_score` OUT variable instead of
the per-row computed score, meaning the query would have run without
error but never actually sorted by its own composite ranking formula.
Fixed by inlining the identical match_score expression (same weights,
same formula, just written out instead of referenced by a name that
never bound to it) directly in ORDER BY.
*/

CREATE OR REPLACE FUNCTION get_opportunity_feed(builder_uuid uuid, limit_count int DEFAULT 20)
RETURNS TABLE (
  need_id uuid,
  title text,
  description text,
  category_id uuid,
  category_name text,
  category_slug text,
  vote_count int,
  reward_amount numeric,
  contributor_count int,
  need_score numeric,
  need_score_trend text,
  status text,
  builder_interest_count bigint,
  growth_rate numeric,
  competition_level text,
  competing_products int,
  match_score numeric,
  match_reasons text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_builder_categories uuid[];
  v_recent_votes int;
  v_total_votes int;
  v_growth numeric;
  v_competing int;
  v_competition_level text;
  v_category_match boolean;
  v_reasons text[];
  v_match_score numeric;
  v_has_existing boolean;
BEGIN
  -- Get builder's categories from their published products
  -- FIX: qualify category_id -- was ambiguous against the function's own
  -- "category_id" output column (error 42702, the bug QA reported).
  SELECT array_agg(DISTINCT products.category_id) FILTER (WHERE products.category_id IS NOT NULL)
  INTO v_builder_categories
  FROM products WHERE owner_id = builder_uuid AND paid = true;

  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.description,
    n.category_id,
    c.name,
    c.slug,
    n.vote_count,
    n.reward_amount,
    n.contributor_count,
    n.need_score,
    n.need_score_trend,
    n.status,
    COALESCE(bi.interest_count, 0),
    -- Growth rate: votes in last 7 days as fraction of total
    -- FIX: qualify votes.need_id / votes.created_at -- both were ambiguous
    -- against this function's own output columns of the same names.
    CASE
      WHEN n.vote_count > 0 THEN LEAST(
        (SELECT count(*)::numeric FROM votes WHERE votes.need_id = n.id AND votes.created_at > now() - interval '7 days') / n.vote_count,
        1.0
      )
      ELSE 0
    END,
    -- Competition level
    CASE
      WHEN COALESCE(comp.comp_count, 0) = 0 THEN 'None'
      WHEN COALESCE(comp.comp_count, 0) = 1 THEN 'Low'
      WHEN COALESCE(comp.comp_count, 0) <= 3 THEN 'Medium'
      ELSE 'High'
    END,
    COALESCE(comp.comp_count, 0),
    -- Match score (0-100) -- weights unchanged from the original function
    (
      -- NeedScore (30%)
      (COALESCE(n.need_score, 0) / 100.0) * 30 +
      -- Reward pool (20%, capped at $5000)
      LEAST(COALESCE(n.reward_amount, 0) / 5000.0, 1.0) * 20 +
      -- Vote count (15%, log scale capped at 500)
      (LN(GREATEST(LEAST(n.vote_count, 500), 1)::numeric) / LN(500)) * 15 +
      -- Growth rate (15%) -- FIX: same votes.need_id / votes.created_at qualification as above
      CASE
        WHEN n.vote_count > 0 THEN LEAST(
          (SELECT count(*)::numeric FROM votes WHERE votes.need_id = n.id AND votes.created_at > now() - interval '7 days') / n.vote_count,
          1.0
        ) * 15
        ELSE 0
      END +
      -- Competition (10%): fewer competitors = higher score
      (1.0 - LEAST(COALESCE(comp.comp_count, 0)::numeric / 5.0, 1.0)) * 10 +
      -- Category affinity (10%)
      CASE
        WHEN v_builder_categories IS NOT NULL AND n.category_id = ANY(v_builder_categories) THEN 10
        ELSE 0
      END
    ),
    -- Match reasons (built as comma-separated text)
    CASE
      WHEN v_builder_categories IS NOT NULL AND n.category_id = ANY(v_builder_categories)
        THEN 'Matches your category expertise'
      ELSE NULL
    END,
    n.created_at
  FROM needs n
  LEFT JOIN categories c ON c.id = n.category_id
  LEFT JOIN LATERAL (
    SELECT count(*) AS comp_count
    FROM need_product_links npl
    JOIN products p ON p.id = npl.product_id
    WHERE npl.need_id = n.id AND p.paid = true
  ) comp ON true
  LEFT JOIN LATERAL (
    -- FIX: qualify builder_interest.need_id -- was ambiguous against this
    -- function's own "need_id" output column.
    SELECT count(*) AS interest_count
    FROM builder_interest WHERE builder_interest.need_id = n.id
  ) bi ON true
  WHERE n.status IN ('open', 'committed')
    -- Exclude needs owned by the builder
    AND n.owner_id != builder_uuid
    -- Exclude needs the builder has already linked a product to
    AND NOT EXISTS (
      SELECT 1 FROM need_product_links npl
      WHERE npl.need_id = n.id AND npl.owner_id = builder_uuid
    )
    -- Exclude dismissed needs
    -- FIX: qualify opportunity_dismissals.need_id -- was ambiguous against
    -- this function's own "need_id" output column.
    AND NOT EXISTS (
      SELECT 1 FROM opportunity_dismissals
      WHERE user_id = builder_uuid AND opportunity_dismissals.need_id = n.id
    )
  ORDER BY
    -- Category matches first, then by match_score
    (v_builder_categories IS NOT NULL AND n.category_id = ANY(v_builder_categories)) DESC,
    -- FIX: "match_score" here is not a real column of this query (no AS
    -- alias was ever given to the expression below), so it silently
    -- resolved to this function's *uninitialized* match_score OUT
    -- variable (always NULL) rather than the per-row computed score --
    -- not a parse error, so it never surfaced as one, but it meant the
    -- primary ranking key was silently a no-op. Inlining the identical
    -- formula (same weights) makes the sort actually use the real value.
    (
      (COALESCE(n.need_score, 0) / 100.0) * 30 +
      LEAST(COALESCE(n.reward_amount, 0) / 5000.0, 1.0) * 20 +
      (LN(GREATEST(LEAST(n.vote_count, 500), 1)::numeric) / LN(500)) * 15 +
      CASE
        WHEN n.vote_count > 0 THEN LEAST(
          (SELECT count(*)::numeric FROM votes WHERE votes.need_id = n.id AND votes.created_at > now() - interval '7 days') / n.vote_count,
          1.0
        ) * 15
        ELSE 0
      END +
      (1.0 - LEAST(COALESCE(comp.comp_count, 0)::numeric / 5.0, 1.0)) * 10 +
      CASE
        WHEN v_builder_categories IS NOT NULL AND n.category_id = ANY(v_builder_categories) THEN 10
        ELSE 0
      END
    ) DESC,
    n.need_score DESC,
    n.vote_count DESC,
    n.reward_amount DESC
  LIMIT LEAST(limit_count, 100);
END;
$$;

GRANT EXECUTE ON FUNCTION get_opportunity_feed(uuid, int) TO authenticated;
