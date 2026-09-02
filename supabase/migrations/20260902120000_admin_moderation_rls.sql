/*
# Admin moderation RLS bypass for core content tables

## Problem
The admin CMS (under app/admin) lets an admin pin/feature/close/delete any need,
verify/promote any builder profile, and un-report/delete any review. All of
these call .update()/.delete() through the regular `authenticated` Postgres
role using the logged-in admin's own session.

The `_own` RLS policies on `needs`, `profiles`, and `reviews` only ever allow
a row's own owner/user to write to it (auth.uid() = owner_id/user_id/id).
There has never been an `is_admin`-bypass policy on these three tables, unlike
`blog_tags`, `category_faqs`, and `starter_packs`, which already got one.
As a result every admin moderation action on someone else's need/profile/review
silently affects 0 rows (RLS filters rows out rather than erroring).

`products` has the same DELETE gap (an admin can't remove someone else's
listing). `products` UPDATE is intentionally left alone here — `paid`,
`paid_at`, and `featured` are handled by SECURITY DEFINER functions in a
companion migration instead, because those columns also have column-level
UPDATE privileges revoked from `authenticated` (see
add_product_fee_and_images.sql.sql), which a same-role RLS policy can't
override.

## What this does
Adds one additional permissive policy per table/action, gated on
`profiles.is_admin = true`, mirroring the existing working pattern. These are
*additional* policies (OR'd with the existing owner policies), so no existing
owner-write behavior changes.
*/

-- ---------- needs ----------
DROP POLICY IF EXISTS "needs_update_admin" ON public.needs;
CREATE POLICY "needs_update_admin" ON public.needs
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "needs_delete_admin" ON public.needs;
CREATE POLICY "needs_delete_admin" ON public.needs
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ---------- profiles ----------
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- ---------- reviews ----------
DROP POLICY IF EXISTS "reviews_update_admin" ON public.reviews;
CREATE POLICY "reviews_update_admin" ON public.reviews
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "reviews_delete_admin" ON public.reviews;
CREATE POLICY "reviews_delete_admin" ON public.reviews
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ---------- products (delete only — paid/paid_at/featured handled via RPC) ----------
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
