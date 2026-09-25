/*
# Builder product submission: richer product fields + fix first-listing-free bypass

## Context
NeedSaaS is adding a standalone /submit-product flow so a builder can list a
product they already built without it needing to respond to a Need. This
migration:
1. Adds the extra structured fields the new submission form collects, so
   product pages are genuinely useful (not just a one-line description).
2. Fixes a real bypass in the existing "first listing free" entitlement.

## Problem: the free-listing bypass
`claim_free_product_listing()` (see 20260902120100_product_paid_status_functions.sql)
currently derives eligibility from
  `SELECT count(*) FROM products WHERE owner_id = auth.uid() AND paid = true`
-- i.e. "do I *currently* have zero paid products". `products_delete_own`
already lets any owner delete their own product with no restriction. So the
existing flow is: create product -> claim free -> delete it -> create a new
product -> claim free again, repeatable indefinitely. This migration adds a
lifetime `profiles.free_product_claimed` flag instead, set once and never
reset by a delete, and rewrites the function to check that instead of a
live count.

## What this does
1. `profiles.free_product_claimed` -- lifetime flag, not reversible by the
   client (profiles UPDATE is already column-restricted to a safe allowlist
   in protect_privileged_profile_columns.sql; this new column is
   deliberately NOT added to that grant, so only SECURITY DEFINER functions
   can set it). Backfilled `true` for any account that already has a paid
   product today, so existing users don't get a second free ride under the
   new logic.
2. Rewrites `claim_free_product_listing()` to check/set that flag instead of
   counting currently-paid rows.
3. New `products` columns for the richer submission form: `product_type`,
   `problem_solved`, `target_audience`, `key_features` (text[]),
   `how_it_works`, `demo_url`, `video_url`, `founder_name`. All nullable /
   sensibly defaulted so every one of the existing 59 products keeps working
   unchanged -- the detail page renders each new section only when present.
4. Extends the existing INSERT/UPDATE column-privilege grants (added in
   restrict_product_insert_columns.sql / add_product_fee_and_images.sql.sql)
   to include the new columns, plus `doc_url` on UPDATE, which was missing
   from the original UPDATE grant -- an existing oversight that blocked
   editing a product's docs link even though the column itself is safe.
5. A light duplicate-submission guard: a builder can't have two products
   with the same name (case-insensitive) -- catches accidental double
   submits without building a moderation system.

## What this does NOT do
No new moderation/approval table. Publishing continues to work exactly as
today: a product is public once `paid = true` (via Stripe or a successful
free claim), and admins can already unpublish/delete via the existing admin
panel. Per the explicit instruction not to build a large moderation system
for a soft-launch feature.
*/

-- ---------- profiles: lifetime free-listing flag ----------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_product_claimed boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET free_product_claimed = true
WHERE id IN (SELECT DISTINCT owner_id FROM public.products WHERE paid = true);

-- ---------- products: new submission-form columns ----------
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'saas';
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE public.products ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN ('saas', 'ai_agent', 'ai_tool', 'automation', 'dev_tool', 'api', 'other'));

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS problem_solved text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS key_features text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS how_it_works text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS demo_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS founder_name text;

-- ---------- product-images: make bucket public (fixes broken OG/JSON-LD images) ----------
-- The bucket was created private, but its storage RLS SELECT policy already
-- grants `anon, authenticated` read on every object in it (see
-- add_product_fee_and_images.sql.sql's product_images_read policy) -- so it
-- was already effectively public-readable, just only via a signed URL. Every
-- product's og:image/JSON-LD `image` field currently uses the raw storage
-- PATH (e.g. "editorial/logos/slack.svg") directly as if it were an absolute
-- URL, which resolves to nothing for any crawler (Twitter/LinkedIn/Discord
-- previews, Google Images, AI search) -- confirmed broken for every one of
-- the 59 products that has a logo. Flipping `public` to true lets a plain
-- `/storage/v1/object/public/product-images/<path>` URL work permanently,
-- with no reduction in exposure versus the already-public RLS policy.
UPDATE storage.buckets SET public = true WHERE id = 'product-images';

-- ---------- light duplicate guard ----------
CREATE UNIQUE INDEX IF NOT EXISTS products_owner_name_unique
  ON public.products (owner_id, lower(name));

-- ---------- column-level privileges: extend existing grants ----------
-- Additive: does not need to repeat the original column lists from
-- restrict_product_insert_columns.sql / add_product_fee_and_images.sql.sql.
GRANT INSERT (
  product_type, problem_solved, target_audience, key_features, how_it_works,
  demo_url, video_url, founder_name
) ON public.products TO authenticated;

GRANT UPDATE (
  doc_url, product_type, problem_solved, target_audience, key_features,
  how_it_works, demo_url, video_url, founder_name
) ON public.products TO authenticated;

-- ---------- claim_free_product_listing: fix the bypass ----------
CREATE OR REPLACE FUNCTION public.claim_free_product_listing(product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_already_paid boolean;
  v_is_pro boolean;
  v_already_claimed boolean;
BEGIN
  SELECT owner_id, paid INTO v_owner_id, v_already_paid
  FROM public.products WHERE id = product_id;

  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Product not found or not owned by caller';
  END IF;

  IF v_already_paid THEN
    RETURN true;
  END IF;

  SELECT COALESCE(pro_builder, false), COALESCE(free_product_claimed, false)
  INTO v_is_pro, v_already_claimed
  FROM public.profiles WHERE id = auth.uid();

  IF v_is_pro OR NOT v_already_claimed THEN
    UPDATE public.products SET paid = true, paid_at = now() WHERE id = product_id;
    UPDATE public.profiles SET free_product_claimed = true WHERE id = auth.uid();
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
