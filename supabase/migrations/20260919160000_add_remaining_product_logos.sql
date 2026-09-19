/*
# Repoint logo_url for the last 3 products missing logos

## Why
The final 3 products left without a logo after 20260919150000 (BambooHR,
FreshBooks, Microsoft Teams) now have logo files uploaded to the
`product-images` storage bucket under `editorial/logos/` (confirmed via the
Storage API listing -- uploaded today). Same mechanism as the prior two
logo migrations: only repoints `logo_url` (+ `updated_at`) at the storage
path the file already sits at -- no code changes.

All 50 catalog products now have a real logo.
*/

UPDATE public.products SET logo_url = 'editorial/logos/BambooHR_logo.svg.webp', updated_at = now() WHERE name = 'BambooHR';
UPDATE public.products SET logo_url = 'editorial/logos/FreshBooks_Cloud_Accounting_Logo.svg.webp', updated_at = now() WHERE name = 'FreshBooks';
UPDATE public.products SET logo_url = 'editorial/logos/Microsoft_Office_Teams.webp', updated_at = now() WHERE name = 'Microsoft Teams';
