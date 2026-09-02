/*
# Reconcile fix_relations.sql into tracked migrations

## Problem
The repo has three SQL files at its root (fix_relations.sql,
seed_categories.sql, all_migrations.sql) that were run by hand against the
live project but were never added to supabase/migrations/. The most
important one, fix_relations.sql, creates the `handle_new_user()` trigger
that auto-creates a `profiles` row whenever a new `auth.users` row appears —
this is the ONLY thing that gives a Google OAuth sign-up a profile row
(email/password sign-up inserts one manually client-side in
auth-provider.tsx; OAuth sign-up does not). If this trigger only exists as a
manual SQL Editor run and not in migrations, a fresh/rebuilt environment
(staging, disaster recovery) would silently lose OAuth profile creation.

This migration promotes that content into the tracked history so the
migrations folder is a complete, trustworthy record of the schema. Every
statement below is idempotent (safe to run whether or not it's already
live) and purely additive — no data is dropped.

## What this does
1. Re-creates `handle_new_user()` + its trigger on auth.users (idempotent).
2. Backfills any auth.users row still missing a profiles row.
3. Repoints owner/user FKs from auth.users(id) to profiles(id) so PostgREST
   can resolve `profile:profiles(*)` embeds used throughout the app.
4. Re-seeds the starter category list (idempotent upsert).
*/

-- ---------- auto-create profile on signup ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- backfill any existing auth user missing a profile row ----------
INSERT INTO public.profiles (id, username, full_name, avatar_url)
SELECT
  id,
  split_part(email, '@', 1) || '_' || substr(md5(random()::text), 1, 4),
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ---------- repoint owner/user FKs to profiles so PostgREST embeds resolve ----------
ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS needs_owner_id_fkey;
ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS fk_needs_profile;
ALTER TABLE public.needs ADD CONSTRAINT fk_needs_profile FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_owner_id_fkey;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS fk_products_profile;
ALTER TABLE public.products ADD CONSTRAINT fk_products_profile FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.need_product_links DROP CONSTRAINT IF EXISTS need_product_links_owner_id_fkey;
ALTER TABLE public.need_product_links DROP CONSTRAINT IF EXISTS fk_npl_profile;
ALTER TABLE public.need_product_links ADD CONSTRAINT fk_npl_profile FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_user_id_fkey;
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS fk_votes_profile;
ALTER TABLE public.votes ADD CONSTRAINT fk_votes_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS fk_reviews_profile;
ALTER TABLE public.reviews ADD CONSTRAINT fk_reviews_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS contributions_user_id_fkey;
ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS fk_contributions_profile;
ALTER TABLE public.contributions ADD CONSTRAINT fk_contributions_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.builder_interest DROP CONSTRAINT IF EXISTS builder_interest_builder_id_fkey;
ALTER TABLE public.builder_interest DROP CONSTRAINT IF EXISTS fk_builder_interest_profile;
ALTER TABLE public.builder_interest ADD CONSTRAINT fk_builder_interest_profile FOREIGN KEY (builder_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey;
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS fk_bookmarks_profile;
ALTER TABLE public.bookmarks ADD CONSTRAINT fk_bookmarks_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.page_views DROP CONSTRAINT IF EXISTS page_views_user_id_fkey;
ALTER TABLE public.page_views DROP CONSTRAINT IF EXISTS fk_page_views_profile;
ALTER TABLE public.page_views ADD CONSTRAINT fk_page_views_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.search_events DROP CONSTRAINT IF EXISTS search_events_user_id_fkey;
ALTER TABLE public.search_events DROP CONSTRAINT IF EXISTS fk_search_events_profile;
ALTER TABLE public.search_events ADD CONSTRAINT fk_search_events_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.activity_feed DROP CONSTRAINT IF EXISTS activity_feed_user_id_fkey;
ALTER TABLE public.activity_feed DROP CONSTRAINT IF EXISTS fk_activity_feed_profile;
ALTER TABLE public.activity_feed ADD CONSTRAINT fk_activity_feed_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.builder_verifications DROP CONSTRAINT IF EXISTS builder_verifications_user_id_fkey;
ALTER TABLE public.builder_verifications DROP CONSTRAINT IF EXISTS fk_builder_verifications_profile;
ALTER TABLE public.builder_verifications ADD CONSTRAINT fk_builder_verifications_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.need_follows DROP CONSTRAINT IF EXISTS need_follows_user_id_fkey;
ALTER TABLE public.need_follows DROP CONSTRAINT IF EXISTS fk_need_follows_profile;
ALTER TABLE public.need_follows ADD CONSTRAINT fk_need_follows_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.starter_packs DROP CONSTRAINT IF EXISTS starter_packs_created_by_fkey;
ALTER TABLE public.starter_packs DROP CONSTRAINT IF EXISTS fk_starter_packs_profile;
ALTER TABLE public.starter_packs ADD CONSTRAINT fk_starter_packs_profile FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS fk_blog_posts_profile;
ALTER TABLE public.blog_posts ADD CONSTRAINT fk_blog_posts_profile FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ---------- re-seed starter categories (idempotent) ----------
INSERT INTO public.categories (slug, name, description, icon) VALUES
('marketing', 'Marketing', 'Tools to help you grow your audience, manage campaigns, and increase sales.', 'Megaphone'),
('sales', 'Sales & CRM', 'Software for tracking leads, managing customer relationships, and closing deals.', 'TrendingUp'),
('dev-tools', 'Developer Tools', 'Infrastructure, deployment, monitoring, and coding utilities.', 'Terminal'),
('analytics', 'Data & Analytics', 'Business intelligence, product analytics, and data visualization.', 'LineChart'),
('ai', 'Artificial Intelligence', 'AI-powered tools, LLM wrappers, and automated generative platforms.', 'Sparkles'),
('design', 'Design & UI', 'Graphic design, prototyping, video editing, and creative tools.', 'PenTool'),
('productivity', 'Productivity', 'Note-taking, task management, time tracking, and collaboration.', 'CheckSquare'),
('finance', 'Finance & Accounting', 'Invoicing, bookkeeping, expense tracking, and payroll solutions.', 'DollarSign'),
('hr', 'HR & Recruiting', 'Applicant tracking, employee engagement, and team management.', 'Users'),
('customer-support', 'Customer Support', 'Help desks, live chat, ticketing, and knowledge base software.', 'MessageSquare'),
('ecommerce', 'E-Commerce', 'Storefronts, inventory management, fulfillment, and checkout solutions.', 'ShoppingCart'),
('security', 'Security & Compliance', 'Authentication, data protection, privacy tools, and compliance monitoring.', 'ShieldCheck')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon;
