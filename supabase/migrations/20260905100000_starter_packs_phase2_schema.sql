/*
# Starter Packs Phase 2: pack-level ordering/featured/publish tracking,
# per-product curation labels, and a real Needs relation

## What this does
1. Adds `featured`, `sort_order`, and `published_at` to `starter_packs` --
   `published_at` mirrors the existing `blog_posts.published_at` pattern
   exactly, including its publish-tracking trigger (see
   sync_blog_post_status in 20260806121739_..._admin_cms.sql.sql).
2. Adds `role_label`, `best_for_label`, `pricing_label` to
   `starter_pack_products` for richer per-recommendation copy -- these are
   pack-context curation labels, distinct from `products.pricing`/
   `products.price_from` (the product's own general pricing info) and from
   the global `tags`/`product_tags` folksonomy.
3. Adds a new `starter_pack_needs` junction table so "related Needs"
   becomes a real, admin-curated relationship instead of the current
   `needs.description ILIKE '%industry%'` text-match approximation used in
   app/starter-packs/[slug]/page.tsx today. (Not wired up to the frontend
   in this migration -- schema only, per this phase's scope.)

## Security
`starter_pack_needs` follows the exact same pattern already applied to the
other four pack join tables in 20260905090000_fix_starter_pack_join_table_rls.sql:
SELECT requires the parent pack to be published, or the caller to be an
admin; INSERT/UPDATE/DELETE are admin-only. No RLS change is needed on
`starter_packs` itself or on `starter_pack_products` -- both already have
fully admin-gated UPDATE policies with no self-service write path, so the
new columns are covered by the existing row-level policies with no gap.

## Decisions carried over from the approved plan
- `published_at` is set exactly once, on the first draft -> published
  transition, and is never cleared or reset by any later
  unpublish/republish cycle -- identical semantics to `blog_posts`.
- No `featured` column on `starter_pack_needs` (no current UI would use
  it; trivial to add later if a future phase needs it).
- No new indexes on `starter_packs.featured` / `sort_order` /
  `published_at` at this stage -- the table has 0 rows today and is
  expected to stay small; `idx_starter_packs_published` already covers the
  one query pattern (published-only listing) that exists.
- Column names `role_label`, `best_for_label`, `pricing_label` approved as
  proposed, chosen to stay unambiguous against `products.pricing`/
  `products.price_from`.
*/

-- ---------- starter_packs: new columns ----------
ALTER TABLE starter_packs ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE starter_packs ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE starter_packs ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Mirrors sync_blog_post_status(): set published_at once, on the first
-- draft -> published transition; never touch it again after that, so
-- "originally published on" survives any later unpublish/republish.
CREATE OR REPLACE FUNCTION sync_starter_pack_published_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.published = true AND (OLD.published IS DISTINCT FROM true) AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_starter_pack_published_at ON starter_packs;
CREATE TRIGGER trg_starter_pack_published_at BEFORE UPDATE ON starter_packs
  FOR EACH ROW EXECUTE FUNCTION sync_starter_pack_published_at();

-- ---------- starter_pack_products: new curation-label columns ----------
ALTER TABLE starter_pack_products ADD COLUMN IF NOT EXISTS role_label text;
ALTER TABLE starter_pack_products ADD COLUMN IF NOT EXISTS best_for_label text;
ALTER TABLE starter_pack_products ADD COLUMN IF NOT EXISTS pricing_label text;

-- ---------- starter_pack_needs: new junction table ----------
CREATE TABLE IF NOT EXISTS starter_pack_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starter_pack_id uuid NOT NULL REFERENCES starter_packs(id) ON DELETE CASCADE,
  need_id uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (starter_pack_id, need_id)
);
ALTER TABLE starter_pack_needs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_spn_pack ON starter_pack_needs (starter_pack_id);
CREATE INDEX IF NOT EXISTS idx_spn_need ON starter_pack_needs (need_id);

DROP POLICY IF EXISTS "spn_select" ON starter_pack_needs;
CREATE POLICY "spn_select" ON starter_pack_needs FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM starter_packs sp WHERE sp.id = starter_pack_needs.starter_pack_id AND sp.published = true)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "spn_insert_admin" ON starter_pack_needs;
CREATE POLICY "spn_insert_admin" ON starter_pack_needs FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spn_update_admin" ON starter_pack_needs;
CREATE POLICY "spn_update_admin" ON starter_pack_needs FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spn_delete_admin" ON starter_pack_needs;
CREATE POLICY "spn_delete_admin" ON starter_pack_needs FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
