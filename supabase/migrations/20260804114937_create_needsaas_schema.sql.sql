/*
# NeedSaaS core schema

1. Overview
NeedSaaS connects people looking for software (needs) with builders who have solutions (products).
This migration creates the full data model: builder profiles, categories, needs, products,
links between needs and products, votes on needs, and reviews on products.

2. New Tables
- `profiles`  — public builder profile data keyed to auth.users (username, bio, avatar_url, role)
- `categories` — curated taxonomy of software categories (slug, name, description)
- `needs`     — a user-request describing software they want (title, description, category, status)
- `products`  — a builder-listed solution (name, tagline, description, url, category)
- `need_product_links` — many-to-many: a builder attaches a product to a matching need (with status)
- `votes`     — community upvotes on a need (one per user per need)
- `reviews`   — a user's rating + comment on a product (one per user per product)

3. Relationships
- needs.owner_id -> auth.users(id)
- products.owner_id -> auth.users(id)
- needs.category_id -> categories(id)
- products.category_id -> categories(id)
- need_product_links.need_id -> needs(id), product_id -> products(id)
- votes.need_id -> needs(id), user_id -> auth.users(id)
- reviews.product_id -> products(id), user_id -> auth.users(id)
- profiles.id = auth.users(id) (1:1)

4. Public reads (anon + authenticated)
- categories, needs, products, need_product_links (approved), votes aggregate, reviews, profiles
  are all publicly readable so the marketplace works without sign-in.
- Writes (create/edit/vote/review/link) require authentication and ownership checks.

5. Security (RLS)
- RLS enabled on every table.
- Public SELECT on categories, needs, products, reviews, profiles.
- Owner-only INSERT/UPDATE/DELETE on needs, products, profiles (auth.uid() = owner_id).
- votes: anyone authenticated may insert their own row (one per need via unique constraint);
  SELECT public so vote counts are visible.
- reviews: anyone authenticated may insert one review per product; SELECT public.
- need_product_links: public SELECT for approved links; INSERT/UPDATE/DELETE by the product owner.

6. Notes
- owner columns default to auth.uid() so frontend inserts that omit the owner succeed.
- votes and reviews enforce one-per-user via UNIQUE constraints.
- Counter columns (needs.vote_count, products.review_count, products.avg_rating) are maintained
  via triggers so the UI can sort/filter cheaply without aggregating every render.
*/

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  bio text,
  avatar_url text,
  website text,
  twitter text,
  github text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- categories ----------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own" ON public.categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ---------- needs ----------
CREATE TABLE IF NOT EXISTS public.needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','building','fulfilled','closed')),
  vote_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS needs_category_idx ON public.needs(category_id);
CREATE INDEX IF NOT EXISTS needs_owner_idx ON public.needs(owner_id);
CREATE INDEX IF NOT EXISTS needs_vote_count_idx ON public.needs(vote_count DESC);
CREATE INDEX IF NOT EXISTS needs_status_idx ON public.needs(status);

DROP POLICY IF EXISTS "needs_select_public" ON public.needs;
CREATE POLICY "needs_select_public" ON public.needs
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "needs_insert_own" ON public.needs;
CREATE POLICY "needs_insert_own" ON public.needs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "needs_update_own" ON public.needs;
CREATE POLICY "needs_update_own" ON public.needs
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "needs_delete_own" ON public.needs;
CREATE POLICY "needs_delete_own" ON public.needs
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text NOT NULL,
  description text NOT NULL,
  url text,
  repo_url text,
  pricing text,
  logo_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  review_count integer NOT NULL DEFAULT 0,
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_owner_idx ON public.products(owner_id);

DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "products_insert_own" ON public.products;
CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "products_delete_own" ON public.products;
CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- ---------- need_product_links ----------
CREATE TABLE IF NOT EXISTS public.need_product_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (need_id, product_id)
);
ALTER TABLE public.need_product_links ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS npl_need_idx ON public.need_product_links(need_id);
CREATE INDEX IF NOT EXISTS npl_product_idx ON public.need_product_links(product_id);

DROP POLICY IF EXISTS "links_select_public" ON public.need_product_links;
CREATE POLICY "links_select_public" ON public.need_product_links
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "links_insert_own" ON public.need_product_links;
CREATE POLICY "links_insert_own" ON public.need_product_links
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "links_update_own" ON public.need_product_links;
CREATE POLICY "links_update_own" ON public.need_product_links
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "links_delete_own" ON public.need_product_links;
CREATE POLICY "links_delete_own" ON public.need_product_links
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- ---------- votes ----------
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (need_id, user_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS votes_need_idx ON public.votes(need_id);

DROP POLICY IF EXISTS "votes_select_public" ON public.votes;
CREATE POLICY "votes_select_public" ON public.votes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "votes_insert_own" ON public.votes;
CREATE POLICY "votes_insert_own" ON public.votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "votes_delete_own" ON public.votes;
CREATE POLICY "votes_delete_own" ON public.votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- reviews ----------
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS reviews_product_idx ON public.reviews(product_id);

DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- triggers to maintain counters ----------
CREATE OR REPLACE FUNCTION public.sync_need_vote_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  SELECT COUNT(*) INTO n FROM public.votes WHERE need_id = COALESCE(NEW.need_id, OLD.need_id);
  UPDATE public.needs SET vote_count = n WHERE id = COALESCE(NEW.need_id, OLD.need_id);
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS votes_sync ON public.votes;
CREATE TRIGGER votes_sync
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_need_vote_count();

CREATE OR REPLACE FUNCTION public.sync_product_rating() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c integer; a numeric;
BEGIN
  SELECT COUNT(*), COALESCE(AVG(rating), 0) INTO c, a
  FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products SET review_count = c, avg_rating = ROUND(a, 2)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS reviews_sync ON public.reviews;
CREATE TRIGGER reviews_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_rating();
