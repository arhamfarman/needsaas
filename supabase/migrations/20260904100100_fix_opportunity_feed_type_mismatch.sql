/*
# Fix: get_opportunity_feed() return-type mismatch on competing_products

Discovered during live post-fix verification of migration
20260904100000 (which fixed the reported 42702 ambiguous-column error).
Once that ambiguity was resolved, the function could finally reach and
execute its RETURN QUERY statement for the first time -- and immediately
failed with a *different*, previously-unreachable error:

  42804: "structure of query does not match function result type"
  "Returned type bigint does not match expected type integer in column 16"

Column 16 is `competing_products`, declared `int` in RETURNS TABLE. Its
value comes from `COALESCE(comp.comp_count, 0)`, where `comp.comp_count`
is `count(*)` from a lateral subquery -- `count(*)` always returns
`bigint` in Postgres, which COALESCE then keeps as `bigint`, not `int`.
This mismatch existed in the function since it was first written; it
was simply never reached before, because execution always failed on the
line-73 ambiguity first.

This migration re-creates the function with no changes other than
casting that one value to `int` at its single output-column usage
(competing-product counts are always small non-negative numbers, so the
cast is lossless). Every other column, the ranking weights, gating, and
signature are unchanged from 20260904100000 -- this is a pure follow-up,
not a redesign.
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
    -- FIX: cast to int -- count(*) is bigint, but competing_products is
    -- declared int; this is the column-16 type mismatch (42804) found
    -- during Phase 6 follow-up verification.
    COALESCE(comp.comp_count, 0)::int,
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
