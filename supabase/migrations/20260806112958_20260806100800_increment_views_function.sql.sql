/*
# Add increment_product_views function

Used by client-side analytics tracking to increment view_count on products.
*/

CREATE OR REPLACE FUNCTION increment_product_views(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products SET view_count = view_count + 1 WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_product_views(uuid) TO anon, authenticated;
