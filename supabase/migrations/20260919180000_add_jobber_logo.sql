/*
# Repoint logo_url for Jobber -- the last product missing a logo

## Why
The final product left without a logo after 20260919170000 (Jobber) now
has a logo file uploaded to the `product-images` storage bucket under
`editorial/logos/` (confirmed via the Storage API listing, uploaded
today). Same mechanism as the prior logo migrations.

All 59 catalog products (the original 50 plus the 9 new industry products
added for Starter Packs) now have a real logo.
*/

UPDATE public.products SET logo_url = 'editorial/logos/jobber-seeklogo.svg', updated_at = now() WHERE name = 'Jobber';
