/*
# Tighten RLS policies that were open to any authenticated user

## Problem
Found during the soft-launch security audit: several policies on
`categories`, `tags`, `product_tags`, `need_tags`, and `need_matches` use
`USING (true)` / `WITH CHECK (true)` for any `authenticated` user on
INSERT/UPDATE/DELETE, rather than being scoped to the row's real owner or to
admins. Concretely, before this migration:
  - Any signed-in user can create or rewrite the site's category taxonomy
    (`categories_insert_own`/`categories_update_own`, despite the "_own"
    name -- neither actually checked ownership).
  - Any signed-in user can rename a shared tag (`tags_update`).
  - Any signed-in user can attach or remove a tag on *any* product or need,
    not just their own (`product_tags_insert/delete`, `need_tags_insert/delete`).
  - Any signed-in user can rewrite any `need_matches` row for any
    product/need pair (`need_matches_update`).
None of these are data-theft (all these tables are already public via SELECT),
but they're real spam/defacement/tampering surface on a live marketplace.

## What this does
Replaces each open policy with one scoped to the actual owner (via the
related product/need's `owner_id`) or to admins, using the same
`EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)`
pattern already used for admin bypass policies elsewhere (see
20260902120000_admin_moderation_rls.sql). `tags_insert` (creating a brand new
shared tag) is left open to any authenticated user -- it doesn't let anyone
interfere with another user's existing content, only add a new tag name to
the shared vocabulary.
*/

-- ---------- categories: admin-only writes ----------
DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ---------- tags: renaming a shared tag is admin-only ----------
DROP POLICY IF EXISTS "tags_update" ON public.tags;
CREATE POLICY "tags_update_admin" ON public.tags
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ---------- product_tags: only the product's owner can tag/untag it ----------
DROP POLICY IF EXISTS "product_tags_insert" ON public.product_tags;
CREATE POLICY "product_tags_insert_own" ON public.product_tags
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "product_tags_delete" ON public.product_tags;
CREATE POLICY "product_tags_delete_own" ON public.product_tags
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND owner_id = auth.uid()));

-- ---------- need_tags: only the need's owner can tag/untag it ----------
DROP POLICY IF EXISTS "need_tags_insert" ON public.need_tags;
CREATE POLICY "need_tags_insert_own" ON public.need_tags
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.needs WHERE id = need_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "need_tags_delete" ON public.need_tags;
CREATE POLICY "need_tags_delete_own" ON public.need_tags
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.needs WHERE id = need_id AND owner_id = auth.uid()));

-- ---------- need_matches: only the matched product's owner (or admin) can update ----------
DROP POLICY IF EXISTS "need_matches_update" ON public.need_matches;
CREATE POLICY "need_matches_update_own_or_admin" ON public.need_matches
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
