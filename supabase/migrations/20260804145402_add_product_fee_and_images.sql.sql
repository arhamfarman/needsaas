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
