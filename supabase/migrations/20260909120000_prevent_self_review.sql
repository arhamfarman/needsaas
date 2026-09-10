/*
# Prevent a product owner from reviewing their own product

## Problem
Found during launch-readiness cleanup (2026-09-09): nothing in the `reviews`
INSERT policy checked whether the reviewer was also the product's owner. The
UI already computes `isOwner` elsewhere on the product detail page but never
reused it to gate the review form, so a builder could post a review on their
own listing -- confirmed live: the one review in production before this
cleanup was a 5-star self-review by a product's own owner on their own
(also-removed) test product.

## Fix
Client-side, the review form is now hidden entirely for the product's own
owner (components/product-detail-view.tsx), with a clear message shown
instead. That's a UI convenience, not the real boundary -- per the project's
own standing pattern (see e.g. the column-privilege restriction on
products.paid), the actual enforcement belongs at the database layer so it
holds regardless of what the client sends. This migration adds that: the
INSERT policy on `reviews` now also requires that the inserting user is NOT
the owner of the product being reviewed.

No changes to SELECT, UPDATE, or DELETE -- a review, once legitimately
created by a non-owner, is still only editable/deletable by its own author
exactly as before. No existing legitimate reviews are affected; the one
review that violated this rule was already removed manually as part of the
same cleanup pass, so this migration has nothing to retroactively fix.
*/

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.products p WHERE p.id = product_id AND p.owner_id = auth.uid()
    )
  );
