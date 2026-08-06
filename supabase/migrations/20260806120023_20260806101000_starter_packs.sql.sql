/*
# Starter Packs: curated industry software collections

## What this does
Adds a `is_admin` column to `profiles` so designated users can manage starter packs.
Creates tables for starter packs, their product associations (with ordering + featured flags),
FAQs, and a blog_posts table for related content. Each starter pack gets a public,
SEO-friendly page at /starter-packs/[slug].

## New Tables

1. **starter_packs** — curated collections of software for specific industries
   - `id` (uuid, PK)
   - `title` (text, not null) — display name, e.g. "Construction Starter Pack"
   - `slug` (text, unique, not null) — URL slug, e.g. "construction"
   - `description` (text) — long-form description
   - `short_description` (text) — one-line summary for cards
   - `cover_image_url` (text) — cover image URL
   - `industry` (text) — industry name, e.g. "Construction"
   - `published` (boolean, default false) — only published packs are publicly visible
   - `seo_title` (text) — optional custom SEO title
   - `seo_description` (text) — optional custom meta description
   - `created_at`, `updated_at` (timestamps)
   - `created_by` (uuid, FK to auth.users) — admin who created the pack

2. **starter_pack_products** — join table linking packs to software with ordering
   - `id` (uuid, PK)
   - `starter_pack_id` (uuid, FK to starter_packs, cascade delete)
   - `product_id` (uuid, FK to products, cascade delete)
   - `sort_order` (int, default 0) — display ordering
   - `featured` (boolean, default false) — featured badge
   - `blurb` (text) — optional custom blurb explaining why this software is in the pack
   - UNIQUE(starter_pack_id, product_id)

3. **starter_pack_faqs** — frequently asked questions per pack
   - `id` (uuid, PK)
   - `starter_pack_id` (uuid, FK to starter_packs, cascade delete)
   - `question` (text, not null)
   - `answer` (text, not null)
   - `sort_order` (int, default 0)

4. **blog_posts** — blog articles that can be related to starter packs
   - `id` (uuid, PK)
   - `title` (text, not null)
   - `slug` (text, unique, not null)
   - `excerpt` (text) — short summary
   - `content` (text) — full article body (markdown)
   - `cover_image_url` (text)
   - `published` (boolean, default false)
   - `published_at` (timestamptz)
   - `author_id` (uuid, FK to auth.users)
   - `seo_title` (text)
   - `seo_description` (text)
   - `created_at`, `updated_at` (timestamps)

5. **starter_pack_blog_posts** — join table linking packs to blog posts
   - `id` (uuid, PK)
   - `starter_pack_id` (uuid, FK to starter_packs, cascade delete)
   - `blog_post_id` (uuid, FK to blog_posts, cascade delete)
   - `sort_order` (int, default 0)
   - UNIQUE(starter_pack_id, blog_post_id)

6. **starter_pack_categories** — optional category tags for a pack
   - `id` (uuid, PK)
   - `starter_pack_id` (uuid, FK to starter_packs, cascade delete)
   - `category_id` (uuid, FK to categories, cascade delete)
   - UNIQUE(starter_pack_id, category_id)

## Modified Tables
- `profiles`: adds `is_admin` (boolean, default false) column

## Security
- `is_admin` on profiles: only the owner can SELECT/UPDATE their own row (existing policies handle this)
- Starter packs: public SELECT for published packs (anon + authenticated), full CRUD for authenticated admins
- Admin check via `is_admin` column on profiles — write policies verify the user's profile has `is_admin = true`
- Blog posts: public SELECT for published posts, admin CRUD
- FAQ and join tables: public SELECT, admin CRUD
*/

-- Add is_admin column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 1. starter_packs
CREATE TABLE IF NOT EXISTS starter_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  cover_image_url text,
  industry text,
  published boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE starter_packs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_starter_packs_slug ON starter_packs (slug);
CREATE INDEX IF NOT EXISTS idx_starter_packs_published ON starter_packs (published);

-- Public can read published packs; admins can do everything
DROP POLICY IF EXISTS "sp_select_published" ON starter_packs;
CREATE POLICY "sp_select_published" ON starter_packs FOR SELECT
  TO anon, authenticated USING (published = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "sp_insert_admin" ON starter_packs;
CREATE POLICY "sp_insert_admin" ON starter_packs FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "sp_update_admin" ON starter_packs;
CREATE POLICY "sp_update_admin" ON starter_packs FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "sp_delete_admin" ON starter_packs;
CREATE POLICY "sp_delete_admin" ON starter_packs FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 2. starter_pack_products
CREATE TABLE IF NOT EXISTS starter_pack_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starter_pack_id uuid NOT NULL REFERENCES starter_packs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  blurb text,
  UNIQUE (starter_pack_id, product_id)
);
ALTER TABLE starter_pack_products ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_spp_pack ON starter_pack_products (starter_pack_id);
CREATE INDEX IF NOT EXISTS idx_spp_product ON starter_pack_products (product_id);

DROP POLICY IF EXISTS "spp_select" ON starter_pack_products;
CREATE POLICY "spp_select" ON starter_pack_products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "spp_insert_admin" ON starter_pack_products;
CREATE POLICY "spp_insert_admin" ON starter_pack_products FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spp_update_admin" ON starter_pack_products;
CREATE POLICY "spp_update_admin" ON starter_pack_products FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spp_delete_admin" ON starter_pack_products;
CREATE POLICY "spp_delete_admin" ON starter_pack_products FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 3. starter_pack_faqs
CREATE TABLE IF NOT EXISTS starter_pack_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starter_pack_id uuid NOT NULL REFERENCES starter_packs(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE starter_pack_faqs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_spf_pack ON starter_pack_faqs (starter_pack_id);

DROP POLICY IF EXISTS "spf_select" ON starter_pack_faqs;
CREATE POLICY "spf_select" ON starter_pack_faqs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "spf_insert_admin" ON starter_pack_faqs;
CREATE POLICY "spf_insert_admin" ON starter_pack_faqs FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spf_update_admin" ON starter_pack_faqs;
CREATE POLICY "spf_update_admin" ON starter_pack_faqs FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spf_delete_admin" ON starter_pack_faqs;
CREATE POLICY "spf_delete_admin" ON starter_pack_faqs FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 4. blog_posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  cover_image_url text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts (published);

DROP POLICY IF EXISTS "bp_select_published" ON blog_posts;
CREATE POLICY "bp_select_published" ON blog_posts FOR SELECT
  TO anon, authenticated USING (published = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "bp_insert_admin" ON blog_posts;
CREATE POLICY "bp_insert_admin" ON blog_posts FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "bp_update_admin" ON blog_posts;
CREATE POLICY "bp_update_admin" ON blog_posts FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "bp_delete_admin" ON blog_posts;
CREATE POLICY "bp_delete_admin" ON blog_posts FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 5. starter_pack_blog_posts
CREATE TABLE IF NOT EXISTS starter_pack_blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starter_pack_id uuid NOT NULL REFERENCES starter_packs(id) ON DELETE CASCADE,
  blog_post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (starter_pack_id, blog_post_id)
);
ALTER TABLE starter_pack_blog_posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_spbp_pack ON starter_pack_blog_posts (starter_pack_id);

DROP POLICY IF EXISTS "spbp_select" ON starter_pack_blog_posts;
CREATE POLICY "spbp_select" ON starter_pack_blog_posts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "spbp_insert_admin" ON starter_pack_blog_posts;
CREATE POLICY "spbp_insert_admin" ON starter_pack_blog_posts FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spbp_update_admin" ON starter_pack_blog_posts;
CREATE POLICY "spbp_update_admin" ON starter_pack_blog_posts FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spbp_delete_admin" ON starter_pack_blog_posts;
CREATE POLICY "spbp_delete_admin" ON starter_pack_blog_posts FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 6. starter_pack_categories
CREATE TABLE IF NOT EXISTS starter_pack_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starter_pack_id uuid NOT NULL REFERENCES starter_packs(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE (starter_pack_id, category_id)
);
ALTER TABLE starter_pack_categories ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_spc_pack ON starter_pack_categories (starter_pack_id);

DROP POLICY IF EXISTS "spc_select" ON starter_pack_categories;
CREATE POLICY "spc_select" ON starter_pack_categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "spc_insert_admin" ON starter_pack_categories;
CREATE POLICY "spc_insert_admin" ON starter_pack_categories FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spc_delete_admin" ON starter_pack_categories;
CREATE POLICY "spc_delete_admin" ON starter_pack_categories FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- updated_at trigger for starter_packs
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_starter_packs_updated ON starter_packs;
CREATE TRIGGER trg_starter_packs_updated BEFORE UPDATE ON starter_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_blog_posts_updated ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
