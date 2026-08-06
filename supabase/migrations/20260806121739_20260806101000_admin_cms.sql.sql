/*
# Admin CMS: need flags, blog scheduling, search analytics, review flags

## What this does
Adds admin management columns and new tables for the Admin CMS.

## Modified Tables
- `needs`: adds `pinned` (boolean), `featured_need` (boolean) for admin management
- `blog_posts`: adds `status` (text: draft/scheduled/published), `scheduled_at` (timestamptz), 
  `canonical_url` (text), `og_image_url` (text)
- `reviews`: adds `reported` (boolean) for moderation
- `products`: (already has `featured` column)

## New Tables
1. `blog_tags` — tags for blog posts
2. `blog_post_tags` — join table linking blog posts to tags
3. `search_log` — logs search queries for analytics

## Security
- blog_tags, blog_post_tags: public SELECT, admin CRUD
- search_log: admin SELECT only, anon+authenticated INSERT (for logging searches)
- All write operations on blog_posts already restricted to admins from previous migration
*/

-- Add admin columns to needs
ALTER TABLE needs ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE needs ADD COLUMN IF NOT EXISTS featured_need boolean NOT NULL DEFAULT false;

-- Add scheduling and SEO columns to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_image_url text;

-- Add moderation column to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reported boolean NOT NULL DEFAULT false;

-- Blog tags
CREATE TABLE IF NOT EXISTS blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blogtag_select" ON blog_tags;
CREATE POLICY "blogtag_select" ON blog_tags FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "blogtag_insert_admin" ON blog_tags;
CREATE POLICY "blogtag_insert_admin" ON blog_tags FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "blogtag_update_admin" ON blog_tags;
CREATE POLICY "blogtag_update_admin" ON blog_tags FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "blogtag_delete_admin" ON blog_tags;
CREATE POLICY "blogtag_delete_admin" ON blog_tags FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Blog post tags join table
CREATE TABLE IF NOT EXISTS blog_post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  blog_tag_id uuid NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  UNIQUE (blog_post_id, blog_tag_id)
);
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bpt_select" ON blog_post_tags;
CREATE POLICY "bpt_select" ON blog_post_tags FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "bpt_insert_admin" ON blog_post_tags;
CREATE POLICY "bpt_insert_admin" ON blog_post_tags FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "bpt_delete_admin" ON blog_post_tags;
CREATE POLICY "bpt_delete_admin" ON blog_post_tags FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Search log for analytics
CREATE TABLE IF NOT EXISTS search_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tab text,
  result_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE search_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "searchlog_insert_any" ON search_log;
CREATE POLICY "searchlog_insert_any" ON search_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "searchlog_select_admin" ON search_log;
CREATE POLICY "searchlog_select_admin" ON search_log FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "searchlog_delete_admin" ON search_log;
CREATE POLICY "searchlog_delete_admin" ON search_log FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE INDEX IF NOT EXISTS idx_searchlog_created ON search_log (created_at DESC);

-- Update published status when blog_posts.published is toggled
-- Keep status in sync: if published=true and status='draft', set status='published'
CREATE OR REPLACE FUNCTION sync_blog_post_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.published = true AND NEW.status = 'draft' THEN
    NEW.status = 'published';
    IF NEW.published_at IS NULL THEN
      NEW.published_at = now();
    END IF;
  ELSIF NEW.published = false AND NEW.status = 'published' THEN
    NEW.status = 'draft';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_post_status ON blog_posts;
CREATE TRIGGER trg_blog_post_status BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION sync_blog_post_status();
