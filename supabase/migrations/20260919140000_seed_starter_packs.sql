/*
# Seed 12 curated Starter Packs (software + AI agents + automation) + a
# small number of real industry-specific products

## Why
The Starter Packs section (`/starter-packs`) had zero published packs, and
NeedSaaS's positioning was updated to make clear a Need isn't limited to
"software that already exists" -- it can be an AI agent, an agentic
workflow, or a business-automation request just as validly. This seeds 12
real, editorially curated packs, each organized into up to four sections:
Software (real linked products), AI Agents (real, general-purpose AI tools
that can be applied to the vertical), Automations (real workflow/automation
tools), and Ideas (illustrative example Need prompts -- NOT real posted
Needs; see the content policy below).

## Content policy (same as 20260902130000_seed_launch_content.sql)
- Every product/pack description states only stable, well-established
  facts. No pricing figures, ratings, user counts, testimonials, or awards
  are invented.
- No fake Needs, reviews, or builder activity are created by this
  migration. The "Ideas" section under each pack (`starter_pack_ideas`,
  added in 20260919130000) holds illustrative example prompts only -- the
  frontend renders this under a heading like "Ideas you could post," never
  language implying real aggregate demand (e.g. never "Popular Needs").
- Packs link only to real software products, owned by the same editorial
  `needsaas` profile already used for the existing product catalog. The
  "AI Agents" and "Automations" sections link to real, general-purpose
  tools (ChatGPT, Jasper, Midjourney, Zapier, Make, Intercom's built-in AI
  agent) rather than inventing a specific named "AI agent product" for
  every vertical that doesn't actually exist as an off-the-shelf tool --
  where no real product fits, that's exactly what the Ideas section is for.
- No product logos/cover images are set (same reasoning as the original
  seed: avoids any logo-usage-rights question for this batch).
- All 12 packs are inserted with `published = true` so the section isn't
  empty at launch -- this is curated editorial content, not
  user-generated, consistent with how the existing 50-product catalog is
  already presented.

## Requires
Same precondition as 20260902130000: a profile with username 'needsaas'
must already exist. Also requires 20260919130000 (adds
starter_pack_products.section and the starter_pack_ideas table) to have
already run.
*/

DO $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT id INTO v_owner_id FROM public.profiles WHERE username = 'needsaas';
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Content owner profile "%" not found. Sign up that account first, then re-run this migration.', 'needsaas';
  END IF;
END $$;

-- ============================================================
-- New real products (idempotent -- matches 20260902130000's pattern)
-- ============================================================

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Square', 'Point-of-sale and payments for in-person and online selling', 'Square provides point-of-sale hardware and software for accepting in-person payments, alongside online checkout, invoicing, and basic inventory tracking. It is built to get a small business taking payments quickly, with per-transaction pricing rather than a large upfront cost.', 'https://squareup.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'ecommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Square');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Toast', 'Point-of-sale built specifically for restaurants', 'Toast is a point-of-sale and restaurant management platform built around food-service workflows -- order entry, kitchen display screens, online ordering, and payments in one system -- rather than general retail POS software adapted for restaurants.', 'https://pos.toasttab.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'ecommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Toast');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'OpenTable', 'Reservation and waitlist management for restaurants', 'OpenTable manages restaurant reservations, walk-in waitlists, and table assignments, and lists a restaurant in its diner-facing app and website so it can be found and booked by new guests.', 'https://www.opentable.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'OpenTable');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Zillow Premier Agent', 'Buyer leads and advertising for real estate agents', 'Zillow Premier Agent connects real estate agents with home buyers and sellers actively browsing listings on Zillow, providing lead contact information and a basic CRM for following up, plus advertising placement on relevant listing pages.', 'https://www.zillow.com/premier-agent/', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Zillow Premier Agent');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Matterport', '3D virtual tours for property listings', 'Matterport creates interactive 3D walkthroughs and floor plans from photos or a 3D camera, commonly used for real estate listings so buyers can tour a property remotely before an in-person visit.', 'https://matterport.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Matterport');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Buildertrend', 'Project management built for construction and remodeling', 'Buildertrend is project management software for construction and remodeling businesses, covering scheduling, budgeting, client communication, and change orders in one system built around how construction projects actually run, rather than a general-purpose project tool adapted for the trade.', 'https://buildertrend.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Buildertrend');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Jobber', 'Scheduling, quoting, and invoicing for home service businesses', 'Jobber handles scheduling, quoting, invoicing, and payment collection for home service businesses like contractors, cleaners, and landscapers, with route planning and a client-facing portal for approving quotes and paying invoices online.', 'https://getjobber.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Jobber');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Housecall Pro', 'Field service management for home service teams', 'Housecall Pro is field service management software for scheduling jobs, dispatching technicians, invoicing, and taking payments, built for teams like cleaning, HVAC, and other in-home service businesses that manage a mobile workforce.', 'https://www.housecallpro.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Housecall Pro');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'DocuSign', 'E-signatures and agreement workflows', 'DocuSign lets you send documents for legally binding electronic signature and track their status until completed, and includes workflow tools for routing contracts, agreements, and forms through multiple signers.', 'https://www.docusign.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'security'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'DocuSign');

-- ============================================================
-- Packs. Each block: pack row, software-section products,
-- ai_agent-section products, automation-section products, ideas, FAQs.
-- All idempotent (ON CONFLICT / WHERE NOT EXISTS) so re-running is safe.
-- ============================================================

-- ---------- 1. Small Business Software & AI ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'Small Business Software & AI Starter Pack', 'small-business',
  'Running a small business means covering a recurring set of jobs -- getting paid, keeping the books, booking time with customers -- and increasingly, deciding which of those jobs are worth automating instead of doing by hand. This pack covers the software fundamentals, the general-purpose AI tools worth knowing, and ideas for what to automate or ask a builder for next.',
  'The core software stack for a small business, plus the AI tools and automations worth knowing about.',
  'Small Business', true,
  'Small Business Software & AI Starter Pack | NeedSaaS',
  'A curated stack for small businesses: accounting, payroll, and scheduling software, general-purpose AI tools, and automation platforms -- plus ideas for what to ask a builder for.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), (SELECT id FROM public.products WHERE name = 'QuickBooks'), 1, 'software', 'Accounting', 'The most common starting point for bookkeeping, invoicing, and tax prep for a small business.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND product_id = (SELECT id FROM public.products WHERE name = 'QuickBooks'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), (SELECT id FROM public.products WHERE name = 'Gusto'), 2, 'software', 'Payroll', 'Once you hire your first employee or contractor, Gusto handles payroll, tax filings, and benefits.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND product_id = (SELECT id FROM public.products WHERE name = 'Gusto'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), (SELECT id FROM public.products WHERE name = 'Calendly'), 3, 'software', 'Scheduling', 'Lets customers book time with you directly instead of trading emails to find a slot.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND product_id = (SELECT id FROM public.products WHERE name = 'Calendly'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), (SELECT id FROM public.products WHERE name = 'Squarespace'), 4, 'software', 'Website', 'A template-driven way to get a real website live without hiring a developer.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND product_id = (SELECT id FROM public.products WHERE name = 'Squarespace'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), (SELECT id FROM public.products WHERE name = 'ChatGPT'), 5, 'ai_agent', 'General AI assistant', 'For drafting customer replies, researching suppliers, or summarizing a long document.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND product_id = (SELECT id FROM public.products WHERE name = 'ChatGPT'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), (SELECT id FROM public.products WHERE name = 'Intercom'), 6, 'ai_agent', 'AI customer support', 'Includes a built-in AI agent ("Fin") that answers customer questions from your own help content.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND product_id = (SELECT id FROM public.products WHERE name = 'Intercom'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), (SELECT id FROM public.products WHERE name = 'Zapier'), 7, 'automation', 'Workflow automation', 'Connects the apps you already use so data moves between them without manual copy-paste.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND product_id = (SELECT id FROM public.products WHERE name = 'Zapier'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), 'I need an AI agent that reads new customer emails and drafts a reply for me to approve.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND prompt = 'I need an AI agent that reads new customer emails and drafts a reply for me to approve.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), 'I need an automated workflow that turns a paid invoice into a bookkeeping entry without me re-typing it.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND prompt = 'I need an automated workflow that turns a paid invoice into a bookkeeping entry without me re-typing it.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), 'I need an AI assistant that answers common customer questions from my website chat, trained on my own FAQ.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND prompt = 'I need an AI assistant that answers common customer questions from my website chat, trained on my own FAQ.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), 'Do I need all of these tools from day one?', 'No -- most solo businesses start with just accounting software and a website, and add the rest (payroll, scheduling, AI, automation) as they hire and grow.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND question = 'Do I need all of these tools from day one?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'small-business'), 'What if a general AI tool like ChatGPT isn''t enough for what I need?', 'That''s exactly what the "Ideas" section above is for -- if what you need is a specific agent or automation wired into your own business, that''s a real Need you can post for a builder to take on.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'small-business') AND question = 'What if a general AI tool like ChatGPT isn''t enough for what I need?');

-- ---------- 2. Sales & Lead Generation ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'Sales & Lead Generation Starter Pack', 'sales-lead-generation',
  'A modern sales process needs somewhere to track every lead and deal, a way to get on a buyer''s calendar without back-and-forth emails, and a way to get contracts signed once a deal is ready to close. AI is increasingly used to qualify and prioritize leads before a human ever looks at them, and automation keeps a CRM in sync with the rest of the sales workflow. This pack covers all three.',
  'Track leads, manage your pipeline, and see where AI lead qualification and outbound automation fit in.',
  'Sales & Lead Generation', true,
  'Sales & Lead Generation Starter Pack: CRM, AI & Automation | NeedSaaS',
  'A curated sales stack: CRM software, meeting scheduling and e-signatures, and where AI lead qualification and automation fit into the process.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), (SELECT id FROM public.products WHERE name = 'HubSpot CRM'), 1, 'software', 'CRM (free tier)', 'The easiest starting point for a small sales team -- free to start, with a straightforward pipeline.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND product_id = (SELECT id FROM public.products WHERE name = 'HubSpot CRM'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), (SELECT id FROM public.products WHERE name = 'Pipedrive'), 2, 'software', 'CRM (pipeline-focused)', 'A strictly visual, pipeline-first CRM for teams that want simplicity over configurability.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND product_id = (SELECT id FROM public.products WHERE name = 'Pipedrive'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), (SELECT id FROM public.products WHERE name = 'Salesforce'), 3, 'software', 'CRM (enterprise)', 'Built for larger sales organizations that need heavy customization and reporting.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND product_id = (SELECT id FROM public.products WHERE name = 'Salesforce'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), (SELECT id FROM public.products WHERE name = 'Calendly'), 4, 'software', 'Scheduling', 'Lets a prospect book a call directly on your calendar.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND product_id = (SELECT id FROM public.products WHERE name = 'Calendly'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), (SELECT id FROM public.products WHERE name = 'DocuSign'), 5, 'software', 'E-signature', 'For getting a contract signed and tracked once a deal is ready to close.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND product_id = (SELECT id FROM public.products WHERE name = 'DocuSign'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), (SELECT id FROM public.products WHERE name = 'ChatGPT'), 6, 'ai_agent', 'Outreach drafting', 'For drafting first-pass outbound emails and call scripts to edit and personalize.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND product_id = (SELECT id FROM public.products WHERE name = 'ChatGPT'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), (SELECT id FROM public.products WHERE name = 'Zapier'), 7, 'automation', 'Lead routing', 'Routes a new lead from a form or ad platform straight into your CRM.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND product_id = (SELECT id FROM public.products WHERE name = 'Zapier'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), 'I need an AI agent that qualifies incoming leads and books qualified prospects directly into my calendar.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND prompt = 'I need an AI agent that qualifies incoming leads and books qualified prospects directly into my calendar.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), 'I need an AI agent that follows up with leads who haven''t responded within 3 days.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND prompt = 'I need an AI agent that follows up with leads who haven''t responded within 3 days.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), 'I need an automated workflow that enriches a new lead with company info before it reaches my CRM.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND prompt = 'I need an automated workflow that enriches a new lead with company info before it reaches my CRM.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), 'Which CRM should I start with?', 'HubSpot CRM''s free tier is the easiest starting point for a small team. Pipedrive suits a team that wants a strictly visual pipeline. Salesforce is built for larger sales orgs that need heavy customization and reporting.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND question = 'Which CRM should I start with?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation'), 'Can AI actually qualify a lead reliably?', 'Rule-based lead scoring already works well in most CRMs today. A genuinely conversational AI agent that qualifies a lead in real time is a newer, more custom capability -- if your CRM''s built-in scoring isn''t enough, that''s exactly the kind of thing worth posting as a Need.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'sales-lead-generation') AND question = 'Can AI actually qualify a lead reliably?');

-- ---------- 3. Marketing & Content ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'Marketing & Content Starter Pack', 'marketing-content',
  'Marketing software covers designing and publishing content, running email campaigns, and measuring results -- and AI now plays a real role in drafting first-pass copy, generating images, and summarizing performance. This pack covers the core software, the AI tools worth knowing, and where automation fits in.',
  'Design, schedule, email, and measure -- plus the AI tools worth knowing about.',
  'Marketing & Content', true,
  'Marketing & Content Starter Pack: Tools + AI | NeedSaaS',
  'A curated marketing stack: design, email, SEO, and analytics software, plus AI content tools and automation for reporting and scheduling.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), (SELECT id FROM public.products WHERE name = 'Canva'), 1, 'software', 'Design', 'For social graphics, ads, and marketing collateral without a dedicated designer.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND product_id = (SELECT id FROM public.products WHERE name = 'Canva'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), (SELECT id FROM public.products WHERE name = 'Mailchimp'), 2, 'software', 'Email marketing', 'For sending campaigns and newsletters directly to your own list.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND product_id = (SELECT id FROM public.products WHERE name = 'Mailchimp'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), (SELECT id FROM public.products WHERE name = 'Semrush'), 3, 'software', 'SEO research', 'Keyword research and competitor analysis for organic search strategy.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND product_id = (SELECT id FROM public.products WHERE name = 'Semrush'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), (SELECT id FROM public.products WHERE name = 'Google Analytics'), 4, 'software', 'Measurement', 'Tracks where traffic actually comes from and whether campaigns convert.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND product_id = (SELECT id FROM public.products WHERE name = 'Google Analytics'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), (SELECT id FROM public.products WHERE name = 'Jasper'), 5, 'ai_agent', 'AI marketing copy', 'Brand-voice-aware AI writing built for marketing teams, not just one-off drafts.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND product_id = (SELECT id FROM public.products WHERE name = 'Jasper'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), (SELECT id FROM public.products WHERE name = 'Midjourney'), 6, 'ai_agent', 'AI image generation', 'For generating original visual concepts rather than sourcing stock photos.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND product_id = (SELECT id FROM public.products WHERE name = 'Midjourney'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), (SELECT id FROM public.products WHERE name = 'Buffer'), 7, 'automation', 'Social scheduling', 'Queues and publishes posts across channels on a schedule instead of manually each day.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND product_id = (SELECT id FROM public.products WHERE name = 'Buffer'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), 'I need an AI agent that drafts a week of social captions from my latest blog post.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND prompt = 'I need an AI agent that drafts a week of social captions from my latest blog post.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), 'I need an automated workflow that pulls last week''s analytics into a summary email every Monday.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND prompt = 'I need an automated workflow that pulls last week''s analytics into a summary email every Monday.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), 'I need an AI content agent that repurposes one long-form article into five short social posts.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND prompt = 'I need an AI content agent that repurposes one long-form article into five short social posts.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), 'What''s the difference between Mailchimp and Semrush?', 'Mailchimp is for sending email campaigns to your own list. Semrush is for SEO research -- keyword research, competitor analysis -- and doesn''t send anything itself.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND question = 'What''s the difference between Mailchimp and Semrush?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content'), 'Do I need a dedicated AI copywriting tool like Jasper, or is ChatGPT enough?', 'For occasional drafting, a general assistant is usually enough. Jasper adds brand-voice templates and team workflows, which matters more once multiple people are producing content.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'marketing-content') AND question = 'Do I need a dedicated AI copywriting tool like Jasper, or is ChatGPT enough?');

-- ---------- 4. Accounting & Finance ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'Accounting & Finance Starter Pack', 'accounting-finance',
  'Every business needs to track income and expenses, pay any employees or contractors correctly, and get invoices paid and contracts signed. A growing amount of the manual work around that -- reading invoices, reconciling transactions, flagging anomalies -- is a good fit for automation or an AI agent rather than a person doing it by hand every week.',
  'Books, payroll, invoicing, and contracts -- plus where automation can take over the manual parts.',
  'Accounting & Finance', true,
  'Accounting & Finance Starter Pack: Software + Automation | NeedSaaS',
  'A curated finance stack: accounting and payroll software, e-signatures, and automation for invoice processing and reconciliation.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), (SELECT id FROM public.products WHERE name = 'QuickBooks'), 1, 'software', 'Accounting', 'The most common choice in the US, with a large accountant network already familiar with it.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND product_id = (SELECT id FROM public.products WHERE name = 'QuickBooks'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), (SELECT id FROM public.products WHERE name = 'Xero'), 2, 'software', 'Accounting (alternative)', 'A cleaner-interface alternative to QuickBooks, often preferred outside the US.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND product_id = (SELECT id FROM public.products WHERE name = 'Xero'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), (SELECT id FROM public.products WHERE name = 'FreshBooks'), 3, 'software', 'Invoicing', 'Invoicing- and time-tracking-first, built for freelancers and small service businesses.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND product_id = (SELECT id FROM public.products WHERE name = 'FreshBooks'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), (SELECT id FROM public.products WHERE name = 'Gusto'), 4, 'software', 'Payroll', 'Payroll, tax filings, and benefits for employees and contractors.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND product_id = (SELECT id FROM public.products WHERE name = 'Gusto'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), (SELECT id FROM public.products WHERE name = 'DocuSign'), 5, 'software', 'E-signature', 'For getting contracts and engagement letters signed and tracked.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND product_id = (SELECT id FROM public.products WHERE name = 'DocuSign'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), (SELECT id FROM public.products WHERE name = 'Zapier'), 6, 'automation', 'Invoice & expense automation', 'Connects invoicing, email, and accounting software so records sync without manual entry.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND product_id = (SELECT id FROM public.products WHERE name = 'Zapier'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), 'I need an automated workflow that reads invoices from email, extracts the information, and enters it into my accounting system.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND prompt = 'I need an automated workflow that reads invoices from email, extracts the information, and enters it into my accounting system.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), 'I need an AI agent that flags unusual transactions in my books each week.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND prompt = 'I need an AI agent that flags unusual transactions in my books each week.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), 'I need an automated reconciliation workflow that matches bank transactions to invoices without manual review.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND prompt = 'I need an automated reconciliation workflow that matches bank transactions to invoices without manual review.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), 'QuickBooks or Xero?', 'Both are full double-entry accounting software with similar core features. QuickBooks has a larger US accountant network familiar with it; Xero is often preferred outside the US and by teams that want a cleaner interface.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND question = 'QuickBooks or Xero?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance'), 'What''s FreshBooks for if I already have QuickBooks?', 'FreshBooks is invoicing-and-time-tracking-first, built for freelancers and small service businesses -- some use it instead of full accounting software, others use it alongside for client-facing invoices.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'accounting-finance') AND question = 'What''s FreshBooks for if I already have QuickBooks?');

-- ---------- 5. Customer Support & AI Agents ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'Customer Support & AI Agents Starter Pack', 'customer-support-ai',
  'Customer support is one of the areas AI agents are furthest along in actually handling real conversations, not just routing tickets. This pack covers helpdesk software, the AI support agents already built into some of it, and where a custom agent or automated workflow might fill in the rest.',
  'Helpdesk software, the AI agents already built into it, and where a custom agent could fill the gaps.',
  'Customer Support & AI Agents', true,
  'Customer Support & AI Agents Starter Pack | NeedSaaS',
  'A curated customer support stack: helpdesk software, built-in AI support agents, and automation for ticket routing and escalation.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai'), (SELECT id FROM public.products WHERE name = 'Zendesk'), 1, 'software', 'Helpdesk', 'A ticketing and workflow platform built for larger support teams.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai') AND product_id = (SELECT id FROM public.products WHERE name = 'Zendesk'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai'), (SELECT id FROM public.products WHERE name = 'Intercom'), 2, 'ai_agent', 'Built-in AI support agent', 'Combines live chat, a shared inbox, and a help center with a built-in AI agent ("Fin") that answers customer questions directly from your own help content.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai') AND product_id = (SELECT id FROM public.products WHERE name = 'Intercom'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai'), (SELECT id FROM public.products WHERE name = 'ChatGPT'), 3, 'ai_agent', 'Drafting responses', 'For drafting canned responses and help-center articles before a human reviews them.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai') AND product_id = (SELECT id FROM public.products WHERE name = 'ChatGPT'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai'), (SELECT id FROM public.products WHERE name = 'Make'), 4, 'automation', 'Ticket routing', 'Routes and escalates tickets between your helpdesk and other tools based on rules you set.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai') AND product_id = (SELECT id FROM public.products WHERE name = 'Make'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai'), 'I need an AI customer-support agent trained on our internal documentation.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai') AND prompt = 'I need an AI customer-support agent trained on our internal documentation.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai'), 'I need an AI agent that classifies incoming tickets by urgency and routes them to the right person.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai') AND prompt = 'I need an AI agent that classifies incoming tickets by urgency and routes them to the right person.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai'), 'I need an automated workflow that escalates a ticket to a human when the AI agent isn''t confident in its answer.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai') AND prompt = 'I need an automated workflow that escalates a ticket to a human when the AI agent isn''t confident in its answer.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai'), 'Do I need Zendesk and Intercom, or just one?', 'They overlap -- both are full helpdesk platforms. Intercom leans further into AI-agent-assisted support out of the box; Zendesk has a larger ticketing and workflow feature set for bigger support teams.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai') AND question = 'Do I need Zendesk and Intercom, or just one?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai'), 'Can an AI agent fully replace human support?', 'Not reliably for edge cases today. Most real deployments use AI to handle common, well-documented questions and escalate anything it''s unsure about to a human, rather than fully replacing the team.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'customer-support-ai') AND question = 'Can an AI agent fully replace human support?');

-- ---------- 6. E-commerce ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'E-commerce Starter Pack', 'ecommerce',
  'An online store needs a place to actually sell, a way to take payments in person if you also sell offline, and email marketing to bring past customers back. AI now helps with writing product copy and generating imagery, and automation handles order-to-fulfillment and abandoned-cart follow-up. This pack covers all three.',
  'Sell online and in person, take payments, and see where AI and automation fit into the storefront.',
  'E-commerce', true,
  'E-commerce Starter Pack: Software, AI & Automation | NeedSaaS',
  'A curated e-commerce stack: storefronts, point-of-sale, email marketing, AI product content, and order automation.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), (SELECT id FROM public.products WHERE name = 'Shopify'), 1, 'software', 'Storefront', 'The most common default, with the largest app ecosystem for extending a store.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND product_id = (SELECT id FROM public.products WHERE name = 'Shopify'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), (SELECT id FROM public.products WHERE name = 'BigCommerce'), 2, 'software', 'Storefront (alternative)', 'Includes more built-in features, like multi-channel selling, without needing as many paid apps.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND product_id = (SELECT id FROM public.products WHERE name = 'BigCommerce'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), (SELECT id FROM public.products WHERE name = 'Square'), 3, 'software', 'In-person payments', 'For point-of-sale hardware if you also sell at a physical location or market stall.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND product_id = (SELECT id FROM public.products WHERE name = 'Square'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), (SELECT id FROM public.products WHERE name = 'Mailchimp'), 4, 'software', 'Email marketing', 'Brings past customers back with campaigns and abandoned-cart emails.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND product_id = (SELECT id FROM public.products WHERE name = 'Mailchimp'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), (SELECT id FROM public.products WHERE name = 'ChatGPT'), 5, 'ai_agent', 'Product copy', 'For drafting product descriptions from a spec sheet or bullet points.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND product_id = (SELECT id FROM public.products WHERE name = 'ChatGPT'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), (SELECT id FROM public.products WHERE name = 'Zapier'), 6, 'automation', 'Order automation', 'Connects checkout, fulfillment, and email so an order triggers the next step automatically.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND product_id = (SELECT id FROM public.products WHERE name = 'Zapier'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), 'I need an AI agent that writes product descriptions from a spec sheet and a few photos.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND prompt = 'I need an AI agent that writes product descriptions from a spec sheet and a few photos.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), 'I need an automated workflow that follows up on an abandoned cart with a personalized email.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND prompt = 'I need an automated workflow that follows up on an abandoned cart with a personalized email.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), 'I need an AI customer-support agent that answers order-status questions from my store''s own data.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND prompt = 'I need an AI customer-support agent that answers order-status questions from my store''s own data.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), 'Shopify or BigCommerce?', 'Both are hosted e-commerce platforms. Shopify has the larger app ecosystem and is the more common default; BigCommerce includes more built-in features (like multi-channel selling) without needing as many paid apps.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND question = 'Shopify or BigCommerce?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce'), 'Do I need Square if I already use Shopify for payments?', 'Only if you also sell in person -- Square specializes in physical point-of-sale hardware, which Shopify also offers but isn''t its main focus.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'ecommerce') AND question = 'Do I need Square if I already use Shopify for payments?');

-- ---------- 7. Real Estate ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'Real Estate Starter Pack', 'real-estate',
  'Real estate agents run on leads, listings, and paperwork. This pack covers getting in front of active buyers, presenting a listing without an in-person visit, and getting offers and contracts signed -- plus where AI can help qualify leads and draft listing copy, and what to automate around follow-up.',
  'Find buyers, show listings remotely, get contracts signed, and see where AI lead qualification fits in.',
  'Real Estate', true,
  'Real Estate Starter Pack: Software, AI & Automation | NeedSaaS',
  'A curated real estate stack: lead generation, virtual tours, e-signatures, and where AI and automation help with follow-up and listing content.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), (SELECT id FROM public.products WHERE name = 'Zillow Premier Agent'), 1, 'software', 'Lead generation', 'Connects you with buyers and sellers actively browsing listings, with advertising on relevant pages.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND product_id = (SELECT id FROM public.products WHERE name = 'Zillow Premier Agent'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), (SELECT id FROM public.products WHERE name = 'Matterport'), 2, 'software', 'Virtual tours', 'Lets buyers walk through a listing remotely before an in-person visit.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND product_id = (SELECT id FROM public.products WHERE name = 'Matterport'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), (SELECT id FROM public.products WHERE name = 'DocuSign'), 3, 'software', 'E-signature', 'For getting offers, disclosures, and contracts signed and tracked.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND product_id = (SELECT id FROM public.products WHERE name = 'DocuSign'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), (SELECT id FROM public.products WHERE name = 'Calendly'), 4, 'software', 'Scheduling', 'For booking showings and buyer/seller consultations without the back-and-forth.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND product_id = (SELECT id FROM public.products WHERE name = 'Calendly'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), (SELECT id FROM public.products WHERE name = 'ChatGPT'), 5, 'ai_agent', 'Listing copy', 'For drafting a first-pass listing description from property details.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND product_id = (SELECT id FROM public.products WHERE name = 'ChatGPT'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), (SELECT id FROM public.products WHERE name = 'Zapier'), 6, 'automation', 'Lead routing', 'Routes a new inbound lead from Zillow or your website straight into your CRM or inbox.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND product_id = (SELECT id FROM public.products WHERE name = 'Zapier'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), 'I need an AI agent that qualifies inbound buyer leads and books a showing directly on my calendar.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND prompt = 'I need an AI agent that qualifies inbound buyer leads and books a showing directly on my calendar.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), 'I need an AI agent that drafts a listing description from photos and a few property details.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND prompt = 'I need an AI agent that drafts a listing description from photos and a few property details.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), 'I need an automated workflow that follows up with a past client on the anniversary of their home purchase.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND prompt = 'I need an automated workflow that follows up with a past client on the anniversary of their home purchase.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), 'Is Zillow Premier Agent worth it for a new agent?', 'It''s a paid lead-generation channel, not a requirement -- some agents build their pipeline entirely through referrals and their own marketing instead. It''s most useful when you want inbound leads while you build that network.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND question = 'Is Zillow Premier Agent worth it for a new agent?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'real-estate'), 'Do I need Matterport for every listing?', 'It''s most valuable for higher-value or hard-to-visit listings (vacant homes, out-of-town buyers) -- not every listing needs a 3D tour to sell.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'real-estate') AND question = 'Do I need Matterport for every listing?');

-- ---------- 8. Restaurants & Food Businesses ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'Restaurants & Food Businesses Starter Pack', 'restaurants-food',
  'Restaurants have a few needs general business software doesn''t fit well: a point-of-sale system built around tickets and kitchen workflows, reservation and waitlist management, and payroll that handles tipped, shift-based employees. This pack leads with restaurant-specific tools, then covers where AI ordering/support agents and automation can take over repetitive work.',
  'Point-of-sale, reservations, payroll, and where AI ordering agents fit in.',
  'Restaurants & Food Businesses', true,
  'Restaurant Software & AI Starter Pack | NeedSaaS',
  'A curated stack for restaurants and food businesses: point-of-sale, reservations, payroll, and AI ordering/customer-service agents.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), (SELECT id FROM public.products WHERE name = 'Toast'), 1, 'software', 'Point of sale', 'Purpose-built for restaurants -- kitchen display, menu modifiers, and tip management.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND product_id = (SELECT id FROM public.products WHERE name = 'Toast'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), (SELECT id FROM public.products WHERE name = 'Square'), 2, 'software', 'Point of sale (alternative)', 'A general point-of-sale system that also works for restaurants, often cheaper to start with for a single location.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND product_id = (SELECT id FROM public.products WHERE name = 'Square'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), (SELECT id FROM public.products WHERE name = 'OpenTable'), 3, 'software', 'Reservations', 'Manages bookings, walk-in waitlists, and gets you listed for new diners to discover.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND product_id = (SELECT id FROM public.products WHERE name = 'OpenTable'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), (SELECT id FROM public.products WHERE name = 'Gusto'), 4, 'software', 'Payroll', 'Handles tipped-employee payroll, shift-based scheduling, and tax filings.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND product_id = (SELECT id FROM public.products WHERE name = 'Gusto'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), (SELECT id FROM public.products WHERE name = 'ChatGPT'), 5, 'ai_agent', 'Menu & social copy', 'For drafting menu descriptions and social posts.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND product_id = (SELECT id FROM public.products WHERE name = 'ChatGPT'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), (SELECT id FROM public.products WHERE name = 'Zapier'), 6, 'automation', 'POS-to-accounting sync', 'Syncs daily sales totals from your POS into your accounting software automatically.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND product_id = (SELECT id FROM public.products WHERE name = 'Zapier'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), 'I need an AI ordering agent that takes phone orders for pickup and texts the customer a confirmation.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND prompt = 'I need an AI ordering agent that takes phone orders for pickup and texts the customer a confirmation.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), 'I need an AI customer-service agent that answers common questions (hours, menu, allergens) on my website.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND prompt = 'I need an AI customer-service agent that answers common questions (hours, menu, allergens) on my website.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), 'I need an automated workflow that syncs daily POS sales into my accounting software every night.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND prompt = 'I need an automated workflow that syncs daily POS sales into my accounting software every night.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), 'Toast or Square for a restaurant?', 'Toast is purpose-built for restaurants (kitchen display, menu modifiers, tip management). Square is a general point-of-sale system that also works for restaurants and is often cheaper to start with for a small or single-location operation.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND question = 'Toast or Square for a restaurant?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food'), 'Do I need OpenTable if I don''t take reservations?', 'If you''re counter-service or don''t take bookings, you can skip it -- it''s specifically for reservation- and waitlist-based dining.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'restaurants-food') AND question = 'Do I need OpenTable if I don''t take reservations?');

-- ---------- 9. Construction & Contractors ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'Construction & Contractors Starter Pack', 'construction-contractors',
  'Construction and contracting work runs on job scheduling, accurate quoting, and getting paid on time -- problems general project management software doesn''t model well. This pack leads with construction- and field-service-specific tools, then covers where AI can speed up estimating and reporting, and what to automate around paperwork.',
  'Manage jobs, quote work, get contracts signed, and see where AI can speed up estimating and reporting.',
  'Construction & Contractors', true,
  'Construction & Contractors Starter Pack: Software + AI | NeedSaaS',
  'A curated stack for construction and contracting businesses: job management, quoting, e-signatures, and AI for estimating and reporting.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), (SELECT id FROM public.products WHERE name = 'Buildertrend'), 1, 'software', 'Project management', 'Built for larger construction and remodeling projects -- budgets, change orders, and client portals.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND product_id = (SELECT id FROM public.products WHERE name = 'Buildertrend'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), (SELECT id FROM public.products WHERE name = 'Jobber'), 2, 'software', 'Scheduling & quoting', 'Fits smaller service and trade businesses doing shorter, more frequent jobs.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND product_id = (SELECT id FROM public.products WHERE name = 'Jobber'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), (SELECT id FROM public.products WHERE name = 'QuickBooks'), 3, 'software', 'Accounting', 'The actual accounting system of record for taxes and overall books.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND product_id = (SELECT id FROM public.products WHERE name = 'QuickBooks'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), (SELECT id FROM public.products WHERE name = 'DocuSign'), 4, 'software', 'E-signature', 'For getting bids, contracts, and change orders signed.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND product_id = (SELECT id FROM public.products WHERE name = 'DocuSign'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), (SELECT id FROM public.products WHERE name = 'ChatGPT'), 5, 'ai_agent', 'Estimate drafting', 'For turning rough job notes into a first-pass written estimate or proposal.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND product_id = (SELECT id FROM public.products WHERE name = 'ChatGPT'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), (SELECT id FROM public.products WHERE name = 'Make'), 6, 'automation', 'Document processing', 'Routes supplier invoices and paperwork between email, storage, and accounting.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND product_id = (SELECT id FROM public.products WHERE name = 'Make'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), 'I need an AI agent that turns a site-visit voice note into a written estimate.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND prompt = 'I need an AI agent that turns a site-visit voice note into a written estimate.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), 'I need an automated workflow that reads a supplier invoice and enters it into my accounting system.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND prompt = 'I need an automated workflow that reads a supplier invoice and enters it into my accounting system.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), 'I need an AI reporting agent that summarizes weekly job-site progress photos into a client update.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND prompt = 'I need an AI reporting agent that summarizes weekly job-site progress photos into a client update.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), 'Buildertrend or Jobber for a contractor?', 'Buildertrend is built for larger construction and remodeling projects (budgets, change orders, client portals). Jobber fits smaller service and trade businesses doing shorter, more frequent jobs -- quoting, scheduling, and invoicing.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND question = 'Buildertrend or Jobber for a contractor?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors'), 'Do I still need QuickBooks if I use Buildertrend?', 'Most contractors do -- Buildertrend handles job-level budgets and client communication, but QuickBooks (or Xero) is still the actual accounting system of record for taxes and overall books.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'construction-contractors') AND question = 'Do I still need QuickBooks if I use Buildertrend?');

-- ---------- 10. Cleaning & Janitorial Businesses ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'Cleaning & Janitorial Starter Pack', 'cleaning-janitorial',
  'A cleaning or janitorial business is mostly a scheduling and dispatch problem: getting the right person to the right job, quoting recurring work, and invoicing reliably. This pack covers field-service software built for exactly that, plus AI agents that can help review before/after job photos, and workflow ideas for client reporting.',
  'Schedule jobs, dispatch your team, invoice clients -- and see where AI photo review and reporting fit in.',
  'Cleaning & Janitorial Businesses', true,
  'Cleaning & Janitorial Starter Pack: Software + AI | NeedSaaS',
  'A curated stack for cleaning and janitorial businesses: field-service scheduling, invoicing, and AI/automation for photo review and client reporting.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), (SELECT id FROM public.products WHERE name = 'Jobber'), 1, 'software', 'Scheduling & dispatch', 'Used broadly across cleaning, lawn care, and other recurring-service businesses.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND product_id = (SELECT id FROM public.products WHERE name = 'Jobber'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), (SELECT id FROM public.products WHERE name = 'Housecall Pro'), 2, 'software', 'Field service (alternative)', 'Heavily overlaps with Jobber; worth comparing on a free trial to see which workflow fits.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND product_id = (SELECT id FROM public.products WHERE name = 'Housecall Pro'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), (SELECT id FROM public.products WHERE name = 'QuickBooks'), 3, 'software', 'Accounting', 'For the books, expenses, and tax prep behind day-to-day job invoicing.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND product_id = (SELECT id FROM public.products WHERE name = 'QuickBooks'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), (SELECT id FROM public.products WHERE name = 'Gusto'), 4, 'software', 'Payroll', 'Payroll and tax filings for hourly crew members.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND product_id = (SELECT id FROM public.products WHERE name = 'Gusto'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), (SELECT id FROM public.products WHERE name = 'ChatGPT'), 5, 'ai_agent', 'Client communication', 'For drafting client reminders, quotes, and completion-report copy.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND product_id = (SELECT id FROM public.products WHERE name = 'ChatGPT'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), (SELECT id FROM public.products WHERE name = 'Zapier'), 6, 'automation', 'Client reporting', 'Sends an automatic reminder or completion notice to a client once a job is marked done.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND product_id = (SELECT id FROM public.products WHERE name = 'Zapier'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), 'I need software for my cleaning company where employees receive jobs, upload before/after photos, and clients automatically receive completion reports.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND prompt = 'I need software for my cleaning company where employees receive jobs, upload before/after photos, and clients automatically receive completion reports.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), 'I need an AI inspection agent that reviews before/after photos and flags jobs that look incomplete.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND prompt = 'I need an AI inspection agent that reviews before/after photos and flags jobs that look incomplete.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), 'I need an automated workflow that sends a client a reminder and reschedule link the day before their cleaning.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND prompt = 'I need an automated workflow that sends a client a reminder and reschedule link the day before their cleaning.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), 'Jobber or Housecall Pro?', 'Both cover scheduling, quoting, and invoicing for home-service businesses and overlap heavily. Housecall Pro leans slightly toward HVAC/home-repair trades; Jobber is used broadly across cleaning, lawn care, and other recurring-service businesses -- try both on a free trial and see which workflow fits.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND question = 'Jobber or Housecall Pro?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial'), 'Can an AI agent really judge if a cleaning job was done well from a photo?', 'Not perfectly -- today this works best as a first-pass flag (e.g. a visibly untouched area) for a human to double-check, not a fully automated pass/fail judgment.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'cleaning-janitorial') AND question = 'Can an AI agent really judge if a cleaning job was done well from a photo?');

-- ---------- 11. HR & Recruiting ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'HR & Recruiting Starter Pack', 'hr-recruiting',
  'HR spans three distinct jobs: finding and hiring candidates, running payroll and benefits correctly, and giving the team a place to communicate day to day. AI is increasingly used to screen resumes and coordinate interview scheduling, and automation can handle the paperwork around onboarding a new hire. This pack covers all of it.',
  'Hire, pay, and support your team -- plus where AI screening and onboarding automation fit in.',
  'HR & Recruiting', true,
  'HR & Recruiting Starter Pack: Software + AI | NeedSaaS',
  'A curated HR stack: applicant tracking, payroll and benefits, HR records, and AI/automation for screening and onboarding.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), (SELECT id FROM public.products WHERE name = 'Greenhouse'), 1, 'software', 'Recruiting', 'Applicant-tracking software, most useful once you''re running multiple open roles at once.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND product_id = (SELECT id FROM public.products WHERE name = 'Greenhouse'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), (SELECT id FROM public.products WHERE name = 'Gusto'), 2, 'software', 'Payroll & benefits', 'Payroll, tax filings, and benefits administration, with basic HR features included.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND product_id = (SELECT id FROM public.products WHERE name = 'Gusto'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), (SELECT id FROM public.products WHERE name = 'BambooHR'), 3, 'software', 'HR management', 'Focused on HR record-keeping, performance, and time-off management as HR processes mature.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND product_id = (SELECT id FROM public.products WHERE name = 'BambooHR'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), (SELECT id FROM public.products WHERE name = 'DocuSign'), 4, 'software', 'Offer letters', 'For getting offer letters and employment agreements signed and tracked.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND product_id = (SELECT id FROM public.products WHERE name = 'DocuSign'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), (SELECT id FROM public.products WHERE name = 'ChatGPT'), 5, 'ai_agent', 'Job descriptions & questions', 'For drafting job descriptions and a first-pass set of interview questions.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND product_id = (SELECT id FROM public.products WHERE name = 'ChatGPT'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), (SELECT id FROM public.products WHERE name = 'Zapier'), 6, 'automation', 'Onboarding documents', 'Sends a new hire their documents and setup steps automatically once they''re marked hired.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND product_id = (SELECT id FROM public.products WHERE name = 'Zapier'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), 'I need an AI agent that screens resumes against a job description and ranks candidates.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND prompt = 'I need an AI agent that screens resumes against a job description and ranks candidates.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), 'I need an automated onboarding workflow that sends a new hire their documents, IT setup steps, and first-week schedule automatically.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND prompt = 'I need an automated onboarding workflow that sends a new hire their documents, IT setup steps, and first-week schedule automatically.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), 'I need an AI interview-scheduling agent that coordinates availability between a candidate and three interviewers.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND prompt = 'I need an AI interview-scheduling agent that coordinates availability between a candidate and three interviewers.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), 'Do I need both Gusto and BambooHR?', 'They overlap at small company size -- Gusto covers payroll/benefits and basic HR, while BambooHR is more focused on HR record-keeping, performance, and time-off management. Many small companies start with just Gusto and add BambooHR once HR processes get more complex.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND question = 'Do I need both Gusto and BambooHR?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting'), 'What''s Greenhouse for if I''m not hiring often?', 'Greenhouse is applicant-tracking software -- most useful once you''re running multiple open roles at once; for occasional single hires, some companies handle it manually and adopt an ATS later.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'hr-recruiting') AND question = 'What''s Greenhouse for if I''m not hiring often?');

-- ---------- 12. Operations & Business Automation ----------
INSERT INTO public.starter_packs (title, slug, description, short_description, industry, published, seo_title, seo_description, created_by)
VALUES (
  'Operations & Business Automation Starter Pack', 'operations-automation',
  'Not every problem needs a new app. A lot of operational pain comes from data trapped in one tool that needs to reach another -- a form that should update a spreadsheet, a CRM deal that should trigger an invoice, a weekly report that currently gets built by hand. This pack is less about specific software and more about the automation platforms and AI agents that connect the tools you already use.',
  'Connect the tools you already use, automate the reporting you build by hand, and find out what''s worth asking a builder for.',
  'Operations & Business Automation', true,
  'Operations & Business Automation Starter Pack | NeedSaaS',
  'A curated stack for business operations: automation platforms, internal-tool building blocks, and AI agents for reporting and document handling.',
  (SELECT id FROM public.profiles WHERE username = 'needsaas')
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation'), (SELECT id FROM public.products WHERE name = 'Airtable'), 1, 'software', 'Flexible database', 'A spreadsheet-database hybrid often used as the backend for a lightweight internal tool.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation') AND product_id = (SELECT id FROM public.products WHERE name = 'Airtable'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation'), (SELECT id FROM public.products WHERE name = 'Notion'), 2, 'software', 'Internal ops hub', 'For internal documentation, SOPs, and lightweight tracking without a dedicated tool.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation') AND product_id = (SELECT id FROM public.products WHERE name = 'Notion'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation'), (SELECT id FROM public.products WHERE name = 'ChatGPT'), 3, 'ai_agent', 'Data summarization', 'For turning raw exported data into a plain-language summary someone can actually act on.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation') AND product_id = (SELECT id FROM public.products WHERE name = 'ChatGPT'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation'), (SELECT id FROM public.products WHERE name = 'Zapier'), 4, 'automation', 'App-to-app automation', 'The most common starting point for connecting two apps that don''t talk to each other natively.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation') AND product_id = (SELECT id FROM public.products WHERE name = 'Zapier'));
INSERT INTO public.starter_pack_products (starter_pack_id, product_id, sort_order, section, role_label, blurb)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation'), (SELECT id FROM public.products WHERE name = 'Make'), 5, 'automation', 'Visual workflow automation', 'A more visual, branching alternative to Zapier for multi-step automations.'
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_products WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation') AND product_id = (SELECT id FROM public.products WHERE name = 'Make'));

INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation'), 'I need an automated workflow that moves data from a form submission into a spreadsheet and notifies the right person on Slack.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation') AND prompt = 'I need an automated workflow that moves data from a form submission into a spreadsheet and notifies the right person on Slack.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation'), 'I need an automated weekly reporting workflow that pulls data from our CRM and sends management a summary every Monday.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation') AND prompt = 'I need an automated weekly reporting workflow that pulls data from our CRM and sends management a summary every Monday.');
INSERT INTO public.starter_pack_ideas (starter_pack_id, prompt, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation'), 'I need an AI operations agent that reviews incoming documents and files them into the right folder automatically.', 3
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_ideas WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation') AND prompt = 'I need an AI operations agent that reviews incoming documents and files them into the right folder automatically.');

INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation'), 'Do I need to hire a developer to set up Zapier or Make?', 'Not usually -- both are built for non-developers to connect apps with a visual editor. More complex, multi-step logic can benefit from technical help, which is exactly the kind of thing worth posting as a Need if you want it built for you.', 1
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation') AND question = 'Do I need to hire a developer to set up Zapier or Make?');
INSERT INTO public.starter_pack_faqs (starter_pack_id, question, answer, sort_order)
SELECT (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation'), 'What''s the difference between an "automation" and an "AI agent"?', 'An automation follows fixed, predictable steps (when X happens, do Y). An AI agent makes judgment calls within a task -- like deciding how to respond to a message -- rather than just following a fixed rule.', 2
WHERE NOT EXISTS (SELECT 1 FROM public.starter_pack_faqs WHERE starter_pack_id = (SELECT id FROM public.starter_packs WHERE slug = 'operations-automation') AND question = 'What''s the difference between an "automation" and an "AI agent"?');
