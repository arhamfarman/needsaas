/*
# Universal search and autocomplete functions

PostgreSQL FTS functions for searching across products, needs, builders, and categories.
Products rank highest, then needs, then builders, then categories.
*/

CREATE OR REPLACE FUNCTION universal_search(search_term text, limit_count int DEFAULT 20)
RETURNS TABLE (
  result_type text,
  result_id uuid,
  title text,
  subtitle text,
  image_url text,
  href text,
  rank numeric,
  is_featured boolean,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM (
    SELECT
      'product'::text AS result_type,
      p.id AS result_id,
      p.name AS title,
      p.tagline AS subtitle,
      p.logo_url AS image_url,
      '/products/' || p.id::text AS href,
      (ts_rank(p.fts_vector, plainto_tsquery('english', search_term)) * 100 + 10) +
        CASE WHEN p.featured THEN 0.5 ELSE 0 END +
        CASE WHEN prof.verified THEN 0.3 ELSE 0 END AS rank,
      p.featured AS is_featured,
      COALESCE(prof.verified, false) AS is_verified
    FROM products p
    LEFT JOIN profiles prof ON prof.id = p.owner_id
    WHERE p.paid = true
      AND p.fts_vector @@ plainto_tsquery('english', search_term)

    UNION ALL

    SELECT
      'need'::text AS result_type,
      n.id AS result_id,
      n.title AS title,
      left(n.description, 120) AS subtitle,
      NULL::text AS image_url,
      '/needs/' || n.id::text AS href,
      (ts_rank(n.fts_vector, plainto_tsquery('english', search_term)) * 50) AS rank,
      false AS is_featured,
      false AS is_verified
    FROM needs n
    WHERE n.status != 'closed'
      AND n.fts_vector @@ plainto_tsquery('english', search_term)

    UNION ALL

    SELECT
      'builder'::text AS result_type,
      pr.id AS result_id,
      COALESCE(pr.full_name, pr.username) AS title,
      pr.bio AS subtitle,
      pr.avatar_url AS image_url,
      '/builders/' || pr.id::text AS href,
      (ts_rank(pr.fts_vector, plainto_tsquery('english', search_term)) * 25) +
        CASE WHEN pr.verified THEN 2 ELSE 0 END AS rank,
      false AS is_featured,
      pr.verified AS is_verified
    FROM profiles pr
    WHERE pr.fts_vector @@ plainto_tsquery('english', search_term)
      AND EXISTS (SELECT 1 FROM products WHERE owner_id = pr.id AND paid = true)

    UNION ALL

    SELECT
      'category'::text AS result_type,
      c.id AS result_id,
      c.name AS title,
      c.description AS subtitle,
      NULL::text AS image_url,
      '/search?category=' || c.slug AS href,
      (ts_rank(c.fts_vector, plainto_tsquery('english', search_term)) * 10) AS rank,
      false AS is_featured,
      false AS is_verified
    FROM categories c
    WHERE c.fts_vector @@ plainto_tsquery('english', search_term)
  ) AS results
  ORDER BY rank DESC
  LIMIT LEAST(limit_count, 100);
$$;

CREATE OR REPLACE FUNCTION search_autocomplete(search_term text, limit_count int DEFAULT 8)
RETURNS TABLE (
  result_type text,
  result_id uuid,
  title text,
  subtitle text,
  image_url text,
  href text,
  rank numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM (
    SELECT
      'product'::text AS result_type,
      p.id AS result_id,
      p.name AS title,
      p.tagline AS subtitle,
      p.logo_url AS image_url,
      '/products/' || p.id::text AS href,
      (ts_rank(p.fts_vector, plainto_tsquery('english', search_term)) * 100) AS rank
    FROM products p
    WHERE p.paid = true
      AND p.fts_vector @@ plainto_tsquery('english', search_term)

    UNION ALL

    SELECT
      'need'::text AS result_type,
      n.id AS result_id,
      n.title AS title,
      left(n.description, 80) AS subtitle,
      NULL::text AS image_url,
      '/needs/' || n.id::text AS href,
      (ts_rank(n.fts_vector, plainto_tsquery('english', search_term)) * 50) AS rank
    FROM needs n
    WHERE n.status != 'closed'
      AND n.fts_vector @@ plainto_tsquery('english', search_term)

    UNION ALL

    SELECT
      'builder'::text AS result_type,
      pr.id AS result_id,
      COALESCE(pr.full_name, pr.username) AS title,
      left(pr.bio, 80) AS subtitle,
      pr.avatar_url AS image_url,
      '/builders/' || pr.id::text AS href,
      (ts_rank(pr.fts_vector, plainto_tsquery('english', search_term)) * 25) AS rank
    FROM profiles pr
    WHERE pr.fts_vector @@ plainto_tsquery('english', search_term)
      AND EXISTS (SELECT 1 FROM products WHERE owner_id = pr.id AND paid = true)

    UNION ALL

    SELECT
      'category'::text AS result_type,
      c.id AS result_id,
      c.name AS title,
      NULL::text AS subtitle,
      NULL::text AS image_url,
      '/search?category=' || c.slug AS href,
      (ts_rank(c.fts_vector, plainto_tsquery('english', search_term)) * 10) AS rank
    FROM categories c
    WHERE c.fts_vector @@ plainto_tsquery('english', search_term)
  ) AS results
  ORDER BY rank DESC
  LIMIT LEAST(limit_count, 20);
$$;

GRANT EXECUTE ON FUNCTION universal_search(text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_autocomplete(text, int) TO anon, authenticated;
