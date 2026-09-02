/*
# Product paid-status functions: admin moderation + free-listing claim

## Problem 1 — admin can't approve/feature listings
`add_product_fee_and_images.sql.sql` correctly revoked UPDATE on `products`
from `authenticated` and re-granted it only for a safe column allowlist that
excludes `paid`, `paid_at`, and `featured` — so a builder can't self-approve
or self-feature their own listing. But admins connect as the same
`authenticated` Postgres role (there is no separate DB role for admins —
`is_admin` is an app-level flag), so this also blocks the admin panel's
Approve/Feature actions on *any* product, including the admin's own.

## Problem 2 — the $10 listing fee can be bypassed at INSERT time
The column revoke above only covers UPDATE. `products_insert_own` RLS only
checks `auth.uid() = owner_id`, so any authenticated user can INSERT a
product row with `paid: true` directly via the REST API, skipping payment
and skipping the "first listing is free" eligibility check (today computed
client-side and trusted at insert time).

## Fix
Three SECURITY DEFINER functions, each running with elevated privileges
(bypassing both RLS and the column-level revoke) but enforcing the real
rule in SQL instead of trusting the client:

1. `admin_approve_product(product_id)` — marks a product paid, admin-only.
2. `admin_set_product_featured(product_id, featured)` — toggles featured, admin-only.
3. `claim_free_product_listing(product_id)` — marks the caller's own product
   paid for free, but only if they're a Pro Builder or this is their first
   paid listing (re-derives eligibility server-side; ignores whatever the
   client believed). Returns whether the claim succeeded.

A companion change (see restrict_product_insert_columns.sql) prevents the
client from setting `paid`/`paid_at`/`featured` directly on INSERT, so every
new listing now starts unpaid and must go through one of these functions or
the Stripe webhook.
*/

CREATE OR REPLACE FUNCTION public.admin_approve_product(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.products
  SET paid = true, paid_at = now()
  WHERE id = product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_product_featured(product_id uuid, featured boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.products
  SET featured = admin_set_product_featured.featured
  WHERE id = product_id;
END;
$$;

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
  v_paid_listing_count int;
BEGIN
  SELECT owner_id, paid INTO v_owner_id, v_already_paid
  FROM public.products WHERE id = product_id;

  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Product not found or not owned by caller';
  END IF;

  IF v_already_paid THEN
    RETURN true;
  END IF;

  SELECT COALESCE(pro_builder, false) INTO v_is_pro
  FROM public.profiles WHERE id = auth.uid();

  SELECT count(*) INTO v_paid_listing_count
  FROM public.products WHERE owner_id = auth.uid() AND paid = true;

  IF v_is_pro OR v_paid_listing_count = 0 THEN
    UPDATE public.products SET paid = true, paid_at = now() WHERE id = product_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_product(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_product_featured(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_free_product_listing(uuid) TO authenticated;
