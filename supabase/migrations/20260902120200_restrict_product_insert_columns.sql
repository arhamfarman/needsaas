/*
# Restrict which product columns a builder can set on INSERT

## Problem
`add_product_fee_and_images.sql.sql` revoked UPDATE on `paid`/`paid_at` for
`authenticated`, but never touched INSERT. Postgres column-level privileges
are separate per command, so INSERT stayed fully open on every column —
any authenticated user could INSERT a product row with `paid: true` /
`featured: true` directly, bypassing the $10 listing fee entirely.

## Fix
Revoke INSERT on `products` from `authenticated`, then re-grant it only for
the columns the product form actually sets (`owner_id` isn't included below
because the app never sets it explicitly — it relies on its `DEFAULT
auth.uid()`, and Postgres only checks column privileges for columns an
INSERT statement explicitly lists). `paid`, `paid_at`, `featured`,
`view_count`, `bookmark_count`, `review_count`, and `avg_rating` are
excluded, so every new listing starts at its safe defaults (paid=false,
featured=false, counts=0) regardless of what a client tries to send.
Legitimate free listings now go through `claim_free_product_listing()`
(see product_paid_status_functions.sql) instead.
*/

REVOKE INSERT ON public.products FROM authenticated;
GRANT INSERT (
  name, tagline, description, url, repo_url, doc_url, pricing, price_from,
  logo_url, images, category_id
) ON public.products TO authenticated;
