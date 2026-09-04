/*
# Fix: get_opportunity_feed() return-type mismatch on match_score

Discovered during live post-fix verification of migration 20260904100100
(which fixed the column-16 int/bigint mismatch). Once that was resolved,
the RETURN QUERY statement's type check reached column 17 for the first
time and failed with a third, previously-unreachable error:

  42804: "structure of query does not match function result type"
  "Returned type double precision does not match expected type numeric
   in column 17"

Column 17 is `match_score`, declared `numeric`. The vote-count log-scale
term is:

  LN(GREATEST(LEAST(n.vote_count, 500), 1)::numeric) / LN(500)

The first LN() call is explicitly cast to numeric, so it resolves to the
ln(numeric) overload. The second, `LN(500)`, has no cast -- Postgres has
both ln(numeric) and ln(double precision) overloads, and an uncast
integer literal in that position resolves to the double precision one.
Dividing a numeric by a double precision promotes the whole expression
(and therefore the entire match_score sum it's part of) to double
precision, which no longer matches the declared numeric return column.
This bug is as old as the function itself; it was only unreachable until
the two ambiguous-column and int/bigint fixes ahead of it were applied.

Fix: cast the literal in both LN(500) occurrences (the SELECT list's
match_score expression and its identical duplicate inlined into
ORDER BY) to LN(500::numeric), matching the first call. No weights, no
formula, no other column, gating, or signature changed.
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
    CASE
      WHEN n.vote_count > 0 THEN LEAST(
        (SELECT count(*)::numeric FROM votes WHERE votes.need_id = n.id AND votes.created_at > now() - interval '7 days') / n.vote_count,
        1.0
      )
      ELSE 0
    END,
    CASE
      WHEN COALESCE(comp.comp_count, 0) = 0 THEN 'None'
      WHEN COALESCE(comp.comp_count, 0) = 1 THEN 'Low'
      WHEN COALESCE(comp.comp_count, 0) <= 3 THEN 'Medium'
      ELSE 'High'
    END,
    COALESCE(comp.comp_count, 0)::int,
    (
      (COALESCE(n.need_score, 0) / 100.0) * 30 +
      LEAST(COALESCE(n.reward_amount, 0) / 5000.0, 1.0) * 20 +
      -- FIX: LN(500) -> LN(500::numeric) -- was resolving to the
      -- double-precision overload of ln(), which promoted this whole
      -- sum (and thus match_score, column 17) to double precision.
      (LN(GREATEST(LEAST(n.vote_count, 500), 1)::numeric) / LN(500::numeric)) * 15 +
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
    ),
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
    FROM builder_interest WHERE builder_interest.need_id = n.id
  ) bi ON true
  WHERE n.status IN ('open', 'committed')
    AND n.owner_id != builder_uuid
    AND NOT EXISTS (
      SELECT 1 FROM need_product_links npl
      WHERE npl.need_id = n.id AND npl.owner_id = builder_uuid
    )
    AND NOT EXISTS (
      SELECT 1 FROM opportunity_dismissals
      WHERE user_id = builder_uuid AND opportunity_dismissals.need_id = n.id
    )
  ORDER BY
    (v_builder_categories IS NOT NULL AND n.category_id = ANY(v_builder_categories)) DESC,
    (
      (COALESCE(n.need_score, 0) / 100.0) * 30 +
      LEAST(COALESCE(n.reward_amount, 0) / 5000.0, 1.0) * 20 +
      (LN(GREATEST(LEAST(n.vote_count, 500), 1)::numeric) / LN(500::numeric)) * 15 +
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
