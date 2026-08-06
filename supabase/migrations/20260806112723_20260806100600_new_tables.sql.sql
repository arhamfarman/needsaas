/*
# New tables: tags, bookmarks, page_views, search_events, activity_feed, builder_verifications, need_matches

All tables needed for post-MVP features: tags, bookmarks, analytics, search tracking,
activity feed, verified builder, and AI need matching.
*/

-- ============= TAGS =============
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tags_read" ON tags;
CREATE POLICY "tags_read" ON tags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tags_insert" ON tags;
CREATE POLICY "tags_insert" ON tags FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "tags_update" ON tags;
CREATE POLICY "tags_update" ON tags FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============= PRODUCT TAGS =============
CREATE TABLE IF NOT EXISTS product_tags (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_tags_read" ON product_tags;
CREATE POLICY "product_tags_read" ON product_tags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "product_tags_insert" ON product_tags;
CREATE POLICY "product_tags_insert" ON product_tags FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "product_tags_delete" ON product_tags;
CREATE POLICY "product_tags_delete" ON product_tags FOR DELETE TO authenticated USING (true);

-- ============= NEED TAGS =============
CREATE TABLE IF NOT EXISTS need_tags (
  need_id uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (need_id, tag_id)
);
ALTER TABLE need_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "need_tags_read" ON need_tags;
CREATE POLICY "need_tags_read" ON need_tags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "need_tags_insert" ON need_tags;
CREATE POLICY "need_tags_insert" ON need_tags FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "need_tags_delete" ON need_tags;
CREATE POLICY "need_tags_delete" ON need_tags FOR DELETE TO authenticated USING (true);

-- ============= BOOKMARKS =============
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookmarks_select_own" ON bookmarks;
CREATE POLICY "bookmarks_select_own" ON bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookmarks_insert_own" ON bookmarks;
CREATE POLICY "bookmarks_insert_own" ON bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookmarks_delete_own" ON bookmarks;
CREATE POLICY "bookmarks_delete_own" ON bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_product ON bookmarks (product_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id);

-- ============= PAGE VIEWS =============
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('product', 'builder', 'need')),
  entity_id uuid NOT NULL,
  visitor_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "page_views_insert" ON page_views;
CREATE POLICY "page_views_insert" ON page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "page_views_select" ON page_views;
CREATE POLICY "page_views_select" ON page_views FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_page_views_entity ON page_views (entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views (visitor_id, entity_type, entity_id);

-- ============= SEARCH EVENTS =============
CREATE TABLE IF NOT EXISTS search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  result_count integer DEFAULT 0,
  clicked_type text,
  clicked_id uuid,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "search_events_insert" ON search_events;
CREATE POLICY "search_events_insert" ON search_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "search_events_select" ON search_events;
CREATE POLICY "search_events_select" ON search_events FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_search_events_query ON search_events (query, created_at);

-- ============= ACTIVITY FEED =============
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_feed_select_own" ON activity_feed;
CREATE POLICY "activity_feed_select_own" ON activity_feed FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "activity_feed_insert" ON activity_feed;
CREATE POLICY "activity_feed_insert" ON activity_feed FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed (user_id, created_at DESC);

-- ============= BUILDER VERIFICATIONS =============
CREATE TABLE IF NOT EXISTS builder_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  website_url text,
  github_url text,
  twitter_url text,
  portfolio_url text,
  notes text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE builder_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "verification_select_own" ON builder_verifications;
CREATE POLICY "verification_select_own" ON builder_verifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "verification_insert_own" ON builder_verifications;
CREATE POLICY "verification_insert_own" ON builder_verifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============= NEED MATCHES (AI) =============
CREATE TABLE IF NOT EXISTS need_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  need_id uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  match_score numeric DEFAULT 0,
  match_reasons text,
  status text NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'attached', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (product_id, need_id)
);
ALTER TABLE need_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "need_matches_select" ON need_matches;
CREATE POLICY "need_matches_select" ON need_matches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "need_matches_insert" ON need_matches;
CREATE POLICY "need_matches_insert" ON need_matches FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "need_matches_update" ON need_matches;
CREATE POLICY "need_matches_update" ON need_matches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_need_matches_product ON need_matches (product_id, status);
CREATE INDEX IF NOT EXISTS idx_need_matches_need ON need_matches (need_id, status);
