/*
# Make products.description optional

## Why
The /submit-product conversion redesign settled on Product Name + Website
URL + Short Tagline as the true minimum viable submission -- Description,
Problem, Audience, Features, etc. are all meant to be optional to maximize
completion rate. Description was still `NOT NULL` at the database level
from the original schema (`20260804114937_create_needsaas_schema.sql.sql`),
so even after removing the client-side validation, a description-less
submission would still be rejected by the database. This migration is the
other half of that change -- see components/forms/product-form.tsx for the
corresponding validation swap (url now required, description no longer is).

## What this does
Drops the NOT NULL constraint on `products.description`. Every existing
product already has a real description and is completely unaffected --
this only changes what's *allowed* going forward, not any existing row.

Website URL becomes the new required identity field instead (validated
client-side only, same as name/tagline always have been -- `url` was
already nullable at the database level and stays that way; there's no
reason to add a NOT NULL there since existing products predating this
change may not have one).
*/

ALTER TABLE public.products ALTER COLUMN description DROP NOT NULL;
