/*
# Repoint logo_url for the 9 new Starter Pack industry products (8 of 9)

## Why
8 of the 9 real industry products added in 20260919140000_seed_starter_packs.sql
(Square, Toast, OpenTable, Zillow Premier Agent, Matterport, Buildertrend,
Housecall Pro, DocuSign) now have logo files uploaded to the
`product-images` storage bucket under `editorial/logos/` (confirmed via
the Storage API listing, uploaded today). Same mechanism as the prior logo
migrations: only repoints `logo_url` (+ `updated_at`) at the storage path
the file already sits at -- no code changes.

One file (`idZQPm1aJE_1789841936017.svg`) had no identifying filename --
rendered it to confirm it's the Buildertrend logo before mapping it below,
rather than guessing from the name.

## Still missing
Jobber was not among the uploaded files -- still on the initials fallback.
*/

UPDATE public.products SET logo_url = 'editorial/logos/sqaureup.jpg', updated_at = now() WHERE name = 'Square';
UPDATE public.products SET logo_url = 'editorial/logos/img-toast-logo.svg', updated_at = now() WHERE name = 'Toast';
UPDATE public.products SET logo_url = 'editorial/logos/OpenTable_logo.svg.webp', updated_at = now() WHERE name = 'OpenTable';
UPDATE public.products SET logo_url = 'editorial/logos/Zillow_logo.svg', updated_at = now() WHERE name = 'Zillow Premier Agent';
UPDATE public.products SET logo_url = 'editorial/logos/matterport-seeklogo.svg', updated_at = now() WHERE name = 'Matterport';
UPDATE public.products SET logo_url = 'editorial/logos/idZQPm1aJE_1789841936017.svg', updated_at = now() WHERE name = 'Buildertrend';
UPDATE public.products SET logo_url = 'editorial/logos/Housecall Pro - Copy Logo Vector.svg', updated_at = now() WHERE name = 'Housecall Pro';
UPDATE public.products SET logo_url = 'editorial/logos/Docusign_Full_Color.svg', updated_at = now() WHERE name = 'DocuSign';
