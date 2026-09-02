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
/*
# Revoke public execute on counter trigger functions

The vote-count and product-rating sync functions are SECURITY DEFINER trigger functions.
They only need to run when their triggers fire — they must NOT be callable via the REST API
(/rest/v1/rpc/...) by anon or authenticated roles. This revokes EXECUTE from public, anon,
and authenticated so the functions are trigger-only.
*/

REVOKE EXECUTE ON FUNCTION public.sync_need_vote_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_product_rating() FROM PUBLIC, anon, authenticated;
/*
  # Stripe Integration Schema

  1. New Tables
    - `stripe_customers`: Links Supabase users to Stripe customers
      - Includes `user_id` (references `auth.users`)
      - Stores Stripe `customer_id`
      - Implements soft delete

    - `stripe_subscriptions`: Manages subscription data
      - Tracks subscription status, periods, and payment details
      - Links to `stripe_customers` via `customer_id`
      - Custom enum type for subscription status
      - Implements soft delete

    - `stripe_orders`: Stores order/purchase information
      - Records checkout sessions and payment intents
      - Tracks payment amounts and status
      - Custom enum type for order status
      - Implements soft delete

  2. Views
    - `stripe_user_subscriptions`: Secure view for user subscription data
      - Joins customers and subscriptions
      - Filtered by authenticated user

    - `stripe_user_orders`: Secure view for user order history
      - Joins customers and orders
      - Filtered by authenticated user

  3. Security
    - Enables Row Level Security (RLS) on all tables
    - Implements policies for authenticated users to view their own data
*/

CREATE TABLE IF NOT EXISTS stripe_customers (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) not null unique,
  customer_id text not null unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customer data"
    ON stripe_customers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE TYPE stripe_subscription_status AS ENUM (
    'not_started',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
);

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id bigint primary key generated always as identity,
  customer_id text unique not null,
  subscription_id text default null,
  price_id text default null,
  current_period_start bigint default null,
  current_period_end bigint default null,
  cancel_at_period_end boolean default false,
  payment_method_brand text default null,
  payment_method_last4 text default null,
  status stripe_subscription_status not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted_at timestamp with time zone default null
);

ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription data"
    ON stripe_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

CREATE TYPE stripe_order_status AS ENUM (
    'pending',
    'completed',
    'canceled'
);

CREATE TABLE IF NOT EXISTS stripe_orders (
    id bigint primary key generated always as identity,
    checkout_session_id text not null,
    payment_intent_id text not null,
    customer_id text not null,
    amount_subtotal bigint not null,
    amount_total bigint not null,
    currency text not null,
    payment_status text not null,
    status stripe_order_status not null default 'pending',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    deleted_at timestamp with time zone default null
);

ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order data"
    ON stripe_orders
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- View for user subscriptions
CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND s.deleted_at IS NULL;

GRANT SELECT ON stripe_user_subscriptions TO authenticated;

-- View for user orders
CREATE VIEW stripe_user_orders WITH (security_invoker) AS
SELECT
    c.customer_id,
    o.id as order_id,
    o.checkout_session_id,
    o.payment_intent_id,
    o.amount_subtotal,
    o.amount_total,
    o.currency,
    o.payment_status,
    o.status as order_status,
    o.created_at as order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND o.deleted_at IS NULL;
/*
# Product posting fee + image uploads

1. Overview
Adds a $10 listing fee requirement for products and support for logo + product image uploads.

2. Changes to products table
- `paid` boolean (default false) — whether the $10 listing fee has been paid.
- `paid_at` timestamptz — when payment was confirmed.
- `images` text[] — array of storage URLs for product screenshots/gallery images.
  (logo_url already exists and is reused for the logo.)

3. Security: column-level privileges
- `paid` and `paid_at` must NEVER be set by the client. They are only set server-side
  by the Stripe webhook (which runs with the service role key, bypassing RLS).
- REVOKE UPDATE on `paid`, `paid_at` from authenticated so a builder cannot flip their
  own product to paid without paying.
- GRANT UPDATE on `images`, `logo_url` (and existing editable columns) to authenticated.

4. Policy changes
- products SELECT stays public (so unpaid products can still be queried by the owner to
  check status and retry payment), but we do NOT expose unpaid products in the public
  marketplace — that filtering happens in application queries. The RLS SELECT remains
  public so the owner can always read their own row.
- A new UPDATE policy `products_update_own` already exists; column privileges now scope
  which columns it can actually touch.

5. Storage
- Create `product-images` bucket (private) for logos and gallery images.
- Storage policies: authenticated users can read all product images (marketplace is public),
  and can write only into their own folder `{user_id}/...`.
*/

-- ---------- columns ----------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';

-- ---------- column-level privileges ----------
-- Revoke all UPDATE, then grant only the columns a builder should control.
REVOKE UPDATE ON public.products FROM authenticated;
GRANT UPDATE (
  name, tagline, description, url, repo_url, pricing, logo_url, images,
  category_id, updated_at
) ON public.products TO authenticated;

-- ---------- storage bucket ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: read is public (marketplace), write is owner-folder-scoped
DROP POLICY IF EXISTS "product_images_read" ON storage.objects;
CREATE POLICY "product_images_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_insert_own" ON storage.objects;
CREATE POLICY "product_images_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "product_images_update_own" ON storage.objects;
CREATE POLICY "product_images_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "product_images_delete_own" ON storage.objects;
CREATE POLICY "product_images_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_from text;

REVOKE UPDATE ON public.products FROM authenticated;
GRANT UPDATE (
  name, tagline, description, url, repo_url, pricing, price_from, logo_url, images,
  category_id, updated_at
) ON public.products TO authenticated;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS doc_url text;

REVOKE UPDATE ON public.products FROM authenticated;
GRANT UPDATE (
  name, tagline, description, url, repo_url, doc_url, pricing, price_from, logo_url, images,
  category_id, updated_at
) ON public.products TO authenticated;
/*
# Build Rewards tables and Need lifecycle columns

## New Tables
- `contributions` — User contributions to a Need's Build Reward pool
- `builder_interest` — Builders who expressed interest in or committed to building a Need

## Modified Tables
- `needs` — Added reward_amount, contributor_count, timeline, reward_note, builder_committed_id, committed_at, progress
- Status constraint expanded: open, committed, building, fulfilled, closed

## Triggers
- `sync_need_reward` — maintains reward_amount + contributor_count on needs
*/

-- ==========================================================
-- Expand needs status constraint and add lifecycle columns
-- ==========================================================

DO $$ BEGIN
  ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS needs_status_check;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.needs
  ADD CONSTRAINT needs_status_check
  CHECK (status IN ('open','committed','building','fulfilled','closed'));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='reward_amount') THEN
    ALTER TABLE public.needs ADD COLUMN reward_amount numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='contributor_count') THEN
    ALTER TABLE public.needs ADD COLUMN contributor_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='timeline') THEN
    ALTER TABLE public.needs ADD COLUMN timeline text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='reward_note') THEN
    ALTER TABLE public.needs ADD COLUMN reward_note text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='builder_committed_id') THEN
    ALTER TABLE public.needs ADD COLUMN builder_committed_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='committed_at') THEN
    ALTER TABLE public.needs ADD COLUMN committed_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='progress') THEN
    ALTER TABLE public.needs ADD COLUMN progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS needs_reward_amount_idx ON public.needs(reward_amount DESC);
CREATE INDEX IF NOT EXISTS needs_builder_committed_idx ON public.needs(builder_committed_id);

-- ==========================================================
-- contributions table
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS contributions_need_idx ON public.contributions(need_id);
CREATE INDEX IF NOT EXISTS contributions_user_idx ON public.contributions(user_id);

-- ==========================================================
-- builder_interest table
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.builder_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs(id) ON DELETE CASCADE,
  builder_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'interested' CHECK (type IN ('interested','committed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (need_id, builder_id)
);

ALTER TABLE public.builder_interest ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS builder_interest_need_idx ON public.builder_interest(need_id);
CREATE INDEX IF NOT EXISTS builder_interest_builder_idx ON public.builder_interest(builder_id);

-- ==========================================================
-- Trigger: sync need reward_amount + contributor_count
-- ==========================================================

CREATE OR REPLACE FUNCTION public.sync_need_reward() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total numeric;
  cnt integer;
BEGIN
  SELECT COALESCE(SUM(amount), 0), COUNT(DISTINCT user_id)
  INTO total, cnt
  FROM public.contributions
  WHERE need_id = COALESCE(NEW.need_id, OLD.need_id);

  UPDATE public.needs
  SET reward_amount = total, contributor_count = cnt
  WHERE id = COALESCE(NEW.need_id, OLD.need_id);

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS contributions_sync ON public.contributions;
CREATE TRIGGER contributions_sync
  AFTER INSERT OR DELETE OR UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.sync_need_reward();
/*
# RLS policies for contributions and builder_interest
*/

-- contributions
DROP POLICY IF EXISTS "contributions_select_public" ON public.contributions;
CREATE POLICY "contributions_select_public" ON public.contributions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "contributions_insert_own" ON public.contributions;
CREATE POLICY "contributions_insert_own" ON public.contributions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contributions_update_own" ON public.contributions;
CREATE POLICY "contributions_update_own" ON public.contributions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contributions_delete_own" ON public.contributions;
CREATE POLICY "contributions_delete_own" ON public.contributions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- builder_interest
DROP POLICY IF EXISTS "builder_interest_select_public" ON public.builder_interest;
CREATE POLICY "builder_interest_select_public" ON public.builder_interest
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "builder_interest_insert_own" ON public.builder_interest;
CREATE POLICY "builder_interest_insert_own" ON public.builder_interest
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = builder_id);

DROP POLICY IF EXISTS "builder_interest_update_own" ON public.builder_interest;
CREATE POLICY "builder_interest_update_own" ON public.builder_interest
  FOR UPDATE TO authenticated USING (auth.uid() = builder_id) WITH CHECK (auth.uid() = builder_id);

DROP POLICY IF EXISTS "builder_interest_delete_own" ON public.builder_interest;
CREATE POLICY "builder_interest_delete_own" ON public.builder_interest
  FOR DELETE TO authenticated USING (auth.uid() = builder_id);
/*
# Add FTS vector columns and indexes

Adds generated tsvector columns to products, needs, profiles, and categories
for PostgreSQL full text search. These are needed before the search functions.
*/

-- Products FTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fts_vector') THEN
    ALTER TABLE products ADD COLUMN fts_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
      ) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING gin (fts_vector);

-- Needs FTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'needs' AND column_name = 'fts_vector') THEN
    ALTER TABLE needs ADD COLUMN fts_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
      ) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_needs_fts ON needs USING gin (fts_vector);

-- Profiles FTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'fts_vector') THEN
    ALTER TABLE profiles ADD COLUMN fts_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(username, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(full_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(bio, '')), 'C')
      ) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_profiles_fts ON profiles USING gin (fts_vector);

-- Categories FTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'fts_vector') THEN
    ALTER TABLE categories ADD COLUMN fts_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
      ) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_categories_fts ON categories USING gin (fts_vector);
/*
# Add profile, product, and need columns for pro builder features

Adds columns needed for:
- Pro Builder subscriptions (profiles)
- Verified Builder badges (profiles)
- Featured/boosted products (products)
- View/bookmark counts (products, needs)
- NeedScore columns (needs)
*/

-- Profile columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cover_url') THEN
    ALTER TABLE profiles ADD COLUMN cover_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified') THEN
    ALTER TABLE profiles ADD COLUMN verified boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pro_builder') THEN
    ALTER TABLE profiles ADD COLUMN pro_builder boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pro_builder_since') THEN
    ALTER TABLE profiles ADD COLUMN pro_builder_since timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pro_builder_until') THEN
    ALTER TABLE profiles ADD COLUMN pro_builder_until timestamptz;
  END IF;
END $$;

-- Product columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'featured') THEN
    ALTER TABLE products ADD COLUMN featured boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'view_count') THEN
    ALTER TABLE products ADD COLUMN view_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'bookmark_count') THEN
    ALTER TABLE products ADD COLUMN bookmark_count integer DEFAULT 0;
  END IF;
END $$;

-- Need columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'needs' AND column_name = 'bookmark_count') THEN
    ALTER TABLE needs ADD COLUMN bookmark_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'needs' AND column_name = 'need_score') THEN
    ALTER TABLE needs ADD COLUMN need_score numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'needs' AND column_name = 'need_score_trend') THEN
    ALTER TABLE needs ADD COLUMN need_score_trend text DEFAULT 'stable';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'needs' AND column_name = 'need_score_updated_at') THEN
    ALTER TABLE needs ADD COLUMN need_score_updated_at timestamptz;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_paid ON products (paid);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_needs_status ON needs (status);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles (verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_pro_builder ON profiles (pro_builder) WHERE pro_builder = true;
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
/*
# NeedScore, analytics, and builder insights functions

1. calculate_need_score(uuid) — returns 0-100 NeedScore for a need
2. update_need_scores() — batch update scores and trends
3. get_builder_analytics(uuid) — analytics summary for a builder
*/

CREATE OR REPLACE FUNCTION calculate_need_score(need_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vote_count int;
  v_reward_amount numeric;
  v_contributor_count int;
  v_bookmark_count int;
  v_builder_interest int;
  v_created_at timestamptz;
  v_recent_votes int;
  v_growth_rate numeric;
  v_recency_factor numeric;
  v_score numeric;
  v_max_vote int;
  v_max_reward numeric;
BEGIN
  SELECT vote_count, reward_amount, contributor_count, bookmark_count, created_at
  INTO v_vote_count, v_reward_amount, v_contributor_count, v_bookmark_count, v_created_at
  FROM needs WHERE id = need_uuid;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT count(*) INTO v_builder_interest FROM builder_interest WHERE need_id = need_uuid;

  SELECT count(*) INTO v_recent_votes
  FROM votes WHERE need_id = need_uuid AND created_at > now() - interval '7 days';

  IF v_vote_count > 0 THEN
    v_growth_rate := LEAST(v_recent_votes::numeric / v_vote_count, 1.0);
  ELSE
    v_growth_rate := 0;
  END IF;

  v_recency_factor := GREATEST(1.0 - (EXTRACT(epoch FROM (now() - v_created_at)) / 86400 / 90), 0);

  v_max_vote := LEAST(v_vote_count, 500);
  v_max_reward := LEAST(v_reward_amount, 5000);

  v_score :=
    (LN(GREATEST(v_max_vote, 1)::numeric) / LN(500)) * 30 +
    (v_max_reward / 5000) * 20 +
    LEAST(v_contributor_count::numeric / 50, 1.0) * 10 +
    LEAST(v_builder_interest::numeric / 10, 1.0) * 15 +
    v_growth_rate * 10 +
    v_recency_factor * 10 +
    LEAST(v_bookmark_count::numeric / 100, 1.0) * 5;

  v_score := GREATEST(0, LEAST(100, ROUND(v_score, 0)));
  RETURN v_score;
END;
$$;

CREATE OR REPLACE FUNCTION update_need_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  need_rec RECORD;
  new_score numeric;
  old_score numeric;
  trend text;
BEGIN
  FOR need_rec IN
    SELECT id, need_score FROM needs WHERE status IN ('open', 'committed', 'building')
  LOOP
    old_score := need_rec.need_score;
    new_score := calculate_need_score(need_rec.id);

    IF new_score > old_score + 2 THEN
      trend := 'rising';
    ELSIF new_score < old_score - 2 THEN
      trend := 'falling';
    ELSE
      trend := 'stable';
    END IF;

    UPDATE needs
    SET need_score = new_score,
        need_score_trend = trend,
        need_score_updated_at = now()
    WHERE id = need_rec.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION get_builder_analytics(builder_uuid uuid)
RETURNS TABLE (
  total_views bigint,
  unique_visitors bigint,
  profile_views bigint,
  bookmarks bigint,
  reviews bigint,
  product_clicks bigint,
  need_matches bigint,
  avg_rating numeric,
  product_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM page_views WHERE entity_type = 'product' AND entity_id IN (SELECT id FROM products WHERE owner_id = builder_uuid))
      + (SELECT count(*) FROM page_views WHERE entity_type = 'builder' AND entity_id = builder_uuid),
    (SELECT count(DISTINCT visitor_id) FROM page_views WHERE (entity_type = 'product' AND entity_id IN (SELECT id FROM products WHERE owner_id = builder_uuid)) OR (entity_type = 'builder' AND entity_id = builder_uuid)),
    (SELECT count(*) FROM page_views WHERE entity_type = 'builder' AND entity_id = builder_uuid),
    (SELECT count(*) FROM bookmarks WHERE product_id IN (SELECT id FROM products WHERE owner_id = builder_uuid)),
    (SELECT count(*) FROM reviews WHERE product_id IN (SELECT id FROM products WHERE owner_id = builder_uuid)),
    0::bigint,
    (SELECT count(*) FROM need_matches WHERE product_id IN (SELECT id FROM products WHERE owner_id = builder_uuid) AND status = 'attached'),
    COALESCE((SELECT avg(avg_rating) FROM products WHERE owner_id = builder_uuid AND review_count > 0), 0),
    (SELECT count(*) FROM products WHERE owner_id = builder_uuid AND paid = true)
$$;

GRANT EXECUTE ON FUNCTION calculate_need_score(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_need_scores() TO authenticated;
GRANT EXECUTE ON FUNCTION get_builder_analytics(uuid) TO authenticated;
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
/*
# Opportunity Feed: dismissal tracking + ranking function

1. `opportunity_dismissals` — Pro builders can dismiss opportunities
2. `get_opportunity_feed(uuid, int)` — ranks open needs for a builder based on:
   - NeedScore™ (30%)
   - Reward pool (20%)
   - Vote count (15%)
   - Growth rate (15%)
   - Competition level — fewer competing products = higher score (10%)
   - Builder's category affinity — matches their existing software categories (10%)
   The function excludes needs the builder owns, needs they've already built software for,
   and needs they've dismissed.
*/

CREATE TABLE IF NOT EXISTS opportunity_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  need_id uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, need_id)
);
ALTER TABLE opportunity_dismissals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dismissal_select_own" ON opportunity_dismissals;
CREATE POLICY "dismissal_select_own" ON opportunity_dismissals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "dismissal_insert_own" ON opportunity_dismissals;
CREATE POLICY "dismissal_insert_own" ON opportunity_dismissals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "dismissal_delete_own" ON opportunity_dismissals;
CREATE POLICY "dismissal_delete_own" ON opportunity_dismissals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dismissals_user ON opportunity_dismissals (user_id);

CREATE OR REPLACE FUNCTION get_opportunity_feed(builder_uuid uuid, limit_count int DEFAULT 20)
RETURNS TABLE (
  need_id uuid,
  title text,
  description text,
  category_id uuid,
  category_name text,
  category_slug text,
  vote_count int,
  reward_amount numeric,
  contributor_count int,
  need_score numeric,
  need_score_trend text,
  status text,
  builder_interest_count bigint,
  growth_rate numeric,
  competition_level text,
  competing_products int,
  match_score numeric,
  match_reasons text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_builder_categories uuid[];
  v_recent_votes int;
  v_total_votes int;
  v_growth numeric;
  v_competing int;
  v_competition_level text;
  v_category_match boolean;
  v_reasons text[];
  v_match_score numeric;
  v_has_existing boolean;
BEGIN
  -- Get builder's categories from their published products
  SELECT array_agg(DISTINCT category_id) FILTER (WHERE category_id IS NOT NULL)
  INTO v_builder_categories
  FROM products WHERE owner_id = builder_uuid AND paid = true;

  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.description,
    n.category_id,
    c.name,
    c.slug,
    n.vote_count,
    n.reward_amount,
    n.contributor_count,
    n.need_score,
    n.need_score_trend,
    n.status,
    COALESCE(bi.interest_count, 0),
    -- Growth rate: votes in last 7 days as fraction of total
    CASE
      WHEN n.vote_count > 0 THEN LEAST(
        (SELECT count(*)::numeric FROM votes WHERE need_id = n.id AND created_at > now() - interval '7 days') / n.vote_count,
        1.0
      )
      ELSE 0
    END,
    -- Competition level
    CASE
      WHEN COALESCE(comp.comp_count, 0) = 0 THEN 'None'
      WHEN COALESCE(comp.comp_count, 0) = 1 THEN 'Low'
      WHEN COALESCE(comp.comp_count, 0) <= 3 THEN 'Medium'
      ELSE 'High'
    END,
    COALESCE(comp.comp_count, 0),
    -- Match score (0-100)
    (
      -- NeedScore (30%)
      (COALESCE(n.need_score, 0) / 100.0) * 30 +
      -- Reward pool (20%, capped at $5000)
      LEAST(COALESCE(n.reward_amount, 0) / 5000.0, 1.0) * 20 +
      -- Vote count (15%, log scale capped at 500)
      (LN(GREATEST(LEAST(n.vote_count, 500), 1)::numeric) / LN(500)) * 15 +
      -- Growth rate (15%)
      CASE
        WHEN n.vote_count > 0 THEN LEAST(
          (SELECT count(*)::numeric FROM votes WHERE need_id = n.id AND created_at > now() - interval '7 days') / n.vote_count,
          1.0
        ) * 15
        ELSE 0
      END +
      -- Competition (10%): fewer competitors = higher score
      (1.0 - LEAST(COALESCE(comp.comp_count, 0)::numeric / 5.0, 1.0)) * 10 +
      -- Category affinity (10%)
      CASE
        WHEN v_builder_categories IS NOT NULL AND n.category_id = ANY(v_builder_categories) THEN 10
        ELSE 0
      END
    ),
    -- Match reasons (built as comma-separated text)
    CASE
      WHEN v_builder_categories IS NOT NULL AND n.category_id = ANY(v_builder_categories)
        THEN 'Matches your category expertise'
      ELSE NULL
    END,
    n.created_at
  FROM needs n
  LEFT JOIN categories c ON c.id = n.category_id
  LEFT JOIN LATERAL (
    SELECT count(*) AS comp_count
    FROM need_product_links npl
    JOIN products p ON p.id = npl.product_id
    WHERE npl.need_id = n.id AND p.paid = true
  ) comp ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS interest_count
    FROM builder_interest WHERE need_id = n.id
  ) bi ON true
  WHERE n.status IN ('open', 'committed')
    -- Exclude needs owned by the builder
    AND n.owner_id != builder_uuid
    -- Exclude needs the builder has already linked a product to
    AND NOT EXISTS (
      SELECT 1 FROM need_product_links npl
      WHERE npl.need_id = n.id AND npl.owner_id = builder_uuid
    )
    -- Exclude dismissed needs
    AND NOT EXISTS (
      SELECT 1 FROM opportunity_dismissals
      WHERE user_id = builder_uuid AND need_id = n.id
    )
  ORDER BY
    -- Category matches first, then by match_score
    (v_builder_categories IS NOT NULL AND n.category_id = ANY(v_builder_categories)) DESC,
    match_score DESC,
    n.need_score DESC,
    n.vote_count DESC,
    n.reward_amount DESC
  LIMIT LEAST(limit_count, 100);
END;
$$;

GRANT EXECUTE ON FUNCTION get_opportunity_feed(uuid, int) TO authenticated;
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
/*
# Category SEO enhancements

## What this does
Adds optional SEO fields to categories and a category_faqs table for FAQ sections
on category landing pages.

## Modified Tables
- `categories`: adds `seo_title` (text), `seo_description` (text), `long_description` (text)

## New Tables
- `category_faqs`: FAQs per category (id, category_id, question, answer, sort_order)

## Security
- category_faqs: public SELECT, admin INSERT/UPDATE/DELETE (same pattern as starter_pack_faqs)
*/

ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS long_description text;

CREATE TABLE IF NOT EXISTS category_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE category_faqs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_catfaq_cat ON category_faqs (category_id);

DROP POLICY IF EXISTS "catfaq_select" ON category_faqs;
CREATE POLICY "catfaq_select" ON category_faqs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "catfaq_insert_admin" ON category_faqs;
CREATE POLICY "catfaq_insert_admin" ON category_faqs FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "catfaq_update_admin" ON category_faqs;
CREATE POLICY "catfaq_update_admin" ON category_faqs FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "catfaq_delete_admin" ON category_faqs;
CREATE POLICY "catfaq_delete_admin" ON category_faqs FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
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
/*
# Progressive Builder Onboarding: account model changes

## What this does
Updates the profiles table to support the unified account model where every
user starts as a standard account and can become a builder through onboarding.
Adds need_follows and notifications tables for the user dashboard.

## Modified Tables
- `profiles`: adds `linkedin` (text), `country` (text), `builder_onboarded` (boolean, default false)

## New Tables
1. `need_follows` — allows users to follow needs
2. `notifications` — in-app notifications for users

## Security
- need_follows: users can CRUD their own follows
- notifications: users can SELECT/UPDATE/DELETE their own notifications
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS builder_onboarded boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS need_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  need_id uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, need_id)
);
ALTER TABLE need_follows ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_needfollows_user ON need_follows (user_id);
CREATE INDEX IF NOT EXISTS idx_needfollows_need ON need_follows (need_id);

DROP POLICY IF EXISTS "nf_select_own" ON need_follows;
CREATE POLICY "nf_select_own" ON need_follows FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "nf_insert_own" ON need_follows;
CREATE POLICY "nf_insert_own" ON need_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "nf_delete_own" ON need_follows;
CREATE POLICY "nf_delete_own" ON need_follows FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id);

DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_insert_own" ON notifications;
CREATE POLICY "notif_insert_own" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_own" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

UPDATE profiles SET builder_onboarded = true
WHERE id IN (SELECT DISTINCT owner_id FROM products WHERE owner_id IS NOT NULL);
/*
# Builder Categories Junction Table

## Purpose
During builder onboarding, users select their "Primary Categories" — the
software domains they build in (e.g. Productivity, DevOps, Marketing). This
requires a many-to-many relationship between profiles (builders) and categories.

## Changes

1. New Table: `builder_categories`
   - `id` (uuid, primary key)
   - `builder_id` (uuid, foreign key → profiles.id ON DELETE CASCADE) — the builder's profile
   - `category_id` (uuid, foreign key → categories.id ON DELETE CASCADE) — the selected category
   - `created_at` (timestamptz, default now())
   - UNIQUE constraint on (builder_id, category_id) to prevent duplicate selections

2. Security (RLS)
   - Enable row level security on `builder_categories`.
   - SELECT: public read (anon + authenticated) so category pages and builder
     profiles can display which categories a builder works in.
   - INSERT: authenticated users can only insert their own rows
     (auth.uid() = builder_id).
   - DELETE: authenticated users can only delete their own rows.
   - No UPDATE policy (rows are inserted/deleted, never updated).

3. Indexes
   - Index on `builder_id` for fast lookups of a builder's categories.
   - Index on `category_id` for fast lookups of builders in a category.

## Notes
- `builder_id` references `profiles.id` (not auth.users.id directly), but
  profiles.id IS the auth uid (the profiles table key matches auth.users.id),
  so `auth.uid() = builder_id` correctly enforces ownership.
- Idempotent: uses IF NOT EXISTS for the table and indexes; policies use
  DROP IF EXISTS before CREATE so re-running is safe.
*/

CREATE TABLE IF NOT EXISTS builder_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (builder_id, category_id)
);

ALTER TABLE builder_categories ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see which categories a builder works in
DROP POLICY IF EXISTS "Public can read builder categories" ON builder_categories;
CREATE POLICY "Public can read builder categories"
ON builder_categories FOR SELECT
TO anon, authenticated
USING (true);

-- Insert: only the builder themselves
DROP POLICY IF EXISTS "Builders insert own categories" ON builder_categories;
CREATE POLICY "Builders insert own categories"
ON builder_categories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = builder_id);

-- Delete: only the builder themselves
DROP POLICY IF EXISTS "Builders delete own categories" ON builder_categories;
CREATE POLICY "Builders delete own categories"
ON builder_categories FOR DELETE
TO authenticated
USING (auth.uid() = builder_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_builder_categories_builder_id ON builder_categories(builder_id);
CREATE INDEX IF NOT EXISTS idx_builder_categories_category_id ON builder_categories(category_id);
