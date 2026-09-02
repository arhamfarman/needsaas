-- Fix PostgREST 409 Conflict errors by:
-- 1. Replacing duplicate auth.users FKs with direct profiles FKs
-- 2. Auto-creating a profile row in public.profiles whenever a user signs up (via Google OAuth or Email)

-- Auto-create profile trigger function
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

-- Backfill missing profile rows for existing auth users (e.g. users created before the trigger)
INSERT INTO public.profiles (id, username, full_name, avatar_url)
SELECT 
  id, 
  split_part(email, '@', 1) || '_' || substr(md5(random()::text), 1, 4),
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 1. needs
ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS needs_owner_id_fkey;
ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS fk_needs_profile;
ALTER TABLE public.needs ADD CONSTRAINT fk_needs_profile FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. products
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_owner_id_fkey;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS fk_products_profile;
ALTER TABLE public.products ADD CONSTRAINT fk_products_profile FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. need_product_links
ALTER TABLE public.need_product_links DROP CONSTRAINT IF EXISTS need_product_links_owner_id_fkey;
ALTER TABLE public.need_product_links DROP CONSTRAINT IF EXISTS fk_npl_profile;
ALTER TABLE public.need_product_links ADD CONSTRAINT fk_npl_profile FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. votes
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_user_id_fkey;
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS fk_votes_profile;
ALTER TABLE public.votes ADD CONSTRAINT fk_votes_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. reviews
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS fk_reviews_profile;
ALTER TABLE public.reviews ADD CONSTRAINT fk_reviews_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. contributions
ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS contributions_user_id_fkey;
ALTER TABLE public.contributions DROP CONSTRAINT IF EXISTS fk_contributions_profile;
ALTER TABLE public.contributions ADD CONSTRAINT fk_contributions_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 7. builder_interest
ALTER TABLE public.builder_interest DROP CONSTRAINT IF EXISTS builder_interest_builder_id_fkey;
ALTER TABLE public.builder_interest DROP CONSTRAINT IF EXISTS fk_builder_interest_profile;
ALTER TABLE public.builder_interest ADD CONSTRAINT fk_builder_interest_profile FOREIGN KEY (builder_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 8. bookmarks
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey;
ALTER TABLE public.bookmarks DROP CONSTRAINT IF EXISTS fk_bookmarks_profile;
ALTER TABLE public.bookmarks ADD CONSTRAINT fk_bookmarks_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 9. page_views
ALTER TABLE public.page_views DROP CONSTRAINT IF EXISTS page_views_user_id_fkey;
ALTER TABLE public.page_views DROP CONSTRAINT IF EXISTS fk_page_views_profile;
ALTER TABLE public.page_views ADD CONSTRAINT fk_page_views_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 10. search_events
ALTER TABLE public.search_events DROP CONSTRAINT IF EXISTS search_events_user_id_fkey;
ALTER TABLE public.search_events DROP CONSTRAINT IF EXISTS fk_search_events_profile;
ALTER TABLE public.search_events ADD CONSTRAINT fk_search_events_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 11. activity_feed
ALTER TABLE public.activity_feed DROP CONSTRAINT IF EXISTS activity_feed_user_id_fkey;
ALTER TABLE public.activity_feed DROP CONSTRAINT IF EXISTS fk_activity_feed_profile;
ALTER TABLE public.activity_feed ADD CONSTRAINT fk_activity_feed_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 12. builder_verifications
ALTER TABLE public.builder_verifications DROP CONSTRAINT IF EXISTS builder_verifications_user_id_fkey;
ALTER TABLE public.builder_verifications DROP CONSTRAINT IF EXISTS fk_builder_verifications_profile;
ALTER TABLE public.builder_verifications ADD CONSTRAINT fk_builder_verifications_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 13. need_follows
ALTER TABLE public.need_follows DROP CONSTRAINT IF EXISTS need_follows_user_id_fkey;
ALTER TABLE public.need_follows DROP CONSTRAINT IF EXISTS fk_need_follows_profile;
ALTER TABLE public.need_follows ADD CONSTRAINT fk_need_follows_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 14. starter_packs
ALTER TABLE public.starter_packs DROP CONSTRAINT IF EXISTS starter_packs_created_by_fkey;
ALTER TABLE public.starter_packs DROP CONSTRAINT IF EXISTS fk_starter_packs_profile;
ALTER TABLE public.starter_packs ADD CONSTRAINT fk_starter_packs_profile FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 15. blog_posts
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS fk_blog_posts_profile;
ALTER TABLE public.blog_posts ADD CONSTRAINT fk_blog_posts_profile FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
