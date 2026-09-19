/*
# Repoint logo_url for 9 more products to newly uploaded logos

## Why
9 of the 12 products left without a logo after 20260902133000 (Adobe Creative
Cloud, Canva, ChatGPT, Jasper, Midjourney, Monday.com, Pipedrive, Salesforce,
Slack) now have real logo files uploaded to the `product-images` storage
bucket under `editorial/logos/` (confirmed via the Storage API listing --
uploaded today, filenames as below). Same mechanism as the original 38: this
migration only repoints `logo_url` (+ `updated_at`) at the storage path the
file already sits at, exactly like a normal LogoUploader upload would
produce -- no code changes, no bucket/visibility changes.

## Still missing (not uploaded, not touched by this migration)
BambooHR, FreshBooks, Microsoft Teams -- still on the initials fallback.
*/

UPDATE public.products SET logo_url = 'editorial/logos/Adobe_Creative_Cloud-Logo.wine.svg', updated_at = now() WHERE name = 'Adobe Creative Cloud';
UPDATE public.products SET logo_url = 'editorial/logos/canva-icon.svg', updated_at = now() WHERE name = 'Canva';
UPDATE public.products SET logo_url = 'editorial/logos/ChatGPT-Logo.wine.svg', updated_at = now() WHERE name = 'ChatGPT';
UPDATE public.products SET logo_url = 'editorial/logos/jasper-icon.svg', updated_at = now() WHERE name = 'Jasper';
UPDATE public.products SET logo_url = 'editorial/logos/midjourney-blue-icon.svg', updated_at = now() WHERE name = 'Midjourney';
UPDATE public.products SET logo_url = 'editorial/logos/monday-dot-com-icon.svg', updated_at = now() WHERE name = 'Monday.com';
UPDATE public.products SET logo_url = 'editorial/logos/Pipedrive-Logo.wine.svg', updated_at = now() WHERE name = 'Pipedrive';
UPDATE public.products SET logo_url = 'editorial/logos/Salesforce.com-Logo.wine.svg', updated_at = now() WHERE name = 'Salesforce';
UPDATE public.products SET logo_url = 'editorial/logos/Slack_Technologies-Mark-Logo.wine.svg', updated_at = now() WHERE name = 'Slack';
