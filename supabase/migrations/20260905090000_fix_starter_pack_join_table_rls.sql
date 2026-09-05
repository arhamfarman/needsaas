/*
# Fix: Starter Pack join-table RLS leaks draft packs' content

## Problem
Found during the Starter Packs audit (2026-09-05). `starter_packs` itself
correctly restricts SELECT to `published = true OR admin` (see
sp_select_published in the original migration), but the four tables that
hang off it -- `starter_pack_products`, `starter_pack_faqs`,
`starter_pack_blog_posts`, `starter_pack_categories` -- were all given an
unconditional `USING (true)` SELECT policy instead, with no check on the
parent pack's `published` state at all:

  CREATE POLICY "spp_select" ON starter_pack_products FOR SELECT
    TO anon, authenticated USING (true);
  -- (same pattern for spf_select, spbp_select, spc_select)

Practical impact: while a draft pack's own title/slug/description stay
correctly hidden, its product list, FAQs, linked blog posts, and category
tags are all publicly readable via a direct REST query against these join
tables if the pack's UUID is known or enumerated -- e.g.
`GET /rest/v1/starter_pack_faqs?starter_pack_id=eq.<draft-pack-uuid>`
returns real draft FAQ content today, unauthenticated. No PII is exposed
(these are marketing/curation rows, not user data), but it's a real
"draft content should not be publicly readable" leak, and the fix is the
same one-line-per-table shape as the rest of this pattern.

## Fix
Re-create each table's `_select` policy to require EITHER the parent
`starter_packs.published = true` OR the caller's own `profiles.is_admin =
true` -- exactly mirroring `starter_packs`' own `sp_select_published`
policy, just joined through the FK instead of checked on the row itself.
This is a pure narrowing of an existing SELECT policy: no INSERT, UPDATE,
or DELETE policy on any of these four tables is touched, and the
`TO anon, authenticated` role list is unchanged.
*/

-- 1. starter_pack_products
DROP POLICY IF EXISTS "spp_select" ON starter_pack_products;
CREATE POLICY "spp_select" ON starter_pack_products FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM starter_packs sp WHERE sp.id = starter_pack_products.starter_pack_id AND sp.published = true)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 2. starter_pack_faqs
DROP POLICY IF EXISTS "spf_select" ON starter_pack_faqs;
CREATE POLICY "spf_select" ON starter_pack_faqs FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM starter_packs sp WHERE sp.id = starter_pack_faqs.starter_pack_id AND sp.published = true)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 3. starter_pack_blog_posts
DROP POLICY IF EXISTS "spbp_select" ON starter_pack_blog_posts;
CREATE POLICY "spbp_select" ON starter_pack_blog_posts FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM starter_packs sp WHERE sp.id = starter_pack_blog_posts.starter_pack_id AND sp.published = true)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 4. starter_pack_categories
DROP POLICY IF EXISTS "spc_select" ON starter_pack_categories;
CREATE POLICY "spc_select" ON starter_pack_categories FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM starter_packs sp WHERE sp.id = starter_pack_categories.starter_pack_id AND sp.published = true)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
