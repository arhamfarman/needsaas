/*
# Launch content seed: curated software directory

Populates the marketplace with real, researched software products mapped to
realistic user needs, so NeedSaaS launches with substantive content instead
of an empty catalog.

## Content policy
- Every product description states only stable, well-established facts
  (what it does, who it's for). No pricing figures, ratings, user counts, or
  awards are invented — those are either omitted or left to the app's
  existing trigger-maintained counters (reviews, votes, bookmarks), which
  start at zero and grow from real usage.
- No product logos are stored or hotlinked in this pass — see the product
  cards' existing initials-avatar fallback. Avoids any question of logo
  usage rights for this batch; can be revisited per-product later via the
  admin image uploader.
- All curated content is owned by a single, clearly-labeled editorial
  profile (username 'needsaas') rather than pretending these
  companies signed up as builders. See profiles_update below for the bio
  that makes this explicit on the profile page.
- All needs are inserted with status='fulfilled', vote_count=0,
  reward_amount=0, bookmark_count=0 — they represent real search-intent
  problems that already have real solutions linked (need_product_links),
  not fabricated community engagement.

## Requires
A profile with username 'needsaas' must already exist (create it by
signing up normally through the app, then confirming the email — this
migration does not create auth.users rows). The DO block below fails loudly
with a clear message if that profile is missing, rather than inserting bad
data.
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

-- ---------- editorial profile identity ----------
UPDATE public.profiles SET
  full_name = 'NeedSaaS Editorial Team',
  bio = 'Official software directory entries curated and researched by the NeedSaaS team. We are not affiliated with, endorsed by, or partnered with the companies listed here — these are independent, informational listings to help you discover software that solves real problems.',
  verified = true,
  builder_onboarded = true,
  updated_at = now()
WHERE username = 'needsaas';

-- ---------- new categories ----------

INSERT INTO public.categories (slug, name, description, icon)
VALUES ('communication', 'Communication', 'Team messaging, video calls, and real-time collaboration tools that keep conversations organized.', 'MessageCircle')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (slug, name, description, icon)
VALUES ('automation', 'Automation', 'No-code and low-code tools that connect your apps and automate repetitive work.', 'Workflow')
ON CONFLICT (slug) DO NOTHING;


-- ---------- category SEO fields (all 14 categories) ----------

UPDATE public.categories SET
  seo_title = 'Marketing Software: Email, Social & SEO Tools',
  seo_description = 'Compare marketing software for email campaigns, social media scheduling, and SEO — find the right tool for growing an audience and driving sales.',
  long_description = 'Marketing software covers everything from sending email newsletters to scheduling social posts to researching what your customers are searching for. The right tool depends mostly on scale and channel: a solo creator sending a weekly newsletter has very different needs than a team running email, social, and SEO campaigns together across a whole customer journey.'
WHERE slug = 'marketing';

UPDATE public.categories SET
  seo_title = 'CRM & Sales Software for Managing Leads and Deals',
  seo_description = 'Find CRM software to track leads, manage your sales pipeline, and close deals — from free starter CRMs to enterprise-grade sales platforms.',
  long_description = 'A CRM keeps every lead, deal, and customer conversation in one place instead of scattered across email and spreadsheets. Smaller teams often start with a free or low-cost CRM focused on a simple visual pipeline, while larger sales organizations need more configuration, permissions, and reporting as their process gets more complex.'
WHERE slug = 'sales';

UPDATE public.categories SET
  seo_title = 'Developer Tools: Hosting, APIs & Website Builders',
  seo_description = 'Discover developer tools for code hosting, deployment, API testing, and building websites — from version control to no-code site builders.',
  long_description = 'Developer tools span the full path from writing and hosting code to deploying it and building the interfaces around it. That includes version control and code review, one-click deployment platforms, API testing and documentation tools, and visual website builders for teams that want production-quality sites without hand-coding everything.'
WHERE slug = 'dev-tools';

UPDATE public.categories SET
  seo_title = 'Data & Analytics Software: Web and Product Analytics',
  seo_description = 'Compare analytics software for tracking website traffic and understanding how users interact with your product — from free web analytics to in-depth product analytics.',
  long_description = 'Analytics software falls into two broad categories: website analytics, which shows where visitors come from and what pages they view, and product analytics, which tracks specific in-app events to understand engagement, retention, and conversion funnels for logged-in users.'
WHERE slug = 'analytics';

UPDATE public.categories SET
  seo_title = 'AI Tools for Writing, Images & Assistance',
  seo_description = 'Explore AI software for writing assistance, marketing content generation, and image creation — tools that help you work faster with AI.',
  long_description = 'AI tools now cover writing assistance, content generation at scale, grammar and editing, and generating images from text descriptions. Which one fits depends on the task: a general-purpose AI assistant for research and drafting is a different tool than AI writing software built specifically for a marketing team''s brand voice.'
WHERE slug = 'ai';

UPDATE public.categories SET
  seo_title = 'Design & Creative Software for Graphics, UI & Video',
  seo_description = 'Find design software for social graphics, UI/UX design, and professional creative work — from beginner-friendly templates to industry-standard creative suites.',
  long_description = 'Design software ranges from template-driven tools built for non-designers making social graphics, to dedicated interface design tools for product teams, to professional creative suites used by working designers, photographers, and video editors. The right fit depends on your skill level and how specialized the output needs to be.'
WHERE slug = 'design';

UPDATE public.categories SET
  seo_title = 'Productivity Software: Project Management, Notes & Scheduling',
  seo_description = 'Compare productivity software for project management, notes and docs, issue tracking, and meeting scheduling — tools to organize how your team works.',
  long_description = 'Productivity software is the broadest category here, covering project and task management, notes and internal documentation, issue tracking for engineering teams, flexible databases, and scheduling tools that remove the back-and-forth from booking meetings. Most teams end up combining two or three of these rather than relying on one tool for everything.'
WHERE slug = 'productivity';

UPDATE public.categories SET
  seo_title = 'Finance & Accounting Software for Small Business',
  seo_description = 'Find accounting and invoicing software for small businesses — from simple invoicing tools for freelancers to full bookkeeping software for growing teams.',
  long_description = 'Finance and accounting software ranges from simple invoicing tools built for freelancers and solo business owners, to full accounting platforms that handle bookkeeping, bank reconciliation, and reporting for a growing business working with an accountant.'
WHERE slug = 'finance';

UPDATE public.categories SET
  seo_title = 'HR & Recruiting Software: Payroll, Records & Hiring',
  seo_description = 'Compare HR software for employee records, payroll and benefits, and applicant tracking — tools for managing people as your team grows.',
  long_description = 'HR software covers employee records and time off, payroll and benefits administration, and applicant tracking for hiring. Small teams often start managing this in spreadsheets, then move to dedicated software once record-keeping, payroll compliance, or hiring volume gets hard to track manually.'
WHERE slug = 'hr';

UPDATE public.categories SET
  seo_title = 'Customer Support Software: Help Desk & Live Chat',
  seo_description = 'Discover customer support software for ticketing, live chat, and shared inboxes — tools to help your team respond to customers faster and stay organized.',
  long_description = 'Customer support software helps a team manage incoming questions without losing track of who''s handling what. That includes traditional help desk ticketing, live chat for real-time conversations on your website, and shared inboxes so a team can collaborate on email support without forwarding messages around.'
WHERE slug = 'customer-support';

UPDATE public.categories SET
  seo_title = 'Ecommerce Software: Online Store Platforms',
  seo_description = 'Compare ecommerce platforms for launching an online store — from all-in-one storefronts to platforms built for high-volume, growing retailers.',
  long_description = 'Ecommerce software provides the storefront, checkout, and payment processing needed to sell online. Options range from all-in-one platforms built to launch a store quickly, to website builders with ecommerce features bolted on, to platforms built specifically to handle high order volume as a store scales.'
WHERE slug = 'ecommerce';

UPDATE public.categories SET
  seo_title = 'Security & Password Management Software',
  seo_description = 'Find password managers and security software for individuals and teams — securely store, share, and generate strong passwords.',
  long_description = 'Password managers store and autofill credentials so people stop reusing weak passwords across accounts. For teams, they add shared vaults so a group can access shared logins without ever seeing or exposing the actual password.'
WHERE slug = 'security';

UPDATE public.categories SET
  seo_title = 'Communication Software: Team Chat & Video Calls',
  seo_description = 'Compare team communication software for chat and video calls — from channel-based messaging to video conferencing built for client meetings.',
  long_description = 'Communication software covers real-time and async team messaging, organized by channel or topic, plus video conferencing for meetings and calls. Remote and distributed teams in particular rely on this category to replace the hallway conversations and drop-by meetings that in-office teams take for granted.'
WHERE slug = 'communication';

UPDATE public.categories SET
  seo_title = 'Automation Software: Connect Apps Without Code',
  seo_description = 'Discover no-code automation software that connects your apps and automates repetitive tasks — from simple trigger-action automations to complex multi-step workflows.',
  long_description = 'Automation software connects the other apps a business already uses so that data moves between them automatically instead of being copied by hand. Simpler tools handle one trigger leading to one action; more advanced ones support branching logic and multi-step workflows across many apps at once.'
WHERE slug = 'automation';


-- ---------- tags ----------

INSERT INTO public.tags (name, slug) VALUES ('Team Chat', 'team-chat') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Video Conferencing', 'video-conferencing') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Notes Docs', 'notes-docs') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Project Management', 'project-management') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Kanban', 'kanban') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Issue Tracking', 'issue-tracking') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Scheduling', 'scheduling') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Spreadsheet Database', 'spreadsheet-database') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Graphic Design', 'graphic-design') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Ui Design', 'ui-design') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Creative Suite', 'creative-suite') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Email Marketing', 'email-marketing') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Crm', 'crm') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Social Media Scheduling', 'social-media-scheduling') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Seo Tools', 'seo-tools') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Sales Pipeline', 'sales-pipeline') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Version Control', 'version-control') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Hosting Deployment', 'hosting-deployment') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Api Testing', 'api-testing') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Website Builder', 'website-builder') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Ecommerce Platform', 'ecommerce-platform') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('No Code Automation', 'no-code-automation') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Ai Assistant', 'ai-assistant') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Ai Writing', 'ai-writing') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Ai Image Generation', 'ai-image-generation') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Web Analytics', 'web-analytics') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Product Analytics', 'product-analytics') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Accounting', 'accounting') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Invoicing', 'invoicing') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Hr Management', 'hr-management') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Payroll', 'payroll') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Applicant Tracking', 'applicant-tracking') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Help Desk', 'help-desk') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Live Chat', 'live-chat') ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES ('Password Manager', 'password-manager') ON CONFLICT (slug) DO NOTHING;


-- ---------- products ----------

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Slack', 'Channel-based messaging for teams', 'Slack organizes team conversations into channels by topic, project, or team, alongside direct messages and file sharing, with integrations for thousands of other work tools. It''s built for teams that want both async and real-time chat in one place, with search that makes old conversations easy to find.', 'https://slack.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'communication'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Slack');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Microsoft Teams', 'Chat, video calls, and Office apps in one hub', 'Microsoft Teams combines persistent group chat, video meetings, and file collaboration with deep integration into Word, Excel, and the rest of Microsoft 365. It''s a common choice for organizations already standardized on Microsoft''s productivity suite.', 'https://www.microsoft.com/microsoft-teams', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'communication'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Microsoft Teams');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Zoom', 'Video conferencing for meetings and webinars', 'Zoom is video conferencing software for one-on-one calls, team meetings, and larger webinars, with screen sharing, recording, and virtual backgrounds. It''s widely used for both internal meetings and client-facing calls.', 'https://zoom.us', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'communication'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Zoom');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Discord', 'Voice, video, and text chat organized into servers', 'Discord organizes conversations into servers with topic-based text and voice channels. Originally built for gaming communities, it''s now also used by remote teams, creators, and communities for informal, always-on chat.', 'https://discord.com', 'Free',
  (SELECT id FROM public.categories WHERE slug = 'communication'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Discord');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Notion', 'All-in-one workspace for notes, docs, and wikis', 'Notion combines notes, documents, wikis, and lightweight databases into a single flexible workspace that teams can structure however they like. It''s popular for internal documentation, personal notes, and simple project tracking side by side.', 'https://www.notion.so', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Notion');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Asana', 'Project and task management for teams', 'Asana helps teams plan projects, assign tasks, and track progress through lists, boards, timelines, and calendars. It''s built for cross-functional teams that need visibility into who''s doing what and by when.', 'https://asana.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Asana');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Trello', 'Visual task boards using the kanban method', 'Trello organizes work into boards, lists, and cards you drag between stages, making it a simple way to visualize a workflow from start to finish. It''s a lightweight option for individuals and small teams who want structure without complexity.', 'https://trello.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Trello');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'ClickUp', 'Configurable project management for any workflow', 'ClickUp bundles tasks, docs, goals, and time tracking into one platform with customizable views including lists, boards, and Gantt charts. It''s aimed at teams that want one tool to replace several separate apps.', 'https://clickup.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'ClickUp');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Monday.com', 'Visual work management platform', 'Monday.com uses color-coded boards to track projects, workflows, and processes across teams like sales, marketing, and operations, with automation rules to reduce manual updates. It''s designed to be customized to a team''s process rather than following one fixed methodology.', 'https://monday.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Monday.com');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Linear', 'Fast issue tracking for software teams', 'Linear is an issue tracker and project tool built specifically for software engineering teams, known for a fast, keyboard-driven interface and an opinionated workflow built around cycles and projects. It''s aimed at product and engineering teams that find heavier tools slow or overly complex.', 'https://linear.app', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Linear');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Jira', 'Issue tracking and agile project management', 'Jira is Atlassian''s issue tracking and agile project management tool, widely used by software teams to plan sprints, track bugs, and manage backlogs with configurable workflows. It''s especially common in larger engineering organizations that need detailed reporting and permissions.', 'https://www.atlassian.com/software/jira', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Jira');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Airtable', 'Spreadsheet-database hybrid for organizing anything', 'Airtable looks like a spreadsheet but works like a database, letting teams build custom views, link related records, and automate workflows without writing code. It''s used for everything from content calendars to inventory tracking to simple CRMs.', 'https://www.airtable.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Airtable');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Calendly', 'Automated meeting scheduling', 'Calendly lets people share a booking link that shows their real-time availability, so others can schedule a meeting without back-and-forth emails. It syncs with common calendar apps and supports different meeting types, buffers, and time zones automatically.', 'https://calendly.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Calendly');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Canva', 'Drag-and-drop design for social graphics and presentations', 'Canva provides templates and a drag-and-drop editor for creating social media graphics, presentations, flyers, and marketing materials without prior design experience. It''s aimed at non-designers who need professional-looking visuals quickly.', 'https://www.canva.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'design'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Canva');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Figma', 'Collaborative interface design and prototyping', 'Figma is a browser-based design tool for creating user interfaces, wireframes, and interactive prototypes, with real-time multiplayer editing similar to a shared document. It''s become a standard tool for product design and design-to-developer handoff.', 'https://www.figma.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'design'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Figma');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Adobe Creative Cloud', 'Professional creative software suite', 'Adobe Creative Cloud bundles professional creative applications, including Photoshop, Illustrator, and Premiere Pro, for photo editing, vector graphics, and video production. It''s the industry-standard toolkit for many professional designers, photographers, and video editors.', 'https://www.adobe.com/creativecloud.html', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'design'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Adobe Creative Cloud');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Mailchimp', 'Email marketing and marketing automation', 'Mailchimp is an email marketing platform that helps small businesses design campaigns, segment audiences, and automate follow-up sequences, along with basic landing pages and CRM features. It''s one of the most widely recognized entry points into email marketing.', 'https://mailchimp.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Mailchimp');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Brevo', 'Email, SMS, and CRM marketing platform', 'Brevo (formerly Sendinblue) combines email and SMS marketing, marketing automation, and a built-in CRM in one platform, aimed at small and mid-sized businesses that want multiple channels without stitching together separate tools.', 'https://www.brevo.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Brevo');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Kit (formerly ConvertKit)', 'Email marketing built for creators', 'Kit, formerly known as ConvertKit, is an email marketing platform built specifically for creators, writers, and newsletter businesses, with visual automation sequences, landing pages, and tools to sell digital products directly to subscribers.', 'https://kit.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Kit (formerly ConvertKit)');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Hootsuite', 'Schedule and manage social media from one dashboard', 'Hootsuite lets teams schedule posts, monitor mentions, and manage multiple social media accounts from a single dashboard, with reporting to track engagement across platforms. It''s aimed at marketing teams managing several social channels at once.', 'https://www.hootsuite.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Hootsuite');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Buffer', 'Simple social media scheduling', 'Buffer is a straightforward social media scheduling tool for planning and publishing posts across platforms, with a simpler interface and feature set than larger social suites. It''s popular with solo creators, freelancers, and small marketing teams.', 'https://buffer.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Buffer');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Semrush', 'SEO, keyword research, and competitive analysis', 'Semrush is an SEO and online visibility platform for keyword research, tracking search rankings, auditing websites, and analyzing competitors'' organic and paid search strategies. It''s used by marketers, agencies, and SEO specialists to guide content and search strategy.', 'https://www.semrush.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Semrush');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'HubSpot CRM', 'Free CRM with marketing and sales tools', 'HubSpot CRM tracks contacts, deals, and communication history for a sales team, with a free starting tier and optional add-on hubs for marketing, sales, and customer service. It''s a common starting point for small businesses wanting to combine CRM with lightweight marketing tools.', 'https://www.hubspot.com/products/crm', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'sales'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'HubSpot CRM');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Salesforce', 'Enterprise-grade CRM platform', 'Salesforce is a highly configurable CRM platform used by sales, service, and marketing teams to manage the full customer lifecycle, with extensive customization and a large ecosystem of add-on apps. It''s most often chosen by larger organizations with complex sales processes.', 'https://www.salesforce.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'sales'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Salesforce');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Pipedrive', 'Visual sales pipeline CRM', 'Pipedrive is a CRM built around a visual sales pipeline, designed to help sales teams see exactly where every deal stands and what needs to happen next. It''s built to be simpler to set up than larger enterprise CRMs while still covering core sales tracking needs.', 'https://www.pipedrive.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'sales'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Pipedrive');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'GitHub', 'Code hosting, version control, and collaboration', 'GitHub hosts Git repositories for version control and provides tools for code review, issue tracking, and CI/CD pipelines through GitHub Actions. It''s the most widely used platform for hosting both open-source and private software projects.', 'https://github.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'dev-tools'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'GitHub');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Vercel', 'Deploy and host frontend web applications', 'Vercel is a cloud platform for deploying frontend web applications, with automatic builds from Git, a global edge network, and serverless functions. It''s especially popular with teams building on frameworks like Next.js.', 'https://vercel.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'dev-tools'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Vercel');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Postman', 'Build, test, and document APIs', 'Postman is a tool for building, testing, and documenting APIs, letting developers send requests, automate test suites, and share collections with a team. It''s widely used across backend and API development workflows.', 'https://www.postman.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'dev-tools'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Postman');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Webflow', 'Visual website builder with production-ready code', 'Webflow lets designers visually build responsive websites that generate clean, production-ready code, combining the control of hand-coding with a no-code visual editor. It includes a built-in CMS for managing content like blog posts.', 'https://webflow.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'dev-tools'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Webflow');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Shopify', 'Launch and run an online store', 'Shopify provides the storefront, checkout, payments, and inventory tools needed to launch and run an online store, with an app ecosystem for extending functionality. It''s used by businesses ranging from single-product startups to large retail brands.', 'https://www.shopify.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'ecommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Shopify');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'BigCommerce', 'Ecommerce platform built for scale', 'BigCommerce is an ecommerce platform aimed at growing and larger online retailers, with built-in features for multi-channel selling and higher-volume catalogs without needing as many third-party apps as some competitors.', 'https://www.bigcommerce.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'ecommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'BigCommerce');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Squarespace', 'Website builder with built-in online store', 'Squarespace is a website builder known for polished, template-based designs, with built-in ecommerce features for businesses that want a combined marketing website and online store without separate tools.', 'https://www.squarespace.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'ecommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Squarespace');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Zapier', 'Connect apps and automate workflows without code', 'Zapier connects thousands of web apps so that an action in one app can automatically trigger a task in another, without writing code. It''s built around simple trigger-and-action automations for repetitive cross-app tasks.', 'https://zapier.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'automation'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Zapier');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Make', 'Visual, multi-step workflow automation', 'Make (formerly Integromat) is a no-code automation platform that uses a visual, node-based canvas to build multi-step workflows with branching logic and data transformation between apps, suited to more complex automations than simple trigger-action tools.', 'https://www.make.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'automation'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Make');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'ChatGPT', 'AI assistant for writing, research, and Q&A', 'ChatGPT is a conversational AI assistant from OpenAI that can answer questions, draft and edit writing, summarize information, and help with brainstorming and research through a natural chat interface.', 'https://chatgpt.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'ai'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'ChatGPT');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Jasper', 'AI content generation for marketing teams', 'Jasper is an AI writing platform built for marketing teams, generating on-brand blog posts, ad copy, and social content based on defined brand voice and style guidelines, aimed at scaling content production across a team.', 'https://www.jasper.ai', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'ai'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Jasper');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Grammarly', 'AI-powered grammar and writing assistant', 'Grammarly checks writing for grammar, spelling, clarity, and tone across browsers, documents, and email, offering real-time suggestions as you type. It''s used by individuals and teams who want polished writing without a separate editing step.', 'https://www.grammarly.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'ai'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Grammarly');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Midjourney', 'AI image generation from text prompts', 'Midjourney generates images from text descriptions using AI, used by designers, marketers, and hobbyists for concept art, illustrations, and visual ideation. Access is primarily through Discord or Midjourney''s own web interface.', 'https://www.midjourney.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'ai'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Midjourney');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Google Analytics', 'Free website traffic and behavior analytics', 'Google Analytics tracks website traffic, visitor behavior, and conversion data, giving site owners visibility into where visitors come from and how they interact with a site, at no cost for its standard tier.', 'https://analytics.google.com', 'Free',
  (SELECT id FROM public.categories WHERE slug = 'analytics'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Google Analytics');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Mixpanel', 'Product analytics for user behavior', 'Mixpanel tracks user events inside web and mobile products to help teams understand engagement, retention, and conversion funnels, going deeper into in-product behavior than typical website traffic analytics.', 'https://mixpanel.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'analytics'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Mixpanel');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'QuickBooks', 'Accounting and bookkeeping software for small business', 'QuickBooks is accounting software for small and mid-sized businesses covering invoicing, expense tracking, payroll, and financial reporting, widely used by bookkeepers and accountants as a standard tool.', 'https://quickbooks.intuit.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'finance'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'QuickBooks');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Xero', 'Cloud accounting with bank reconciliation', 'Xero is cloud-based accounting software for small businesses, with strong bank feed and reconciliation features, invoicing, and a large ecosystem of connected apps for payroll, inventory, and other business needs.', 'https://www.xero.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'finance'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Xero');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'FreshBooks', 'Simple invoicing and accounting for small business', 'FreshBooks focuses on invoicing, expense tracking, and time tracking for small business owners and freelancers who want straightforward accounting without the complexity of a full enterprise system.', 'https://www.freshbooks.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'finance'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'FreshBooks');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'BambooHR', 'HR software for employee records and time off', 'BambooHR centralizes employee records, time-off tracking, and basic performance and onboarding workflows for small and mid-sized businesses that have outgrown spreadsheets for HR.', 'https://www.bamboohr.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'hr'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'BambooHR');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Gusto', 'Payroll, benefits, and HR for small business', 'Gusto handles payroll processing, employee benefits administration, and basic HR tasks for small businesses, automating tax filings and direct deposits alongside onboarding new hires.', 'https://gusto.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'hr'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Gusto');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Greenhouse', 'Applicant tracking and hiring platform', 'Greenhouse is an applicant tracking system that manages job postings, candidate pipelines, structured interview workflows, and hiring reports, used by recruiting teams to run a consistent, organized hiring process.', 'https://www.greenhouse.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'hr'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Greenhouse');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Zendesk', 'Help desk and customer support ticketing', 'Zendesk is a help desk platform for managing customer support tickets across email, chat, and social channels, with knowledge base tools and reporting on support team performance.', 'https://www.zendesk.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'customer-support'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Zendesk');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Intercom', 'Live chat and conversational customer support', 'Intercom combines live chat, a shared team inbox, and a help center into one customer messaging platform, often used by SaaS companies to support customers directly inside their product or website.', 'https://www.intercom.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'customer-support'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Intercom');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT '1Password', 'Password manager for individuals and teams', '1Password stores and autofills passwords, secure notes, and other credentials, with shared vaults for teams to securely distribute access to shared accounts without exposing raw passwords.', 'https://1password.com', 'Paid',
  (SELECT id FROM public.categories WHERE slug = 'security'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = '1Password');

INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT 'Bitwarden', 'Open-source password manager', 'Bitwarden is an open-source password manager for storing and syncing passwords across devices, with a free tier that covers core password management and paid plans for teams and advanced features.', 'https://bitwarden.com', 'Freemium',
  (SELECT id FROM public.categories WHERE slug = 'security'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = 'Bitwarden');


-- ---------- product tags ----------

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Slack'), (SELECT id FROM public.tags WHERE slug = 'team-chat')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Microsoft Teams'), (SELECT id FROM public.tags WHERE slug = 'team-chat')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Microsoft Teams'), (SELECT id FROM public.tags WHERE slug = 'video-conferencing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Zoom'), (SELECT id FROM public.tags WHERE slug = 'video-conferencing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Discord'), (SELECT id FROM public.tags WHERE slug = 'team-chat')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Notion'), (SELECT id FROM public.tags WHERE slug = 'notes-docs')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Asana'), (SELECT id FROM public.tags WHERE slug = 'project-management')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Trello'), (SELECT id FROM public.tags WHERE slug = 'kanban')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'ClickUp'), (SELECT id FROM public.tags WHERE slug = 'project-management')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Monday.com'), (SELECT id FROM public.tags WHERE slug = 'project-management')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Linear'), (SELECT id FROM public.tags WHERE slug = 'issue-tracking')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Jira'), (SELECT id FROM public.tags WHERE slug = 'issue-tracking')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Airtable'), (SELECT id FROM public.tags WHERE slug = 'spreadsheet-database')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Calendly'), (SELECT id FROM public.tags WHERE slug = 'scheduling')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Canva'), (SELECT id FROM public.tags WHERE slug = 'graphic-design')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Figma'), (SELECT id FROM public.tags WHERE slug = 'ui-design')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Adobe Creative Cloud'), (SELECT id FROM public.tags WHERE slug = 'graphic-design')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Adobe Creative Cloud'), (SELECT id FROM public.tags WHERE slug = 'creative-suite')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Mailchimp'), (SELECT id FROM public.tags WHERE slug = 'email-marketing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Brevo'), (SELECT id FROM public.tags WHERE slug = 'email-marketing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Brevo'), (SELECT id FROM public.tags WHERE slug = 'crm')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Kit (formerly ConvertKit)'), (SELECT id FROM public.tags WHERE slug = 'email-marketing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Hootsuite'), (SELECT id FROM public.tags WHERE slug = 'social-media-scheduling')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Buffer'), (SELECT id FROM public.tags WHERE slug = 'social-media-scheduling')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Semrush'), (SELECT id FROM public.tags WHERE slug = 'seo-tools')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'HubSpot CRM'), (SELECT id FROM public.tags WHERE slug = 'crm')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Salesforce'), (SELECT id FROM public.tags WHERE slug = 'crm')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Pipedrive'), (SELECT id FROM public.tags WHERE slug = 'crm')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Pipedrive'), (SELECT id FROM public.tags WHERE slug = 'sales-pipeline')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'GitHub'), (SELECT id FROM public.tags WHERE slug = 'version-control')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Vercel'), (SELECT id FROM public.tags WHERE slug = 'hosting-deployment')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Postman'), (SELECT id FROM public.tags WHERE slug = 'api-testing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Webflow'), (SELECT id FROM public.tags WHERE slug = 'website-builder')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Shopify'), (SELECT id FROM public.tags WHERE slug = 'ecommerce-platform')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'BigCommerce'), (SELECT id FROM public.tags WHERE slug = 'ecommerce-platform')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Squarespace'), (SELECT id FROM public.tags WHERE slug = 'website-builder')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Squarespace'), (SELECT id FROM public.tags WHERE slug = 'ecommerce-platform')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Zapier'), (SELECT id FROM public.tags WHERE slug = 'no-code-automation')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Make'), (SELECT id FROM public.tags WHERE slug = 'no-code-automation')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'ChatGPT'), (SELECT id FROM public.tags WHERE slug = 'ai-assistant')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'ChatGPT'), (SELECT id FROM public.tags WHERE slug = 'ai-writing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Jasper'), (SELECT id FROM public.tags WHERE slug = 'ai-writing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Grammarly'), (SELECT id FROM public.tags WHERE slug = 'ai-writing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Midjourney'), (SELECT id FROM public.tags WHERE slug = 'ai-image-generation')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Google Analytics'), (SELECT id FROM public.tags WHERE slug = 'web-analytics')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Mixpanel'), (SELECT id FROM public.tags WHERE slug = 'product-analytics')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'QuickBooks'), (SELECT id FROM public.tags WHERE slug = 'accounting')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'QuickBooks'), (SELECT id FROM public.tags WHERE slug = 'invoicing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Xero'), (SELECT id FROM public.tags WHERE slug = 'accounting')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'FreshBooks'), (SELECT id FROM public.tags WHERE slug = 'invoicing')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'FreshBooks'), (SELECT id FROM public.tags WHERE slug = 'accounting')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'BambooHR'), (SELECT id FROM public.tags WHERE slug = 'hr-management')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Gusto'), (SELECT id FROM public.tags WHERE slug = 'payroll')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Greenhouse'), (SELECT id FROM public.tags WHERE slug = 'applicant-tracking')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Zendesk'), (SELECT id FROM public.tags WHERE slug = 'help-desk')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Intercom'), (SELECT id FROM public.tags WHERE slug = 'live-chat')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Intercom'), (SELECT id FROM public.tags WHERE slug = 'help-desk')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = '1Password'), (SELECT id FROM public.tags WHERE slug = 'password-manager')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = 'Bitwarden'), (SELECT id FROM public.tags WHERE slug = 'password-manager')
ON CONFLICT DO NOTHING;


-- ---------- needs ----------

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a team communication tool that keeps conversations organized by topic', 'Email threads get messy fast, and I want a way for my team to chat by project or topic instead of one giant inbox. Looking for something with channels, search, and easy file sharing that works for both quick questions and longer discussions.',
  (SELECT id FROM public.categories WHERE slug = 'communication'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a team communication tool that keeps conversations organized by topic');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need reliable video conferencing software for client calls', 'I run client meetings several times a week and need video calling software that''s stable, easy for non-technical clients to join, and supports screen sharing and recording.',
  (SELECT id FROM public.categories WHERE slug = 'communication'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need reliable video conferencing software for client calls');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a communication tool for a remote team across time zones', 'My team works from different countries and time zones, so we rely heavily on async messaging rather than meetings. I need something built for that kind of communication, not just a repurposed group chat app.',
  (SELECT id FROM public.categories WHERE slug = 'communication'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a communication tool for a remote team across time zones');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a free chat tool for a small community or side project', 'I''m starting a small community around a side project and don''t have budget for paid software yet. I need free text and voice chat that people can join easily without a lot of setup.',
  (SELECT id FROM public.categories WHERE slug = 'communication'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a free chat tool for a small community or side project');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a project management tool for a remote team', 'We''re a fully remote team juggling multiple projects, and tracking who''s responsible for what has become chaotic across spreadsheets and chat messages. I want a proper project management tool with task assignments, deadlines, and progress tracking.',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a project management tool for a remote team');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a simple kanban board to track tasks visually', 'I don''t need anything complicated — just a visual board where I can drag tasks between ''to do,'' ''in progress,'' and ''done.'' Something easy to set up in a few minutes for a small team or personal use.',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a simple kanban board to track tasks visually');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need an all-in-one workspace for notes, docs, and a team wiki', 'We have documentation scattered across different notes apps and old pages nobody updates. I want one flexible workspace where we can write docs, keep notes, and organize everything in one place.',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need an all-in-one workspace for notes, docs, and a team wiki');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need issue tracking software for a software engineering team', 'Our engineering team has outgrown tracking bugs and feature requests in spreadsheets alone. I want dedicated issue tracking with sprints, priorities, and a clear view of what''s in progress.',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need issue tracking software for a software engineering team');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need an easy way to schedule meetings without endless back-and-forth', 'Coordinating meeting times over email always turns into several messages of ''does this time work for you.'' I want to share a link that shows my real availability so people can just pick a slot.',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need an easy way to schedule meetings without endless back-and-forth');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a flexible database to organize business data like a spreadsheet', 'Spreadsheets are getting unwieldy for tracking our inventory, content calendar, and client list, but a full database feels like overkill. I want something in between — spreadsheet-simple but with real relationships between records.',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a flexible database to organize business data like a spreadsheet');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need software to manage sprints and agile workflows', 'We''re moving to a proper sprint-based process and need software built around sprints, backlogs, and priorities rather than generic to-do lists.',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need software to manage sprints and agile workflows');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a tool to manage my personal tasks and daily to-do list', 'I''m not looking for team software — just something simple to track my own personal tasks and daily priorities without a steep learning curve.',
  (SELECT id FROM public.categories WHERE slug = 'productivity'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a tool to manage my personal tasks and daily to-do list');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need software to create professional social media graphics without a design background', 'I run social media for a small business and I''m not a designer, but I still need posts that look polished and on-brand. I want templates I can customize quickly rather than starting from a blank canvas.',
  (SELECT id FROM public.categories WHERE slug = 'design'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need software to create professional social media graphics without a design background');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a collaborative design tool for building UI mockups and prototypes', 'Our product team needs to design app screens, click through prototypes, and get feedback from developers and stakeholders in real time, without emailing files back and forth.',
  (SELECT id FROM public.categories WHERE slug = 'design'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a collaborative design tool for building UI mockups and prototypes');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need professional creative software for photo and video editing', 'I do freelance photo and video work and need industry-standard editing tools that clients and other professionals will expect me to know, not a lightweight consumer app.',
  (SELECT id FROM public.categories WHERE slug = 'design'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need professional creative software for photo and video editing');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need software to design and prototype a mobile app interface', 'I''m designing the interface for a mobile app from scratch and need a tool built for interface design specifically, with the ability to prototype screen transitions and hand off specs to developers.',
  (SELECT id FROM public.categories WHERE slug = 'design'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need software to design and prototype a mobile app interface');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need an affordable email marketing platform for a small business', 'I want to start sending regular newsletters and promotions to our customer list but don''t need enterprise features — just reliable email sending, decent templates, and pricing that fits a small budget.',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need an affordable email marketing platform for a small business');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need email marketing software built for creators and newsletter writers', 'I write a paid newsletter and want software built around that specific use case — automated welcome sequences, simple landing pages, and the ability to sell subscriptions directly, not a generic business tool.',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need email marketing software built for creators and newsletter writers');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a tool to schedule and manage social media posts across multiple platforms', 'I manage several social accounts and I''m tired of logging into each platform separately to post. I want to plan and schedule posts across all of them from one calendar.',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a tool to schedule and manage social media posts across multiple platforms');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need SEO software to research keywords and track search rankings', 'I want to understand what my target customers are actually searching for, see how our site ranks for those terms over time, and get a sense of what competitors are doing for SEO.',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need SEO software to research keywords and track search rankings');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need an all-in-one marketing platform with email, landing pages, and analytics', 'We''re piecing together separate tools for email, landing pages, and reporting, and I want one platform that combines marketing campaigns with the analytics to see what''s actually working.',
  (SELECT id FROM public.categories WHERE slug = 'marketing'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need an all-in-one marketing platform with email, landing pages, and analytics');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a CRM for managing leads and customer relationships', 'We''re tracking leads and customer conversations in a spreadsheet and it''s starting to fall apart as we grow. I want a real CRM to log contacts, deals, and follow-ups in one place.',
  (SELECT id FROM public.categories WHERE slug = 'sales'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a CRM for managing leads and customer relationships');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a visual sales pipeline to track deals from lead to close', 'I want to see exactly where every deal sits — from first contact to closed-won — in a visual pipeline rather than digging through email threads to remember what stage someone''s at.',
  (SELECT id FROM public.categories WHERE slug = 'sales'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a visual sales pipeline to track deals from lead to close');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need enterprise CRM software that scales with a large sales team', 'Our sales org has grown past what a simple CRM can handle — we need deep customization, complex permission structures, and reporting that works across multiple sales teams and regions.',
  (SELECT id FROM public.categories WHERE slug = 'sales'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need enterprise CRM software that scales with a large sales team');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a free or low-cost CRM to get started tracking customers', 'We''re a very early-stage business and just need somewhere basic to log contacts and deals without paying for a CRM built for a much bigger team.',
  (SELECT id FROM public.categories WHERE slug = 'sales'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a free or low-cost CRM to get started tracking customers');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a place to host source code with version control', 'I need somewhere to host my Git repositories, track changes over time, and collaborate with other developers through code review and pull requests.',
  (SELECT id FROM public.categories WHERE slug = 'dev-tools'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a place to host source code with version control');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need an easy way to deploy and host a web app with automatic builds', 'I don''t want to manage servers myself. I want to push code and have it automatically built and deployed, ideally with previews for every change before it goes live.',
  (SELECT id FROM public.categories WHERE slug = 'dev-tools'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need an easy way to deploy and host a web app with automatic builds');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need software to test and document APIs', 'I''m building an API and need a way to send test requests, check responses, and put together documentation that other developers on my team can actually use.',
  (SELECT id FROM public.categories WHERE slug = 'dev-tools'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need software to test and document APIs');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a website builder that doesn''t require writing code', 'I need to build a marketing website with custom layouts, but I don''t want to hand-code HTML and CSS, and a rigid template builder feels too limiting.',
  (SELECT id FROM public.categories WHERE slug = 'dev-tools'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a website builder that doesn''t require writing code');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need software to launch an online store and start selling products', 'I''m launching a small ecommerce business and need a platform that handles the storefront, checkout, and payments so I can focus on the products instead of building a store from scratch.',
  (SELECT id FROM public.categories WHERE slug = 'ecommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need software to launch an online store and start selling products');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need an ecommerce platform that can handle high sales volume', 'Our online store has grown a lot and our current setup is starting to struggle with traffic and order volume. I need a platform built to handle scale without constant workarounds.',
  (SELECT id FROM public.categories WHERE slug = 'ecommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need an ecommerce platform that can handle high sales volume');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a website builder with a built-in online store', 'I want a single tool to build a polished marketing website and sell a small number of products, without managing a separate ecommerce platform on top of my site.',
  (SELECT id FROM public.categories WHERE slug = 'ecommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a website builder with a built-in online store');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need to sell products directly from my existing website', 'I already have a website and just need to add the ability to sell a handful of products, without rebuilding my whole site on a new platform.',
  (SELECT id FROM public.categories WHERE slug = 'ecommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need to sell products directly from my existing website');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need to automate repetitive tasks between different apps without writing code', 'I keep manually copying information between our form tool, spreadsheet, and email platform. I want to automate that so it happens by itself whenever something new comes in.',
  (SELECT id FROM public.categories WHERE slug = 'automation'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need to automate repetitive tasks between different apps without writing code');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need to build complex, multi-step automated workflows visually', 'My automation needs go beyond simple ''if this happens, do that'' — I need branching logic, multiple steps, and the ability to transform data along the way, ideally through a visual builder.',
  (SELECT id FROM public.categories WHERE slug = 'automation'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need to build complex, multi-step automated workflows visually');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need to sync data automatically between my CRM and email tool', 'Every time we get a new lead in our CRM, someone has to manually add them to our email list. I want that to happen automatically without anyone remembering to do it.',
  (SELECT id FROM public.categories WHERE slug = 'automation'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need to sync data automatically between my CRM and email tool');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need an AI assistant to help write emails and answer questions', 'I spend a lot of time drafting emails, summarizing documents, and looking things up. I want an AI assistant I can just ask, that helps me get through that faster.',
  (SELECT id FROM public.categories WHERE slug = 'ai'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need an AI assistant to help write emails and answer questions');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need AI software to generate marketing copy and blog content faster', 'Our small marketing team can''t keep up with the volume of blog posts, ad copy, and social captions we need. I want AI writing software built for marketing specifically, that can stay consistent with our brand voice.',
  (SELECT id FROM public.categories WHERE slug = 'ai'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need AI software to generate marketing copy and blog content faster');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a tool to check grammar and improve my writing', 'I miss typos and awkward phrasing more than I''d like. I want something that checks my writing as I type across email and other apps, not just one document.',
  (SELECT id FROM public.categories WHERE slug = 'ai'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a tool to check grammar and improve my writing');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need AI software to generate images from text descriptions', 'I need concept art and illustrations for a project but don''t have a budget for a professional illustrator for every draft. I want to generate images from text descriptions to explore ideas quickly.',
  (SELECT id FROM public.categories WHERE slug = 'ai'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need AI software to generate images from text descriptions');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need an AI tool to summarize long documents and research quickly', 'I regularly need to get through long reports and articles and want an AI tool that can summarize the key points so I can decide what''s worth reading in full.',
  (SELECT id FROM public.categories WHERE slug = 'ai'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need an AI tool to summarize long documents and research quickly');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need free software to track website traffic and visitor behavior', 'I want to understand where my website visitors are coming from, which pages they view, and where they drop off, without paying for an analytics platform before I even know if I need one.',
  (SELECT id FROM public.categories WHERE slug = 'analytics'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need free software to track website traffic and visitor behavior');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need product analytics to understand how users interact with my app', 'I want to see which features people actually use in my app, where they get stuck, and how that relates to whether they stick around, beyond basic page-view tracking.',
  (SELECT id FROM public.categories WHERE slug = 'analytics'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need product analytics to understand how users interact with my app');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need to run experiments and understand which features drive engagement', 'We want to test changes to our product and measure the actual impact on user behavior and retention, rather than guessing which features matter.',
  (SELECT id FROM public.categories WHERE slug = 'analytics'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need to run experiments and understand which features drive engagement');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need simple invoicing and accounting software for my small business', 'I''m a freelancer and just need to send professional invoices, track what clients owe me, and keep basic records for tax time, without learning full accounting software.',
  (SELECT id FROM public.categories WHERE slug = 'finance'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need simple invoicing and accounting software for my small business');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need accounting software to manage bookkeeping for a growing business', 'We''ve outgrown tracking finances manually and need proper accounting software to handle bookkeeping, reporting, and working with our accountant as the business grows.',
  (SELECT id FROM public.categories WHERE slug = 'finance'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need accounting software to manage bookkeeping for a growing business');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need cloud accounting software with strong bank reconciliation', 'Manually matching bank transactions to our books every month is eating up too much time. I want accounting software that handles bank feeds and reconciliation well.',
  (SELECT id FROM public.categories WHERE slug = 'finance'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need cloud accounting software with strong bank reconciliation');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need software to track business expenses and manage a budget', 'I want a clear picture of where money is going each month and a simple way to categorize and track business expenses against a budget.',
  (SELECT id FROM public.categories WHERE slug = 'finance'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need software to track business expenses and manage a budget');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need HR software to manage employee records and time off', 'We''re tracking employee information and vacation requests across spreadsheets and email, and it''s becoming hard to keep accurate. I want centralized HR software for records and time off.',
  (SELECT id FROM public.categories WHERE slug = 'hr'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need HR software to manage employee records and time off');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need payroll software that also handles benefits for a small business', 'Running payroll manually and separately managing benefits enrollment is taking up too much time each month. I want one system that handles both, including tax filings.',
  (SELECT id FROM public.categories WHERE slug = 'hr'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need payroll software that also handles benefits for a small business');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need an applicant tracking system to manage job candidates', 'We''re hiring for multiple roles at once and tracking candidates through email and spreadsheets is falling apart. I want a proper system to manage applications, interviews, and hiring decisions.',
  (SELECT id FROM public.categories WHERE slug = 'hr'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need an applicant tracking system to manage job candidates');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need onboarding software to get new employees set up quickly', 'New hires currently piece together their own onboarding from scattered documents and emails. I want a structured way to get them set up with the right information and tasks from day one.',
  (SELECT id FROM public.categories WHERE slug = 'hr'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need onboarding software to get new employees set up quickly');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a help desk tool to manage customer support tickets', 'Support requests are coming in through email, and it''s hard to track who''s handling what or make sure nothing falls through the cracks. I want dedicated ticketing software for our support team.',
  (SELECT id FROM public.categories WHERE slug = 'customer-support'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a help desk tool to manage customer support tickets');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need live chat software to talk to customers on my website in real time', 'I want visitors to be able to ask questions and get answers while they''re actually on our website, instead of only being able to reach us by email.',
  (SELECT id FROM public.categories WHERE slug = 'customer-support'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need live chat software to talk to customers on my website in real time');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a shared inbox so my team can manage customer emails together', 'Multiple people on our team handle customer emails, and right now we can''t tell who''s already responded to what. I want a shared inbox built for a support team, not everyone forwarding emails to each other.',
  (SELECT id FROM public.categories WHERE slug = 'customer-support'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a shared inbox so my team can manage customer emails together');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need a secure way to store and share passwords across my team', 'We''re currently sharing passwords over chat and email, which I know isn''t secure. I want a proper password manager built for teams, where we can share access without exposing the actual passwords.',
  (SELECT id FROM public.categories WHERE slug = 'security'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need a secure way to store and share passwords across my team');

INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT 'I need an affordable password manager for personal use', 'I reuse the same few passwords across too many accounts and want a personal password manager to generate and store strong, unique passwords without a high price tag.',
  (SELECT id FROM public.categories WHERE slug = 'security'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = 'I need an affordable password manager for personal use');


-- ---------- need tags ----------

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a team communication tool that keeps conversations organized by topic'), (SELECT id FROM public.tags WHERE slug = 'team-chat')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need reliable video conferencing software for client calls'), (SELECT id FROM public.tags WHERE slug = 'video-conferencing')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a communication tool for a remote team across time zones'), (SELECT id FROM public.tags WHERE slug = 'team-chat')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a free chat tool for a small community or side project'), (SELECT id FROM public.tags WHERE slug = 'team-chat')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a project management tool for a remote team'), (SELECT id FROM public.tags WHERE slug = 'project-management')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a simple kanban board to track tasks visually'), (SELECT id FROM public.tags WHERE slug = 'kanban')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an all-in-one workspace for notes, docs, and a team wiki'), (SELECT id FROM public.tags WHERE slug = 'notes-docs')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need issue tracking software for a software engineering team'), (SELECT id FROM public.tags WHERE slug = 'issue-tracking')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an easy way to schedule meetings without endless back-and-forth'), (SELECT id FROM public.tags WHERE slug = 'scheduling')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a flexible database to organize business data like a spreadsheet'), (SELECT id FROM public.tags WHERE slug = 'spreadsheet-database')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to manage sprints and agile workflows'), (SELECT id FROM public.tags WHERE slug = 'issue-tracking')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a tool to manage my personal tasks and daily to-do list'), (SELECT id FROM public.tags WHERE slug = 'project-management')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to create professional social media graphics without a design background'), (SELECT id FROM public.tags WHERE slug = 'graphic-design')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a collaborative design tool for building UI mockups and prototypes'), (SELECT id FROM public.tags WHERE slug = 'ui-design')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need professional creative software for photo and video editing'), (SELECT id FROM public.tags WHERE slug = 'creative-suite')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to design and prototype a mobile app interface'), (SELECT id FROM public.tags WHERE slug = 'ui-design')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an affordable email marketing platform for a small business'), (SELECT id FROM public.tags WHERE slug = 'email-marketing')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need email marketing software built for creators and newsletter writers'), (SELECT id FROM public.tags WHERE slug = 'email-marketing')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a tool to schedule and manage social media posts across multiple platforms'), (SELECT id FROM public.tags WHERE slug = 'social-media-scheduling')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need SEO software to research keywords and track search rankings'), (SELECT id FROM public.tags WHERE slug = 'seo-tools')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an all-in-one marketing platform with email, landing pages, and analytics'), (SELECT id FROM public.tags WHERE slug = 'email-marketing')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a CRM for managing leads and customer relationships'), (SELECT id FROM public.tags WHERE slug = 'crm')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a visual sales pipeline to track deals from lead to close'), (SELECT id FROM public.tags WHERE slug = 'sales-pipeline')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need enterprise CRM software that scales with a large sales team'), (SELECT id FROM public.tags WHERE slug = 'crm')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a free or low-cost CRM to get started tracking customers'), (SELECT id FROM public.tags WHERE slug = 'crm')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a place to host source code with version control'), (SELECT id FROM public.tags WHERE slug = 'version-control')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an easy way to deploy and host a web app with automatic builds'), (SELECT id FROM public.tags WHERE slug = 'hosting-deployment')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to test and document APIs'), (SELECT id FROM public.tags WHERE slug = 'api-testing')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a website builder that doesn''t require writing code'), (SELECT id FROM public.tags WHERE slug = 'website-builder')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to launch an online store and start selling products'), (SELECT id FROM public.tags WHERE slug = 'ecommerce-platform')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an ecommerce platform that can handle high sales volume'), (SELECT id FROM public.tags WHERE slug = 'ecommerce-platform')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a website builder with a built-in online store'), (SELECT id FROM public.tags WHERE slug = 'website-builder')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a website builder with a built-in online store'), (SELECT id FROM public.tags WHERE slug = 'ecommerce-platform')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to sell products directly from my existing website'), (SELECT id FROM public.tags WHERE slug = 'ecommerce-platform')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to automate repetitive tasks between different apps without writing code'), (SELECT id FROM public.tags WHERE slug = 'no-code-automation')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to build complex, multi-step automated workflows visually'), (SELECT id FROM public.tags WHERE slug = 'no-code-automation')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to sync data automatically between my CRM and email tool'), (SELECT id FROM public.tags WHERE slug = 'no-code-automation')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an AI assistant to help write emails and answer questions'), (SELECT id FROM public.tags WHERE slug = 'ai-assistant')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need AI software to generate marketing copy and blog content faster'), (SELECT id FROM public.tags WHERE slug = 'ai-writing')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a tool to check grammar and improve my writing'), (SELECT id FROM public.tags WHERE slug = 'ai-writing')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need AI software to generate images from text descriptions'), (SELECT id FROM public.tags WHERE slug = 'ai-image-generation')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an AI tool to summarize long documents and research quickly'), (SELECT id FROM public.tags WHERE slug = 'ai-assistant')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need free software to track website traffic and visitor behavior'), (SELECT id FROM public.tags WHERE slug = 'web-analytics')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need product analytics to understand how users interact with my app'), (SELECT id FROM public.tags WHERE slug = 'product-analytics')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to run experiments and understand which features drive engagement'), (SELECT id FROM public.tags WHERE slug = 'product-analytics')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need simple invoicing and accounting software for my small business'), (SELECT id FROM public.tags WHERE slug = 'invoicing')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need accounting software to manage bookkeeping for a growing business'), (SELECT id FROM public.tags WHERE slug = 'accounting')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need cloud accounting software with strong bank reconciliation'), (SELECT id FROM public.tags WHERE slug = 'accounting')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to track business expenses and manage a budget'), (SELECT id FROM public.tags WHERE slug = 'accounting')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need HR software to manage employee records and time off'), (SELECT id FROM public.tags WHERE slug = 'hr-management')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need payroll software that also handles benefits for a small business'), (SELECT id FROM public.tags WHERE slug = 'payroll')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an applicant tracking system to manage job candidates'), (SELECT id FROM public.tags WHERE slug = 'applicant-tracking')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need onboarding software to get new employees set up quickly'), (SELECT id FROM public.tags WHERE slug = 'hr-management')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a help desk tool to manage customer support tickets'), (SELECT id FROM public.tags WHERE slug = 'help-desk')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need live chat software to talk to customers on my website in real time'), (SELECT id FROM public.tags WHERE slug = 'live-chat')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a shared inbox so my team can manage customer emails together'), (SELECT id FROM public.tags WHERE slug = 'help-desk')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a secure way to store and share passwords across my team'), (SELECT id FROM public.tags WHERE slug = 'password-manager')
ON CONFLICT DO NOTHING;

INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an affordable password manager for personal use'), (SELECT id FROM public.tags WHERE slug = 'password-manager')
ON CONFLICT DO NOTHING;


-- ---------- need <-> product relationships ----------

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a team communication tool that keeps conversations organized by topic'), (SELECT id FROM public.products WHERE name = 'Slack'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a team communication tool that keeps conversations organized by topic'), (SELECT id FROM public.products WHERE name = 'Microsoft Teams'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a team communication tool that keeps conversations organized by topic'), (SELECT id FROM public.products WHERE name = 'Discord'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need reliable video conferencing software for client calls'), (SELECT id FROM public.products WHERE name = 'Zoom'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need reliable video conferencing software for client calls'), (SELECT id FROM public.products WHERE name = 'Microsoft Teams'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a communication tool for a remote team across time zones'), (SELECT id FROM public.products WHERE name = 'Slack'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a communication tool for a remote team across time zones'), (SELECT id FROM public.products WHERE name = 'Microsoft Teams'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a communication tool for a remote team across time zones'), (SELECT id FROM public.products WHERE name = 'Discord'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a free chat tool for a small community or side project'), (SELECT id FROM public.products WHERE name = 'Discord'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a project management tool for a remote team'), (SELECT id FROM public.products WHERE name = 'Asana'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a project management tool for a remote team'), (SELECT id FROM public.products WHERE name = 'Monday.com'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a project management tool for a remote team'), (SELECT id FROM public.products WHERE name = 'ClickUp'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a simple kanban board to track tasks visually'), (SELECT id FROM public.products WHERE name = 'Trello'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a simple kanban board to track tasks visually'), (SELECT id FROM public.products WHERE name = 'Asana'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a simple kanban board to track tasks visually'), (SELECT id FROM public.products WHERE name = 'ClickUp'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an all-in-one workspace for notes, docs, and a team wiki'), (SELECT id FROM public.products WHERE name = 'Notion'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an all-in-one workspace for notes, docs, and a team wiki'), (SELECT id FROM public.products WHERE name = 'Airtable'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need issue tracking software for a software engineering team'), (SELECT id FROM public.products WHERE name = 'Linear'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need issue tracking software for a software engineering team'), (SELECT id FROM public.products WHERE name = 'Jira'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need issue tracking software for a software engineering team'), (SELECT id FROM public.products WHERE name = 'ClickUp'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an easy way to schedule meetings without endless back-and-forth'), (SELECT id FROM public.products WHERE name = 'Calendly'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a flexible database to organize business data like a spreadsheet'), (SELECT id FROM public.products WHERE name = 'Airtable'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a flexible database to organize business data like a spreadsheet'), (SELECT id FROM public.products WHERE name = 'Notion'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to manage sprints and agile workflows'), (SELECT id FROM public.products WHERE name = 'Jira'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to manage sprints and agile workflows'), (SELECT id FROM public.products WHERE name = 'Linear'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to manage sprints and agile workflows'), (SELECT id FROM public.products WHERE name = 'ClickUp'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a tool to manage my personal tasks and daily to-do list'), (SELECT id FROM public.products WHERE name = 'Notion'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a tool to manage my personal tasks and daily to-do list'), (SELECT id FROM public.products WHERE name = 'Trello'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to create professional social media graphics without a design background'), (SELECT id FROM public.products WHERE name = 'Canva'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a collaborative design tool for building UI mockups and prototypes'), (SELECT id FROM public.products WHERE name = 'Figma'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need professional creative software for photo and video editing'), (SELECT id FROM public.products WHERE name = 'Adobe Creative Cloud'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to design and prototype a mobile app interface'), (SELECT id FROM public.products WHERE name = 'Figma'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an affordable email marketing platform for a small business'), (SELECT id FROM public.products WHERE name = 'Mailchimp'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an affordable email marketing platform for a small business'), (SELECT id FROM public.products WHERE name = 'Brevo'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need email marketing software built for creators and newsletter writers'), (SELECT id FROM public.products WHERE name = 'Kit (formerly ConvertKit)'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a tool to schedule and manage social media posts across multiple platforms'), (SELECT id FROM public.products WHERE name = 'Hootsuite'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a tool to schedule and manage social media posts across multiple platforms'), (SELECT id FROM public.products WHERE name = 'Buffer'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need SEO software to research keywords and track search rankings'), (SELECT id FROM public.products WHERE name = 'Semrush'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an all-in-one marketing platform with email, landing pages, and analytics'), (SELECT id FROM public.products WHERE name = 'HubSpot CRM'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a CRM for managing leads and customer relationships'), (SELECT id FROM public.products WHERE name = 'HubSpot CRM'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a CRM for managing leads and customer relationships'), (SELECT id FROM public.products WHERE name = 'Pipedrive'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a CRM for managing leads and customer relationships'), (SELECT id FROM public.products WHERE name = 'Salesforce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a visual sales pipeline to track deals from lead to close'), (SELECT id FROM public.products WHERE name = 'Pipedrive'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a visual sales pipeline to track deals from lead to close'), (SELECT id FROM public.products WHERE name = 'HubSpot CRM'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need enterprise CRM software that scales with a large sales team'), (SELECT id FROM public.products WHERE name = 'Salesforce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a free or low-cost CRM to get started tracking customers'), (SELECT id FROM public.products WHERE name = 'HubSpot CRM'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a free or low-cost CRM to get started tracking customers'), (SELECT id FROM public.products WHERE name = 'Pipedrive'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a place to host source code with version control'), (SELECT id FROM public.products WHERE name = 'GitHub'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an easy way to deploy and host a web app with automatic builds'), (SELECT id FROM public.products WHERE name = 'Vercel'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to test and document APIs'), (SELECT id FROM public.products WHERE name = 'Postman'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a website builder that doesn''t require writing code'), (SELECT id FROM public.products WHERE name = 'Webflow'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a website builder that doesn''t require writing code'), (SELECT id FROM public.products WHERE name = 'Squarespace'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to launch an online store and start selling products'), (SELECT id FROM public.products WHERE name = 'Shopify'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to launch an online store and start selling products'), (SELECT id FROM public.products WHERE name = 'BigCommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to launch an online store and start selling products'), (SELECT id FROM public.products WHERE name = 'Squarespace'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an ecommerce platform that can handle high sales volume'), (SELECT id FROM public.products WHERE name = 'BigCommerce'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an ecommerce platform that can handle high sales volume'), (SELECT id FROM public.products WHERE name = 'Shopify'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a website builder with a built-in online store'), (SELECT id FROM public.products WHERE name = 'Squarespace'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to sell products directly from my existing website'), (SELECT id FROM public.products WHERE name = 'Shopify'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to automate repetitive tasks between different apps without writing code'), (SELECT id FROM public.products WHERE name = 'Zapier'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to automate repetitive tasks between different apps without writing code'), (SELECT id FROM public.products WHERE name = 'Make'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to build complex, multi-step automated workflows visually'), (SELECT id FROM public.products WHERE name = 'Make'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to build complex, multi-step automated workflows visually'), (SELECT id FROM public.products WHERE name = 'Zapier'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to sync data automatically between my CRM and email tool'), (SELECT id FROM public.products WHERE name = 'Zapier'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to sync data automatically between my CRM and email tool'), (SELECT id FROM public.products WHERE name = 'Make'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an AI assistant to help write emails and answer questions'), (SELECT id FROM public.products WHERE name = 'ChatGPT'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need AI software to generate marketing copy and blog content faster'), (SELECT id FROM public.products WHERE name = 'Jasper'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need AI software to generate marketing copy and blog content faster'), (SELECT id FROM public.products WHERE name = 'ChatGPT'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a tool to check grammar and improve my writing'), (SELECT id FROM public.products WHERE name = 'Grammarly'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need AI software to generate images from text descriptions'), (SELECT id FROM public.products WHERE name = 'Midjourney'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an AI tool to summarize long documents and research quickly'), (SELECT id FROM public.products WHERE name = 'ChatGPT'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need free software to track website traffic and visitor behavior'), (SELECT id FROM public.products WHERE name = 'Google Analytics'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need product analytics to understand how users interact with my app'), (SELECT id FROM public.products WHERE name = 'Mixpanel'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need to run experiments and understand which features drive engagement'), (SELECT id FROM public.products WHERE name = 'Mixpanel'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need simple invoicing and accounting software for my small business'), (SELECT id FROM public.products WHERE name = 'FreshBooks'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need simple invoicing and accounting software for my small business'), (SELECT id FROM public.products WHERE name = 'QuickBooks'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need accounting software to manage bookkeeping for a growing business'), (SELECT id FROM public.products WHERE name = 'QuickBooks'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need accounting software to manage bookkeeping for a growing business'), (SELECT id FROM public.products WHERE name = 'Xero'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need cloud accounting software with strong bank reconciliation'), (SELECT id FROM public.products WHERE name = 'Xero'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to track business expenses and manage a budget'), (SELECT id FROM public.products WHERE name = 'QuickBooks'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need software to track business expenses and manage a budget'), (SELECT id FROM public.products WHERE name = 'FreshBooks'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need HR software to manage employee records and time off'), (SELECT id FROM public.products WHERE name = 'BambooHR'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need payroll software that also handles benefits for a small business'), (SELECT id FROM public.products WHERE name = 'Gusto'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an applicant tracking system to manage job candidates'), (SELECT id FROM public.products WHERE name = 'Greenhouse'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need onboarding software to get new employees set up quickly'), (SELECT id FROM public.products WHERE name = 'BambooHR'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need onboarding software to get new employees set up quickly'), (SELECT id FROM public.products WHERE name = 'Gusto'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a help desk tool to manage customer support tickets'), (SELECT id FROM public.products WHERE name = 'Zendesk'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need live chat software to talk to customers on my website in real time'), (SELECT id FROM public.products WHERE name = 'Intercom'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need live chat software to talk to customers on my website in real time'), (SELECT id FROM public.products WHERE name = 'Zendesk'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a shared inbox so my team can manage customer emails together'), (SELECT id FROM public.products WHERE name = 'Intercom'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a shared inbox so my team can manage customer emails together'), (SELECT id FROM public.products WHERE name = 'Zendesk'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a secure way to store and share passwords across my team'), (SELECT id FROM public.products WHERE name = '1Password'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need a secure way to store and share passwords across my team'), (SELECT id FROM public.products WHERE name = 'Bitwarden'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an affordable password manager for personal use'), (SELECT id FROM public.products WHERE name = 'Bitwarden'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;

INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = 'I need an affordable password manager for personal use'), (SELECT id FROM public.products WHERE name = '1Password'),
  (SELECT id FROM public.profiles WHERE username = 'needsaas'), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;
