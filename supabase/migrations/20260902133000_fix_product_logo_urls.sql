/*
# Fix product logo_url: use storage paths, not external URLs

The prior migration (add_product_logos.sql) set logo_url to full external
https:// URLs pointing at the Simple Icons CDN. That's incompatible with
this app's ProductImage component, which always treats logo_url as a
PRIVATE SUPABASE STORAGE PATH and resolves it via
supabase.storage.from('product-images').createSignedUrl(path, ...) — every
logo silently fell back to the initials avatar instead of erroring, which is
why this went unnoticed until a visual check.

Fix: the same 38 Simple Icons SVGs (CC0-licensed brand icon set, verified
against the official simple-icons data file — not scraped from any
company's own site) were uploaded into the existing product-images storage
bucket at editorial/logos/<slug>.svg via the Supabase CLI's storage cp
command, using the
already-authenticated project session — no end-user password was created,
stored, or used anywhere in this process. This migration just repoints
logo_url at those storage paths, exactly like a normal LogoUploader upload
would produce, so the existing ProductImage component resolves them
correctly with no code changes needed.

Only touches logo_url (+ updated_at) on these 38 rows — no other columns,
no other products.
*/


UPDATE public.products SET logo_url = 'editorial/logos/zoom.svg', updated_at = now() WHERE name = 'Zoom';
UPDATE public.products SET logo_url = 'editorial/logos/discord.svg', updated_at = now() WHERE name = 'Discord';
UPDATE public.products SET logo_url = 'editorial/logos/notion.svg', updated_at = now() WHERE name = 'Notion';
UPDATE public.products SET logo_url = 'editorial/logos/asana.svg', updated_at = now() WHERE name = 'Asana';
UPDATE public.products SET logo_url = 'editorial/logos/trello.svg', updated_at = now() WHERE name = 'Trello';
UPDATE public.products SET logo_url = 'editorial/logos/clickup.svg', updated_at = now() WHERE name = 'ClickUp';
UPDATE public.products SET logo_url = 'editorial/logos/linear.svg', updated_at = now() WHERE name = 'Linear';
UPDATE public.products SET logo_url = 'editorial/logos/jira.svg', updated_at = now() WHERE name = 'Jira';
UPDATE public.products SET logo_url = 'editorial/logos/airtable.svg', updated_at = now() WHERE name = 'Airtable';
UPDATE public.products SET logo_url = 'editorial/logos/calendly.svg', updated_at = now() WHERE name = 'Calendly';
UPDATE public.products SET logo_url = 'editorial/logos/figma.svg', updated_at = now() WHERE name = 'Figma';
UPDATE public.products SET logo_url = 'editorial/logos/mailchimp.svg', updated_at = now() WHERE name = 'Mailchimp';
UPDATE public.products SET logo_url = 'editorial/logos/brevo.svg', updated_at = now() WHERE name = 'Brevo';
UPDATE public.products SET logo_url = 'editorial/logos/kit.svg', updated_at = now() WHERE name = 'Kit (formerly ConvertKit)';
UPDATE public.products SET logo_url = 'editorial/logos/hootsuite.svg', updated_at = now() WHERE name = 'Hootsuite';
UPDATE public.products SET logo_url = 'editorial/logos/buffer.svg', updated_at = now() WHERE name = 'Buffer';
UPDATE public.products SET logo_url = 'editorial/logos/semrush.svg', updated_at = now() WHERE name = 'Semrush';
UPDATE public.products SET logo_url = 'editorial/logos/hubspot.svg', updated_at = now() WHERE name = 'HubSpot CRM';
UPDATE public.products SET logo_url = 'editorial/logos/github.svg', updated_at = now() WHERE name = 'GitHub';
UPDATE public.products SET logo_url = 'editorial/logos/vercel.svg', updated_at = now() WHERE name = 'Vercel';
UPDATE public.products SET logo_url = 'editorial/logos/postman.svg', updated_at = now() WHERE name = 'Postman';
UPDATE public.products SET logo_url = 'editorial/logos/webflow.svg', updated_at = now() WHERE name = 'Webflow';
UPDATE public.products SET logo_url = 'editorial/logos/shopify.svg', updated_at = now() WHERE name = 'Shopify';
UPDATE public.products SET logo_url = 'editorial/logos/bigcommerce.svg', updated_at = now() WHERE name = 'BigCommerce';
UPDATE public.products SET logo_url = 'editorial/logos/squarespace.svg', updated_at = now() WHERE name = 'Squarespace';
UPDATE public.products SET logo_url = 'editorial/logos/zapier.svg', updated_at = now() WHERE name = 'Zapier';
UPDATE public.products SET logo_url = 'editorial/logos/make.svg', updated_at = now() WHERE name = 'Make';
UPDATE public.products SET logo_url = 'editorial/logos/grammarly.svg', updated_at = now() WHERE name = 'Grammarly';
UPDATE public.products SET logo_url = 'editorial/logos/googleanalytics.svg', updated_at = now() WHERE name = 'Google Analytics';
UPDATE public.products SET logo_url = 'editorial/logos/mixpanel.svg', updated_at = now() WHERE name = 'Mixpanel';
UPDATE public.products SET logo_url = 'editorial/logos/quickbooks.svg', updated_at = now() WHERE name = 'QuickBooks';
UPDATE public.products SET logo_url = 'editorial/logos/xero.svg', updated_at = now() WHERE name = 'Xero';
UPDATE public.products SET logo_url = 'editorial/logos/gusto.svg', updated_at = now() WHERE name = 'Gusto';
UPDATE public.products SET logo_url = 'editorial/logos/greenhouse.svg', updated_at = now() WHERE name = 'Greenhouse';
UPDATE public.products SET logo_url = 'editorial/logos/zendesk.svg', updated_at = now() WHERE name = 'Zendesk';
UPDATE public.products SET logo_url = 'editorial/logos/intercom.svg', updated_at = now() WHERE name = 'Intercom';
UPDATE public.products SET logo_url = 'editorial/logos/1password.svg', updated_at = now() WHERE name = '1Password';
UPDATE public.products SET logo_url = 'editorial/logos/bitwarden.svg', updated_at = now() WHERE name = 'Bitwarden';
