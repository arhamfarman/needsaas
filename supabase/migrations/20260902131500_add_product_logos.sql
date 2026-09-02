/*
# Product logos via Simple Icons (CC0-licensed brand icon set)

Sets logo_url for products whose brand icon exists in Simple Icons
(https://simpleicons.org), hotlinked from their CDN rather than stored in
Supabase storage — avoids any question of copying/rehosting trademarked
assets while still giving these listings a real icon instead of the
initials-avatar fallback.

Deliberately NOT set for products absent from the set (Slack, Microsoft
Teams, Monday.com, Canva, Adobe Creative Cloud, Salesforce, Pipedrive,
ChatGPT, Jasper, Midjourney, FreshBooks, BambooHR — several of these were
likely removed from Simple Icons after trademark takedown requests, which is
exactly the kind of risk this deliberately avoids). Those keep the existing
initials-avatar fallback already used throughout the product card/detail
components.
*/


UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/zoom', updated_at = now() WHERE name = 'Zoom';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/discord', updated_at = now() WHERE name = 'Discord';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/notion', updated_at = now() WHERE name = 'Notion';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/asana', updated_at = now() WHERE name = 'Asana';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/trello', updated_at = now() WHERE name = 'Trello';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/clickup', updated_at = now() WHERE name = 'ClickUp';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/linear', updated_at = now() WHERE name = 'Linear';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/jira', updated_at = now() WHERE name = 'Jira';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/airtable', updated_at = now() WHERE name = 'Airtable';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/calendly', updated_at = now() WHERE name = 'Calendly';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/figma', updated_at = now() WHERE name = 'Figma';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/mailchimp', updated_at = now() WHERE name = 'Mailchimp';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/brevo', updated_at = now() WHERE name = 'Brevo';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/kit', updated_at = now() WHERE name = 'Kit (formerly ConvertKit)';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/hootsuite', updated_at = now() WHERE name = 'Hootsuite';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/buffer', updated_at = now() WHERE name = 'Buffer';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/semrush', updated_at = now() WHERE name = 'Semrush';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/hubspot', updated_at = now() WHERE name = 'HubSpot CRM';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/github', updated_at = now() WHERE name = 'GitHub';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/vercel', updated_at = now() WHERE name = 'Vercel';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/postman', updated_at = now() WHERE name = 'Postman';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/webflow', updated_at = now() WHERE name = 'Webflow';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/shopify', updated_at = now() WHERE name = 'Shopify';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/bigcommerce', updated_at = now() WHERE name = 'BigCommerce';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/squarespace', updated_at = now() WHERE name = 'Squarespace';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/zapier', updated_at = now() WHERE name = 'Zapier';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/make', updated_at = now() WHERE name = 'Make';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/grammarly', updated_at = now() WHERE name = 'Grammarly';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/googleanalytics', updated_at = now() WHERE name = 'Google Analytics';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/mixpanel', updated_at = now() WHERE name = 'Mixpanel';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/quickbooks', updated_at = now() WHERE name = 'QuickBooks';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/xero', updated_at = now() WHERE name = 'Xero';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/gusto', updated_at = now() WHERE name = 'Gusto';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/greenhouse', updated_at = now() WHERE name = 'Greenhouse';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/zendesk', updated_at = now() WHERE name = 'Zendesk';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/intercom', updated_at = now() WHERE name = 'Intercom';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/1password', updated_at = now() WHERE name = '1Password';
UPDATE public.products SET logo_url = 'https://cdn.simpleicons.org/bitwarden', updated_at = now() WHERE name = 'Bitwarden';
