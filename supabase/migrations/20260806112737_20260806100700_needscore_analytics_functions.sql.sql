/*
# NeedScore, analytics, and builder insights functions

1. calculate_need_score(uuid) — returns 0-100 NeedScore for a need
2. update_need_scores() — batch update scores and trends
3. get_builder_analytics(uuid) — analytics summary for a builder
*/

CREATE OR REPLACE FUNCTION calculate_need_score(need_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vote_count int;
  v_reward_amount numeric;
  v_contributor_count int;
  v_bookmark_count int;
  v_builder_interest int;
  v_created_at timestamptz;
  v_recent_votes int;
  v_growth_rate numeric;
  v_recency_factor numeric;
  v_score numeric;
  v_max_vote int;
  v_max_reward numeric;
BEGIN
  SELECT vote_count, reward_amount, contributor_count, bookmark_count, created_at
  INTO v_vote_count, v_reward_amount, v_contributor_count, v_bookmark_count, v_created_at
  FROM needs WHERE id = need_uuid;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT count(*) INTO v_builder_interest FROM builder_interest WHERE need_id = need_uuid;

  SELECT count(*) INTO v_recent_votes
  FROM votes WHERE need_id = need_uuid AND created_at > now() - interval '7 days';

  IF v_vote_count > 0 THEN
    v_growth_rate := LEAST(v_recent_votes::numeric / v_vote_count, 1.0);
  ELSE
    v_growth_rate := 0;
  END IF;

  v_recency_factor := GREATEST(1.0 - (EXTRACT(epoch FROM (now() - v_created_at)) / 86400 / 90), 0);

  v_max_vote := LEAST(v_vote_count, 500);
  v_max_reward := LEAST(v_reward_amount, 5000);

  v_score :=
    (LN(GREATEST(v_max_vote, 1)::numeric) / LN(500)) * 30 +
    (v_max_reward / 5000) * 20 +
    LEAST(v_contributor_count::numeric / 50, 1.0) * 10 +
    LEAST(v_builder_interest::numeric / 10, 1.0) * 15 +
    v_growth_rate * 10 +
    v_recency_factor * 10 +
    LEAST(v_bookmark_count::numeric / 100, 1.0) * 5;

  v_score := GREATEST(0, LEAST(100, ROUND(v_score, 0)));
  RETURN v_score;
END;
$$;

CREATE OR REPLACE FUNCTION update_need_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  need_rec RECORD;
  new_score numeric;
  old_score numeric;
  trend text;
BEGIN
  FOR need_rec IN
    SELECT id, need_score FROM needs WHERE status IN ('open', 'committed', 'building')
  LOOP
    old_score := need_rec.need_score;
    new_score := calculate_need_score(need_rec.id);

    IF new_score > old_score + 2 THEN
      trend := 'rising';
    ELSIF new_score < old_score - 2 THEN
      trend := 'falling';
    ELSE
      trend := 'stable';
    END IF;

    UPDATE needs
    SET need_score = new_score,
        need_score_trend = trend,
        need_score_updated_at = now()
    WHERE id = need_rec.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION get_builder_analytics(builder_uuid uuid)
RETURNS TABLE (
  total_views bigint,
  unique_visitors bigint,
  profile_views bigint,
  bookmarks bigint,
  reviews bigint,
  product_clicks bigint,
  need_matches bigint,
  avg_rating numeric,
  product_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM page_views WHERE entity_type = 'product' AND entity_id IN (SELECT id FROM products WHERE owner_id = builder_uuid))
      + (SELECT count(*) FROM page_views WHERE entity_type = 'builder' AND entity_id = builder_uuid),
    (SELECT count(DISTINCT visitor_id) FROM page_views WHERE (entity_type = 'product' AND entity_id IN (SELECT id FROM products WHERE owner_id = builder_uuid)) OR (entity_type = 'builder' AND entity_id = builder_uuid)),
    (SELECT count(*) FROM page_views WHERE entity_type = 'builder' AND entity_id = builder_uuid),
    (SELECT count(*) FROM bookmarks WHERE product_id IN (SELECT id FROM products WHERE owner_id = builder_uuid)),
    (SELECT count(*) FROM reviews WHERE product_id IN (SELECT id FROM products WHERE owner_id = builder_uuid)),
    0::bigint,
    (SELECT count(*) FROM need_matches WHERE product_id IN (SELECT id FROM products WHERE owner_id = builder_uuid) AND status = 'attached'),
    COALESCE((SELECT avg(avg_rating) FROM products WHERE owner_id = builder_uuid AND review_count > 0), 0),
    (SELECT count(*) FROM products WHERE owner_id = builder_uuid AND paid = true)
$$;

GRANT EXECUTE ON FUNCTION calculate_need_score(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_need_scores() TO authenticated;
GRANT EXECUTE ON FUNCTION get_builder_analytics(uuid) TO authenticated;
