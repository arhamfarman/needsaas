/*
# Opportunity Feed: dismissal tracking + ranking function

1. `opportunity_dismissals` — Pro builders can dismiss opportunities
2. `get_opportunity_feed(uuid, int)` — ranks open needs for a builder based on:
   - NeedScore™ (30%)
   - Reward pool (20%)
   - Vote count (15%)
   - Growth rate (15%)
   - Competition level — fewer competing products = higher score (10%)
   - Builder's category affinity — matches their existing software categories (10%)
   The function excludes needs the builder owns, needs they've already built software for,
   and needs they've dismissed.
*/

CREATE TABLE IF NOT EXISTS opportunity_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  need_id uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, need_id)
);
ALTER TABLE opportunity_dismissals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dismissal_select_own" ON opportunity_dismissals;
CREATE POLICY "dismissal_select_own" ON opportunity_dismissals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "dismissal_insert_own" ON opportunity_dismissals;
CREATE POLICY "dismissal_insert_own" ON opportunity_dismissals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "dismissal_delete_own" ON opportunity_dismissals;
CREATE POLICY "dismissal_delete_own" ON opportunity_dismissals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dismissals_user ON opportunity_dismissals (user_id);

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
  SELECT array_agg(DISTINCT category_id) FILTER (WHERE category_id IS NOT NULL)
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
    CASE
      WHEN n.vote_count > 0 THEN LEAST(
        (SELECT count(*)::numeric FROM votes WHERE need_id = n.id AND created_at > now() - interval '7 days') / n.vote_count,
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
    -- Match score (0-100)
    (
      -- NeedScore (30%)
      (COALESCE(n.need_score, 0) / 100.0) * 30 +
      -- Reward pool (20%, capped at $5000)
      LEAST(COALESCE(n.reward_amount, 0) / 5000.0, 1.0) * 20 +
      -- Vote count (15%, log scale capped at 500)
      (LN(GREATEST(LEAST(n.vote_count, 500), 1)::numeric) / LN(500)) * 15 +
      -- Growth rate (15%)
      CASE
        WHEN n.vote_count > 0 THEN LEAST(
          (SELECT count(*)::numeric FROM votes WHERE need_id = n.id AND created_at > now() - interval '7 days') / n.vote_count,
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
    SELECT count(*) AS interest_count
    FROM builder_interest WHERE need_id = n.id
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
    AND NOT EXISTS (
      SELECT 1 FROM opportunity_dismissals
      WHERE user_id = builder_uuid AND need_id = n.id
    )
  ORDER BY
    -- Category matches first, then by match_score
    (v_builder_categories IS NOT NULL AND n.category_id = ANY(v_builder_categories)) DESC,
    match_score DESC,
    n.need_score DESC,
    n.vote_count DESC,
    n.reward_amount DESC
  LIMIT LEAST(limit_count, 100);
END;
$$;

GRANT EXECUTE ON FUNCTION get_opportunity_feed(uuid, int) TO authenticated;
