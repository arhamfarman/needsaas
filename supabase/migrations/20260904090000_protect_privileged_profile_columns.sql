/*
# Protect privileged profile columns from self-service escalation

## Problem
`profiles_update_own` (base schema) is a full-row RLS policy with no
column-level restriction: `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`.
Every column added to `profiles` since then -- including `is_admin`,
`verified`, `pro_builder`, `pro_builder_since`, `pro_builder_until` -- has
been directly self-editable by any authenticated user via a plain REST
PATCH, with no migration ever adding the column-level GRANT/REVOKE that
`products.paid` already got (see restrict_product_insert_columns.sql). In
practice this means any signed-in user could set their own row's
`is_admin = true` (full admin access), `verified = true`, or
`pro_builder = true` (bypassing the Stripe subscription flow entirely, plus
its since/until dates) with a single unauthenticated-by-anything API call --
no admin action, no payment, no RLS check that actually looked at which
column was being touched.

## Fix
Revoke UPDATE on `profiles` from `authenticated` entirely, then re-grant it
only for the columns real self-editing flows actually use in this app --
confirmed against every place that currently updates a user's own profile
(components/forms/profile-form.tsx and app/onboarding/builder/page.tsx are
the only two). The five privileged columns are deliberately excluded; they
can now only change via the SECURITY DEFINER functions in the companion
migration (admin_profile_management_functions.sql), or via the Stripe
webhook, which authenticates with the service-role key and is unaffected by
this (service_role bypasses RLS and column grants entirely -- confirmed by
reading supabase/functions/stripe-webhook/index.ts).

RLS itself is unchanged -- `profiles_update_own` and `profiles_update_admin`
still gate which *row* can be touched. This migration adds the missing
column-level layer on top, the same defense-in-depth pattern already used
for `products.paid`/`products.featured`.

`id`, `created_at`, and `fts_vector` are correctly excluded from the
re-grant too: `id`/`created_at` should never be client-writable, and
`fts_vector` is a generated column Postgres itself refuses direct writes to
regardless of grants.
*/

REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (
  username, full_name, bio, avatar_url, cover_url, website, twitter, github,
  linkedin, location, country, builder_onboarded, updated_at
) ON public.profiles TO authenticated;
