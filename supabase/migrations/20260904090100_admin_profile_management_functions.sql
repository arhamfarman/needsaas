/*
# Admin-only profile-flag management functions

## Problem
After protect_privileged_profile_columns.sql revokes direct client UPDATE on
is_admin/verified/pro_builder, nothing can change them through the normal
client except the Stripe webhook (service role, for verified/pro_builder
only -- it never touches is_admin). Admins still need a controlled way to
grant/revoke admin access and to manually verify or Pro-Builder a user --
app/admin/users/page.tsx already has UI for exactly this, previously relying
on the now-revoked direct table update.

## Fix
Three SECURITY DEFINER functions, following the same pattern already
established by admin_approve_product/admin_set_product_featured
(product_paid_status_functions.sql): each re-checks the CALLER's own
`profiles.is_admin` value server-side on every call -- never trusts a
frontend flag or a value passed as an argument -- and, being SECURITY
DEFINER, bypasses RLS/column grants only for the one column it updates. The
function itself is the access control; the GRANT EXECUTE below is what
makes it callable at all, not a substitute for the in-function admin check.

`admin_set_is_admin` additionally refuses to let a caller target their own
row, so an admin can't accidentally revoke themselves through this path
(self-promotion by a non-admin is already impossible: the admin check above
runs against the CALLER's current row before any update happens, so a
non-admin fails that check regardless of which target_user_id they pass).

All three return void and signal failure via RAISE EXCEPTION, matching the
existing admin_approve_product/admin_set_product_featured pattern -- this
surfaces as a normal populated `error` field in the Supabase client's RPC
response (success = no error), which is what app/admin/users/page.tsx (and
any other caller) already checks for.
*/

CREATE OR REPLACE FUNCTION public.admin_set_is_admin(target_user_id uuid, new_is_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own admin status through this function';
  END IF;

  UPDATE public.profiles SET is_admin = new_is_admin WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_verified(target_user_id uuid, new_verified boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.profiles SET verified = new_verified WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_pro_builder(target_user_id uuid, new_pro_builder boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.profiles SET pro_builder = new_pro_builder WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_is_admin(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_verified(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_pro_builder(uuid, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_set_is_admin(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_verified(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_pro_builder(uuid, boolean) TO authenticated;
