// NeedSaaS launch content dataset — source of truth for the seed migration.
// Every product fact here is a stable, well-established, publicly-verifiable
// claim (what it does, who it's for). No pricing figures, ratings, user
// counts, or awards are included anywhere — those are either omitted or left
// to the existing trigger-maintained counters, which start at zero and grow
// from real usage.

const NEW_CATEGORIES = [
  { slug: 'communication', name: 'Communication', icon: 'MessageCircle',
    description: 'Team messaging, video calls, and real-time collaboration tools that keep conversations organized.' },
  { slug: 'automation', name: 'Automation', icon: 'Workflow',
    description: 'No-code and low-code tools that connect your apps and automate repetitive work.' },
];

// seo_title / seo_description / long_description for all 14 categories
// (12 existing + 2 new). Existing name/slug/description are left untouched.
const CATEGORY_SEO = {
  marketing: {
    seo_title: 'Marketing Software: Email, Social & SEO Tools',
    seo_description: 'Compare marketing software for email campaigns, social media scheduling, and SEO — find the right tool for growing an audience and driving sales.',
    long_description: 'Marketing software covers everything from sending email newsletters to scheduling social posts to researching what your customers are searching for. The right tool depends mostly on scale and channel: a solo creator sending a weekly newsletter has very different needs than a team running email, social, and SEO campaigns together across a whole customer journey.',
  },
  sales: {
    seo_title: 'CRM & Sales Software for Managing Leads and Deals',
    seo_description: 'Find CRM software to track leads, manage your sales pipeline, and close deals — from free starter CRMs to enterprise-grade sales platforms.',
    long_description: 'A CRM keeps every lead, deal, and customer conversation in one place instead of scattered across email and spreadsheets. Smaller teams often start with a free or low-cost CRM focused on a simple visual pipeline, while larger sales organizations need more configuration, permissions, and reporting as their process gets more complex.',
  },
  'dev-tools': {
    seo_title: 'Developer Tools: Hosting, APIs & Website Builders',
    seo_description: 'Discover developer tools for code hosting, deployment, API testing, and building websites — from version control to no-code site builders.',
    long_description: 'Developer tools span the full path from writing and hosting code to deploying it and building the interfaces around it. That includes version control and code review, one-click deployment platforms, API testing and documentation tools, and visual website builders for teams that want production-quality sites without hand-coding everything.',
  },
  analytics: {
    seo_title: 'Data & Analytics Software: Web and Product Analytics',
    seo_description: 'Compare analytics software for tracking website traffic and understanding how users interact with your product — from free web analytics to in-depth product analytics.',
    long_description: 'Analytics software falls into two broad categories: website analytics, which shows where visitors come from and what pages they view, and product analytics, which tracks specific in-app events to understand engagement, retention, and conversion funnels for logged-in users.',
  },
  ai: {
    seo_title: 'AI Tools for Writing, Images & Assistance',
    seo_description: 'Explore AI software for writing assistance, marketing content generation, and image creation — tools that help you work faster with AI.',
    long_description: 'AI tools now cover writing assistance, content generation at scale, grammar and editing, and generating images from text descriptions. Which one fits depends on the task: a general-purpose AI assistant for research and drafting is a different tool than AI writing software built specifically for a marketing team\'s brand voice.',
  },
  design: {
    seo_title: 'Design & Creative Software for Graphics, UI & Video',
    seo_description: 'Find design software for social graphics, UI/UX design, and professional creative work — from beginner-friendly templates to industry-standard creative suites.',
    long_description: 'Design software ranges from template-driven tools built for non-designers making social graphics, to dedicated interface design tools for product teams, to professional creative suites used by working designers, photographers, and video editors. The right fit depends on your skill level and how specialized the output needs to be.',
  },
  productivity: {
    seo_title: 'Productivity Software: Project Management, Notes & Scheduling',
    seo_description: 'Compare productivity software for project management, notes and docs, issue tracking, and meeting scheduling — tools to organize how your team works.',
    long_description: 'Productivity software is the broadest category here, covering project and task management, notes and internal documentation, issue tracking for engineering teams, flexible databases, and scheduling tools that remove the back-and-forth from booking meetings. Most teams end up combining two or three of these rather than relying on one tool for everything.',
  },
  finance: {
    seo_title: 'Finance & Accounting Software for Small Business',
    seo_description: 'Find accounting and invoicing software for small businesses — from simple invoicing tools for freelancers to full bookkeeping software for growing teams.',
    long_description: 'Finance and accounting software ranges from simple invoicing tools built for freelancers and solo business owners, to full accounting platforms that handle bookkeeping, bank reconciliation, and reporting for a growing business working with an accountant.',
  },
  hr: {
    seo_title: 'HR & Recruiting Software: Payroll, Records & Hiring',
    seo_description: 'Compare HR software for employee records, payroll and benefits, and applicant tracking — tools for managing people as your team grows.',
    long_description: 'HR software covers employee records and time off, payroll and benefits administration, and applicant tracking for hiring. Small teams often start managing this in spreadsheets, then move to dedicated software once record-keeping, payroll compliance, or hiring volume gets hard to track manually.',
  },
  'customer-support': {
    seo_title: 'Customer Support Software: Help Desk & Live Chat',
    seo_description: 'Discover customer support software for ticketing, live chat, and shared inboxes — tools to help your team respond to customers faster and stay organized.',
    long_description: 'Customer support software helps a team manage incoming questions without losing track of who\'s handling what. That includes traditional help desk ticketing, live chat for real-time conversations on your website, and shared inboxes so a team can collaborate on email support without forwarding messages around.',
  },
  ecommerce: {
    seo_title: 'Ecommerce Software: Online Store Platforms',
    seo_description: 'Compare ecommerce platforms for launching an online store — from all-in-one storefronts to platforms built for high-volume, growing retailers.',
    long_description: 'Ecommerce software provides the storefront, checkout, and payment processing needed to sell online. Options range from all-in-one platforms built to launch a store quickly, to website builders with ecommerce features bolted on, to platforms built specifically to handle high order volume as a store scales.',
  },
  security: {
    seo_title: 'Security & Password Management Software',
    seo_description: 'Find password managers and security software for individuals and teams — securely store, share, and generate strong passwords.',
    long_description: 'Password managers store and autofill credentials so people stop reusing weak passwords across accounts. For teams, they add shared vaults so a group can access shared logins without ever seeing or exposing the actual password.',
  },
  communication: {
    seo_title: 'Communication Software: Team Chat & Video Calls',
    seo_description: 'Compare team communication software for chat and video calls — from channel-based messaging to video conferencing built for client meetings.',
    long_description: 'Communication software covers real-time and async team messaging, organized by channel or topic, plus video conferencing for meetings and calls. Remote and distributed teams in particular rely on this category to replace the hallway conversations and drop-by meetings that in-office teams take for granted.',
  },
  automation: {
    seo_title: 'Automation Software: Connect Apps Without Code',
    seo_description: 'Discover no-code automation software that connects your apps and automates repetitive tasks — from simple trigger-action automations to complex multi-step workflows.',
    long_description: 'Automation software connects the other apps a business already uses so that data moves between them automatically instead of being copied by hand. Simpler tools handle one trigger leading to one action; more advanced ones support branching logic and multi-step workflows across many apps at once.',
  },
};

const TAGS = [
  'team-chat', 'video-conferencing', 'notes-docs', 'project-management', 'kanban',
  'issue-tracking', 'scheduling', 'spreadsheet-database', 'graphic-design', 'ui-design',
  'creative-suite', 'email-marketing', 'crm', 'social-media-scheduling', 'seo-tools',
  'sales-pipeline', 'version-control', 'hosting-deployment', 'api-testing', 'website-builder',
  'ecommerce-platform', 'no-code-automation', 'ai-assistant', 'ai-writing', 'ai-image-generation',
  'web-analytics', 'product-analytics', 'accounting', 'invoicing', 'hr-management',
  'payroll', 'applicant-tracking', 'help-desk', 'live-chat', 'password-manager',
];

// pricing values match the app's existing radio options: Free / Freemium / Paid / Open Source
const PRODUCTS = [
  // Communication
  { slug: 'slack', name: 'Slack', tagline: 'Channel-based messaging for teams', category: 'communication',
    description: "Slack organizes team conversations into channels by topic, project, or team, alongside direct messages and file sharing, with integrations for thousands of other work tools. It's built for teams that want both async and real-time chat in one place, with search that makes old conversations easy to find.",
    url: 'https://slack.com', pricing: 'Freemium', tags: ['team-chat'] },
  { slug: 'microsoft-teams', name: 'Microsoft Teams', tagline: 'Chat, video calls, and Office apps in one hub', category: 'communication',
    description: "Microsoft Teams combines persistent group chat, video meetings, and file collaboration with deep integration into Word, Excel, and the rest of Microsoft 365. It's a common choice for organizations already standardized on Microsoft's productivity suite.",
    url: 'https://www.microsoft.com/microsoft-teams', pricing: 'Freemium', tags: ['team-chat', 'video-conferencing'] },
  { slug: 'zoom', name: 'Zoom', tagline: 'Video conferencing for meetings and webinars', category: 'communication',
    description: "Zoom is video conferencing software for one-on-one calls, team meetings, and larger webinars, with screen sharing, recording, and virtual backgrounds. It's widely used for both internal meetings and client-facing calls.",
    url: 'https://zoom.us', pricing: 'Freemium', tags: ['video-conferencing'] },
  { slug: 'discord', name: 'Discord', tagline: 'Voice, video, and text chat organized into servers', category: 'communication',
    description: "Discord organizes conversations into servers with topic-based text and voice channels. Originally built for gaming communities, it's now also used by remote teams, creators, and communities for informal, always-on chat.",
    url: 'https://discord.com', pricing: 'Free', tags: ['team-chat'] },

  // Productivity
  { slug: 'notion', name: 'Notion', tagline: 'All-in-one workspace for notes, docs, and wikis', category: 'productivity',
    description: "Notion combines notes, documents, wikis, and lightweight databases into a single flexible workspace that teams can structure however they like. It's popular for internal documentation, personal notes, and simple project tracking side by side.",
    url: 'https://www.notion.so', pricing: 'Freemium', tags: ['notes-docs'] },
  { slug: 'asana', name: 'Asana', tagline: 'Project and task management for teams', category: 'productivity',
    description: "Asana helps teams plan projects, assign tasks, and track progress through lists, boards, timelines, and calendars. It's built for cross-functional teams that need visibility into who's doing what and by when.",
    url: 'https://asana.com', pricing: 'Freemium', tags: ['project-management'] },
  { slug: 'trello', name: 'Trello', tagline: 'Visual task boards using the kanban method', category: 'productivity',
    description: "Trello organizes work into boards, lists, and cards you drag between stages, making it a simple way to visualize a workflow from start to finish. It's a lightweight option for individuals and small teams who want structure without complexity.",
    url: 'https://trello.com', pricing: 'Freemium', tags: ['kanban'] },
  { slug: 'clickup', name: 'ClickUp', tagline: 'Configurable project management for any workflow', category: 'productivity',
    description: "ClickUp bundles tasks, docs, goals, and time tracking into one platform with customizable views including lists, boards, and Gantt charts. It's aimed at teams that want one tool to replace several separate apps.",
    url: 'https://clickup.com', pricing: 'Freemium', tags: ['project-management'] },
  { slug: 'monday', name: 'Monday.com', tagline: 'Visual work management platform', category: 'productivity',
    description: "Monday.com uses color-coded boards to track projects, workflows, and processes across teams like sales, marketing, and operations, with automation rules to reduce manual updates. It's designed to be customized to a team's process rather than following one fixed methodology.",
    url: 'https://monday.com', pricing: 'Freemium', tags: ['project-management'] },
  { slug: 'linear', name: 'Linear', tagline: 'Fast issue tracking for software teams', category: 'productivity',
    description: "Linear is an issue tracker and project tool built specifically for software engineering teams, known for a fast, keyboard-driven interface and an opinionated workflow built around cycles and projects. It's aimed at product and engineering teams that find heavier tools slow or overly complex.",
    url: 'https://linear.app', pricing: 'Freemium', tags: ['issue-tracking'] },
  { slug: 'jira', name: 'Jira', tagline: 'Issue tracking and agile project management', category: 'productivity',
    description: "Jira is Atlassian's issue tracking and agile project management tool, widely used by software teams to plan sprints, track bugs, and manage backlogs with configurable workflows. It's especially common in larger engineering organizations that need detailed reporting and permissions.",
    url: 'https://www.atlassian.com/software/jira', pricing: 'Freemium', tags: ['issue-tracking'] },
  { slug: 'airtable', name: 'Airtable', tagline: 'Spreadsheet-database hybrid for organizing anything', category: 'productivity',
    description: "Airtable looks like a spreadsheet but works like a database, letting teams build custom views, link related records, and automate workflows without writing code. It's used for everything from content calendars to inventory tracking to simple CRMs.",
    url: 'https://www.airtable.com', pricing: 'Freemium', tags: ['spreadsheet-database'] },
  { slug: 'calendly', name: 'Calendly', tagline: 'Automated meeting scheduling', category: 'productivity',
    description: "Calendly lets people share a booking link that shows their real-time availability, so others can schedule a meeting without back-and-forth emails. It syncs with common calendar apps and supports different meeting types, buffers, and time zones automatically.",
    url: 'https://calendly.com', pricing: 'Freemium', tags: ['scheduling'] },

  // Design & UI
  { slug: 'canva', name: 'Canva', tagline: 'Drag-and-drop design for social graphics and presentations', category: 'design',
    description: "Canva provides templates and a drag-and-drop editor for creating social media graphics, presentations, flyers, and marketing materials without prior design experience. It's aimed at non-designers who need professional-looking visuals quickly.",
    url: 'https://www.canva.com', pricing: 'Freemium', tags: ['graphic-design'] },
  { slug: 'figma', name: 'Figma', tagline: 'Collaborative interface design and prototyping', category: 'design',
    description: "Figma is a browser-based design tool for creating user interfaces, wireframes, and interactive prototypes, with real-time multiplayer editing similar to a shared document. It's become a standard tool for product design and design-to-developer handoff.",
    url: 'https://www.figma.com', pricing: 'Freemium', tags: ['ui-design'] },
  { slug: 'adobe-creative-cloud', name: 'Adobe Creative Cloud', tagline: 'Professional creative software suite', category: 'design',
    description: "Adobe Creative Cloud bundles professional creative applications, including Photoshop, Illustrator, and Premiere Pro, for photo editing, vector graphics, and video production. It's the industry-standard toolkit for many professional designers, photographers, and video editors.",
    url: 'https://www.adobe.com/creativecloud.html', pricing: 'Paid', tags: ['graphic-design', 'creative-suite'] },

  // Marketing
  { slug: 'mailchimp', name: 'Mailchimp', tagline: 'Email marketing and marketing automation', category: 'marketing',
    description: "Mailchimp is an email marketing platform that helps small businesses design campaigns, segment audiences, and automate follow-up sequences, along with basic landing pages and CRM features. It's one of the most widely recognized entry points into email marketing.",
    url: 'https://mailchimp.com', pricing: 'Freemium', tags: ['email-marketing'] },
  { slug: 'brevo', name: 'Brevo', tagline: 'Email, SMS, and CRM marketing platform', category: 'marketing',
    description: "Brevo (formerly Sendinblue) combines email and SMS marketing, marketing automation, and a built-in CRM in one platform, aimed at small and mid-sized businesses that want multiple channels without stitching together separate tools.",
    url: 'https://www.brevo.com', pricing: 'Freemium', tags: ['email-marketing', 'crm'] },
  { slug: 'kit-convertkit', name: 'Kit (formerly ConvertKit)', tagline: 'Email marketing built for creators', category: 'marketing',
    description: "Kit, formerly known as ConvertKit, is an email marketing platform built specifically for creators, writers, and newsletter businesses, with visual automation sequences, landing pages, and tools to sell digital products directly to subscribers.",
    url: 'https://kit.com', pricing: 'Freemium', tags: ['email-marketing'] },
  { slug: 'hootsuite', name: 'Hootsuite', tagline: 'Schedule and manage social media from one dashboard', category: 'marketing',
    description: "Hootsuite lets teams schedule posts, monitor mentions, and manage multiple social media accounts from a single dashboard, with reporting to track engagement across platforms. It's aimed at marketing teams managing several social channels at once.",
    url: 'https://www.hootsuite.com', pricing: 'Paid', tags: ['social-media-scheduling'] },
  { slug: 'buffer', name: 'Buffer', tagline: 'Simple social media scheduling', category: 'marketing',
    description: "Buffer is a straightforward social media scheduling tool for planning and publishing posts across platforms, with a simpler interface and feature set than larger social suites. It's popular with solo creators, freelancers, and small marketing teams.",
    url: 'https://buffer.com', pricing: 'Freemium', tags: ['social-media-scheduling'] },
  { slug: 'semrush', name: 'Semrush', tagline: 'SEO, keyword research, and competitive analysis', category: 'marketing',
    description: "Semrush is an SEO and online visibility platform for keyword research, tracking search rankings, auditing websites, and analyzing competitors' organic and paid search strategies. It's used by marketers, agencies, and SEO specialists to guide content and search strategy.",
    url: 'https://www.semrush.com', pricing: 'Paid', tags: ['seo-tools'] },

  // Sales & CRM
  { slug: 'hubspot-crm', name: 'HubSpot CRM', tagline: 'Free CRM with marketing and sales tools', category: 'sales',
    description: "HubSpot CRM tracks contacts, deals, and communication history for a sales team, with a free starting tier and optional add-on hubs for marketing, sales, and customer service. It's a common starting point for small businesses wanting to combine CRM with lightweight marketing tools.",
    url: 'https://www.hubspot.com/products/crm', pricing: 'Freemium', tags: ['crm'] },
  { slug: 'salesforce', name: 'Salesforce', tagline: 'Enterprise-grade CRM platform', category: 'sales',
    description: "Salesforce is a highly configurable CRM platform used by sales, service, and marketing teams to manage the full customer lifecycle, with extensive customization and a large ecosystem of add-on apps. It's most often chosen by larger organizations with complex sales processes.",
    url: 'https://www.salesforce.com', pricing: 'Paid', tags: ['crm'] },
  { slug: 'pipedrive', name: 'Pipedrive', tagline: 'Visual sales pipeline CRM', category: 'sales',
    description: "Pipedrive is a CRM built around a visual sales pipeline, designed to help sales teams see exactly where every deal stands and what needs to happen next. It's built to be simpler to set up than larger enterprise CRMs while still covering core sales tracking needs.",
    url: 'https://www.pipedrive.com', pricing: 'Paid', tags: ['crm', 'sales-pipeline'] },

  // Developer Tools
  { slug: 'github', name: 'GitHub', tagline: 'Code hosting, version control, and collaboration', category: 'dev-tools',
    description: "GitHub hosts Git repositories for version control and provides tools for code review, issue tracking, and CI/CD pipelines through GitHub Actions. It's the most widely used platform for hosting both open-source and private software projects.",
    url: 'https://github.com', pricing: 'Freemium', tags: ['version-control'] },
  { slug: 'vercel', name: 'Vercel', tagline: 'Deploy and host frontend web applications', category: 'dev-tools',
    description: "Vercel is a cloud platform for deploying frontend web applications, with automatic builds from Git, a global edge network, and serverless functions. It's especially popular with teams building on frameworks like Next.js.",
    url: 'https://vercel.com', pricing: 'Freemium', tags: ['hosting-deployment'] },
  { slug: 'postman', name: 'Postman', tagline: 'Build, test, and document APIs', category: 'dev-tools',
    description: "Postman is a tool for building, testing, and documenting APIs, letting developers send requests, automate test suites, and share collections with a team. It's widely used across backend and API development workflows.",
    url: 'https://www.postman.com', pricing: 'Freemium', tags: ['api-testing'] },
  { slug: 'webflow', name: 'Webflow', tagline: 'Visual website builder with production-ready code', category: 'dev-tools',
    description: "Webflow lets designers visually build responsive websites that generate clean, production-ready code, combining the control of hand-coding with a no-code visual editor. It includes a built-in CMS for managing content like blog posts.",
    url: 'https://webflow.com', pricing: 'Freemium', tags: ['website-builder'] },

  // E-Commerce
  { slug: 'shopify', name: 'Shopify', tagline: 'Launch and run an online store', category: 'ecommerce',
    description: "Shopify provides the storefront, checkout, payments, and inventory tools needed to launch and run an online store, with an app ecosystem for extending functionality. It's used by businesses ranging from single-product startups to large retail brands.",
    url: 'https://www.shopify.com', pricing: 'Paid', tags: ['ecommerce-platform'] },
  { slug: 'bigcommerce', name: 'BigCommerce', tagline: 'Ecommerce platform built for scale', category: 'ecommerce',
    description: "BigCommerce is an ecommerce platform aimed at growing and larger online retailers, with built-in features for multi-channel selling and higher-volume catalogs without needing as many third-party apps as some competitors.",
    url: 'https://www.bigcommerce.com', pricing: 'Paid', tags: ['ecommerce-platform'] },
  { slug: 'squarespace', name: 'Squarespace', tagline: 'Website builder with built-in online store', category: 'ecommerce',
    description: "Squarespace is a website builder known for polished, template-based designs, with built-in ecommerce features for businesses that want a combined marketing website and online store without separate tools.",
    url: 'https://www.squarespace.com', pricing: 'Paid', tags: ['website-builder', 'ecommerce-platform'] },

  // Automation
  { slug: 'zapier', name: 'Zapier', tagline: 'Connect apps and automate workflows without code', category: 'automation',
    description: "Zapier connects thousands of web apps so that an action in one app can automatically trigger a task in another, without writing code. It's built around simple trigger-and-action automations for repetitive cross-app tasks.",
    url: 'https://zapier.com', pricing: 'Freemium', tags: ['no-code-automation'] },
  { slug: 'make', name: 'Make', tagline: 'Visual, multi-step workflow automation', category: 'automation',
    description: "Make (formerly Integromat) is a no-code automation platform that uses a visual, node-based canvas to build multi-step workflows with branching logic and data transformation between apps, suited to more complex automations than simple trigger-action tools.",
    url: 'https://www.make.com', pricing: 'Freemium', tags: ['no-code-automation'] },

  // AI
  { slug: 'chatgpt', name: 'ChatGPT', tagline: 'AI assistant for writing, research, and Q&A', category: 'ai',
    description: "ChatGPT is a conversational AI assistant from OpenAI that can answer questions, draft and edit writing, summarize information, and help with brainstorming and research through a natural chat interface.",
    url: 'https://chatgpt.com', pricing: 'Freemium', tags: ['ai-assistant', 'ai-writing'] },
  { slug: 'jasper', name: 'Jasper', tagline: 'AI content generation for marketing teams', category: 'ai',
    description: "Jasper is an AI writing platform built for marketing teams, generating on-brand blog posts, ad copy, and social content based on defined brand voice and style guidelines, aimed at scaling content production across a team.",
    url: 'https://www.jasper.ai', pricing: 'Paid', tags: ['ai-writing'] },
  { slug: 'grammarly', name: 'Grammarly', tagline: 'AI-powered grammar and writing assistant', category: 'ai',
    description: "Grammarly checks writing for grammar, spelling, clarity, and tone across browsers, documents, and email, offering real-time suggestions as you type. It's used by individuals and teams who want polished writing without a separate editing step.",
    url: 'https://www.grammarly.com', pricing: 'Freemium', tags: ['ai-writing'] },
  { slug: 'midjourney', name: 'Midjourney', tagline: 'AI image generation from text prompts', category: 'ai',
    description: "Midjourney generates images from text descriptions using AI, used by designers, marketers, and hobbyists for concept art, illustrations, and visual ideation. Access is primarily through Discord or Midjourney's own web interface.",
    url: 'https://www.midjourney.com', pricing: 'Paid', tags: ['ai-image-generation'] },

  // Data & Analytics
  { slug: 'google-analytics', name: 'Google Analytics', tagline: 'Free website traffic and behavior analytics', category: 'analytics',
    description: "Google Analytics tracks website traffic, visitor behavior, and conversion data, giving site owners visibility into where visitors come from and how they interact with a site, at no cost for its standard tier.",
    url: 'https://analytics.google.com', pricing: 'Free', tags: ['web-analytics'] },
  { slug: 'mixpanel', name: 'Mixpanel', tagline: 'Product analytics for user behavior', category: 'analytics',
    description: "Mixpanel tracks user events inside web and mobile products to help teams understand engagement, retention, and conversion funnels, going deeper into in-product behavior than typical website traffic analytics.",
    url: 'https://mixpanel.com', pricing: 'Freemium', tags: ['product-analytics'] },

  // Finance & Accounting
  { slug: 'quickbooks', name: 'QuickBooks', tagline: 'Accounting and bookkeeping software for small business', category: 'finance',
    description: "QuickBooks is accounting software for small and mid-sized businesses covering invoicing, expense tracking, payroll, and financial reporting, widely used by bookkeepers and accountants as a standard tool.",
    url: 'https://quickbooks.intuit.com', pricing: 'Paid', tags: ['accounting', 'invoicing'] },
  { slug: 'xero', name: 'Xero', tagline: 'Cloud accounting with bank reconciliation', category: 'finance',
    description: "Xero is cloud-based accounting software for small businesses, with strong bank feed and reconciliation features, invoicing, and a large ecosystem of connected apps for payroll, inventory, and other business needs.",
    url: 'https://www.xero.com', pricing: 'Paid', tags: ['accounting'] },
  { slug: 'freshbooks', name: 'FreshBooks', tagline: 'Simple invoicing and accounting for small business', category: 'finance',
    description: "FreshBooks focuses on invoicing, expense tracking, and time tracking for small business owners and freelancers who want straightforward accounting without the complexity of a full enterprise system.",
    url: 'https://www.freshbooks.com', pricing: 'Paid', tags: ['invoicing', 'accounting'] },

  // HR & Recruiting
  { slug: 'bamboohr', name: 'BambooHR', tagline: 'HR software for employee records and time off', category: 'hr',
    description: "BambooHR centralizes employee records, time-off tracking, and basic performance and onboarding workflows for small and mid-sized businesses that have outgrown spreadsheets for HR.",
    url: 'https://www.bamboohr.com', pricing: 'Paid', tags: ['hr-management'] },
  { slug: 'gusto', name: 'Gusto', tagline: 'Payroll, benefits, and HR for small business', category: 'hr',
    description: "Gusto handles payroll processing, employee benefits administration, and basic HR tasks for small businesses, automating tax filings and direct deposits alongside onboarding new hires.",
    url: 'https://gusto.com', pricing: 'Paid', tags: ['payroll'] },
  { slug: 'greenhouse', name: 'Greenhouse', tagline: 'Applicant tracking and hiring platform', category: 'hr',
    description: "Greenhouse is an applicant tracking system that manages job postings, candidate pipelines, structured interview workflows, and hiring reports, used by recruiting teams to run a consistent, organized hiring process.",
    url: 'https://www.greenhouse.com', pricing: 'Paid', tags: ['applicant-tracking'] },

  // Customer Support
  { slug: 'zendesk', name: 'Zendesk', tagline: 'Help desk and customer support ticketing', category: 'customer-support',
    description: "Zendesk is a help desk platform for managing customer support tickets across email, chat, and social channels, with knowledge base tools and reporting on support team performance.",
    url: 'https://www.zendesk.com', pricing: 'Paid', tags: ['help-desk'] },
  { slug: 'intercom', name: 'Intercom', tagline: 'Live chat and conversational customer support', category: 'customer-support',
    description: "Intercom combines live chat, a shared team inbox, and a help center into one customer messaging platform, often used by SaaS companies to support customers directly inside their product or website.",
    url: 'https://www.intercom.com', pricing: 'Paid', tags: ['live-chat', 'help-desk'] },

  // Security & Compliance
  { slug: '1password', name: '1Password', tagline: 'Password manager for individuals and teams', category: 'security',
    description: "1Password stores and autofills passwords, secure notes, and other credentials, with shared vaults for teams to securely distribute access to shared accounts without exposing raw passwords.",
    url: 'https://1password.com', pricing: 'Paid', tags: ['password-manager'] },
  { slug: 'bitwarden', name: 'Bitwarden', tagline: 'Open-source password manager', category: 'security',
    description: "Bitwarden is an open-source password manager for storing and syncing passwords across devices, with a free tier that covers core password management and paid plans for teams and advanced features.",
    url: 'https://bitwarden.com', pricing: 'Freemium', tags: ['password-manager'] },
];

// Each need lists product slugs it should be linked to via need_product_links.
// status is 'fulfilled' for all of these — they represent real, existing
// search-intent problems that already have real solutions linked, which is
// the honest state (not an unsolved "please build this" request).
const NEEDS = [
  // Communication
  { title: 'I need a team communication tool that keeps conversations organized by topic', category: 'communication',
    description: "Email threads get messy fast, and I want a way for my team to chat by project or topic instead of one giant inbox. Looking for something with channels, search, and easy file sharing that works for both quick questions and longer discussions.",
    products: ['slack', 'microsoft-teams', 'discord'], tags: ['team-chat'] },
  { title: "I need reliable video conferencing software for client calls", category: 'communication',
    description: "I run client meetings several times a week and need video calling software that's stable, easy for non-technical clients to join, and supports screen sharing and recording.",
    products: ['zoom', 'microsoft-teams'], tags: ['video-conferencing'] },
  { title: 'I need a communication tool for a remote team across time zones', category: 'communication',
    description: "My team works from different countries and time zones, so we rely heavily on async messaging rather than meetings. I need something built for that kind of communication, not just a repurposed group chat app.",
    products: ['slack', 'microsoft-teams', 'discord'], tags: ['team-chat'] },
  { title: 'I need a free chat tool for a small community or side project', category: 'communication',
    description: "I'm starting a small community around a side project and don't have budget for paid software yet. I need free text and voice chat that people can join easily without a lot of setup.",
    products: ['discord'], tags: ['team-chat'] },

  // Productivity
  { title: 'I need a project management tool for a remote team', category: 'productivity',
    description: "We're a fully remote team juggling multiple projects, and tracking who's responsible for what has become chaotic across spreadsheets and chat messages. I want a proper project management tool with task assignments, deadlines, and progress tracking.",
    products: ['asana', 'monday', 'clickup'], tags: ['project-management'] },
  { title: 'I need a simple kanban board to track tasks visually', category: 'productivity',
    description: "I don't need anything complicated — just a visual board where I can drag tasks between 'to do,' 'in progress,' and 'done.' Something easy to set up in a few minutes for a small team or personal use.",
    products: ['trello', 'asana', 'clickup'], tags: ['kanban'] },
  { title: 'I need an all-in-one workspace for notes, docs, and a team wiki', category: 'productivity',
    description: "We have documentation scattered across different notes apps and old pages nobody updates. I want one flexible workspace where we can write docs, keep notes, and organize everything in one place.",
    products: ['notion', 'airtable'], tags: ['notes-docs'] },
  { title: 'I need issue tracking software for a software engineering team', category: 'productivity',
    description: "Our engineering team has outgrown tracking bugs and feature requests in spreadsheets alone. I want dedicated issue tracking with sprints, priorities, and a clear view of what's in progress.",
    products: ['linear', 'jira', 'clickup'], tags: ['issue-tracking'] },
  { title: "I need an easy way to schedule meetings without endless back-and-forth", category: 'productivity',
    description: "Coordinating meeting times over email always turns into several messages of 'does this time work for you.' I want to share a link that shows my real availability so people can just pick a slot.",
    products: ['calendly'], tags: ['scheduling'] },
  { title: 'I need a flexible database to organize business data like a spreadsheet', category: 'productivity',
    description: "Spreadsheets are getting unwieldy for tracking our inventory, content calendar, and client list, but a full database feels like overkill. I want something in between — spreadsheet-simple but with real relationships between records.",
    products: ['airtable', 'notion'], tags: ['spreadsheet-database'] },
  { title: 'I need software to manage sprints and agile workflows', category: 'productivity',
    description: "We're moving to a proper sprint-based process and need software built around sprints, backlogs, and priorities rather than generic to-do lists.",
    products: ['jira', 'linear', 'clickup'], tags: ['issue-tracking'] },
  { title: 'I need a tool to manage my personal tasks and daily to-do list', category: 'productivity',
    description: "I'm not looking for team software — just something simple to track my own personal tasks and daily priorities without a steep learning curve.",
    products: ['notion', 'trello'], tags: ['project-management'] },

  // Design & UI
  { title: 'I need software to create professional social media graphics without a design background', category: 'design',
    description: "I run social media for a small business and I'm not a designer, but I still need posts that look polished and on-brand. I want templates I can customize quickly rather than starting from a blank canvas.",
    products: ['canva'], tags: ['graphic-design'] },
  { title: 'I need a collaborative design tool for building UI mockups and prototypes', category: 'design',
    description: "Our product team needs to design app screens, click through prototypes, and get feedback from developers and stakeholders in real time, without emailing files back and forth.",
    products: ['figma'], tags: ['ui-design'] },
  { title: 'I need professional creative software for photo and video editing', category: 'design',
    description: "I do freelance photo and video work and need industry-standard editing tools that clients and other professionals will expect me to know, not a lightweight consumer app.",
    products: ['adobe-creative-cloud'], tags: ['creative-suite'] },
  { title: "I need software to design and prototype a mobile app interface", category: 'design',
    description: "I'm designing the interface for a mobile app from scratch and need a tool built for interface design specifically, with the ability to prototype screen transitions and hand off specs to developers.",
    products: ['figma'], tags: ['ui-design'] },

  // Marketing
  { title: 'I need an affordable email marketing platform for a small business', category: 'marketing',
    description: "I want to start sending regular newsletters and promotions to our customer list but don't need enterprise features — just reliable email sending, decent templates, and pricing that fits a small budget.",
    products: ['mailchimp', 'brevo'], tags: ['email-marketing'] },
  { title: 'I need email marketing software built for creators and newsletter writers', category: 'marketing',
    description: "I write a paid newsletter and want software built around that specific use case — automated welcome sequences, simple landing pages, and the ability to sell subscriptions directly, not a generic business tool.",
    products: ['kit-convertkit'], tags: ['email-marketing'] },
  { title: 'I need a tool to schedule and manage social media posts across multiple platforms', category: 'marketing',
    description: "I manage several social accounts and I'm tired of logging into each platform separately to post. I want to plan and schedule posts across all of them from one calendar.",
    products: ['hootsuite', 'buffer'], tags: ['social-media-scheduling'] },
  { title: 'I need SEO software to research keywords and track search rankings', category: 'marketing',
    description: "I want to understand what my target customers are actually searching for, see how our site ranks for those terms over time, and get a sense of what competitors are doing for SEO.",
    products: ['semrush'], tags: ['seo-tools'] },
  { title: 'I need an all-in-one marketing platform with email, landing pages, and analytics', category: 'marketing',
    description: "We're piecing together separate tools for email, landing pages, and reporting, and I want one platform that combines marketing campaigns with the analytics to see what's actually working.",
    products: ['hubspot-crm'], tags: ['email-marketing'] },

  // Sales & CRM
  { title: 'I need a CRM for managing leads and customer relationships', category: 'sales',
    description: "We're tracking leads and customer conversations in a spreadsheet and it's starting to fall apart as we grow. I want a real CRM to log contacts, deals, and follow-ups in one place.",
    products: ['hubspot-crm', 'pipedrive', 'salesforce'], tags: ['crm'] },
  { title: 'I need a visual sales pipeline to track deals from lead to close', category: 'sales',
    description: "I want to see exactly where every deal sits — from first contact to closed-won — in a visual pipeline rather than digging through email threads to remember what stage someone's at.",
    products: ['pipedrive', 'hubspot-crm'], tags: ['sales-pipeline'] },
  { title: 'I need enterprise CRM software that scales with a large sales team', category: 'sales',
    description: "Our sales org has grown past what a simple CRM can handle — we need deep customization, complex permission structures, and reporting that works across multiple sales teams and regions.",
    products: ['salesforce'], tags: ['crm'] },
  { title: 'I need a free or low-cost CRM to get started tracking customers', category: 'sales',
    description: "We're a very early-stage business and just need somewhere basic to log contacts and deals without paying for a CRM built for a much bigger team.",
    products: ['hubspot-crm', 'pipedrive'], tags: ['crm'] },

  // Developer Tools
  { title: 'I need a place to host source code with version control', category: 'dev-tools',
    description: "I need somewhere to host my Git repositories, track changes over time, and collaborate with other developers through code review and pull requests.",
    products: ['github'], tags: ['version-control'] },
  { title: 'I need an easy way to deploy and host a web app with automatic builds', category: 'dev-tools',
    description: "I don't want to manage servers myself. I want to push code and have it automatically built and deployed, ideally with previews for every change before it goes live.",
    products: ['vercel'], tags: ['hosting-deployment'] },
  { title: 'I need software to test and document APIs', category: 'dev-tools',
    description: "I'm building an API and need a way to send test requests, check responses, and put together documentation that other developers on my team can actually use.",
    products: ['postman'], tags: ['api-testing'] },
  { title: "I need a website builder that doesn't require writing code", category: 'dev-tools',
    description: "I need to build a marketing website with custom layouts, but I don't want to hand-code HTML and CSS, and a rigid template builder feels too limiting.",
    products: ['webflow', 'squarespace'], tags: ['website-builder'] },

  // E-Commerce
  { title: 'I need software to launch an online store and start selling products', category: 'ecommerce',
    description: "I'm launching a small ecommerce business and need a platform that handles the storefront, checkout, and payments so I can focus on the products instead of building a store from scratch.",
    products: ['shopify', 'bigcommerce', 'squarespace'], tags: ['ecommerce-platform'] },
  { title: 'I need an ecommerce platform that can handle high sales volume', category: 'ecommerce',
    description: "Our online store has grown a lot and our current setup is starting to struggle with traffic and order volume. I need a platform built to handle scale without constant workarounds.",
    products: ['bigcommerce', 'shopify'], tags: ['ecommerce-platform'] },
  { title: 'I need a website builder with a built-in online store', category: 'ecommerce',
    description: "I want a single tool to build a polished marketing website and sell a small number of products, without managing a separate ecommerce platform on top of my site.",
    products: ['squarespace'], tags: ['website-builder', 'ecommerce-platform'] },
  { title: 'I need to sell products directly from my existing website', category: 'ecommerce',
    description: "I already have a website and just need to add the ability to sell a handful of products, without rebuilding my whole site on a new platform.",
    products: ['shopify'], tags: ['ecommerce-platform'] },

  // Automation
  { title: 'I need to automate repetitive tasks between different apps without writing code', category: 'automation',
    description: "I keep manually copying information between our form tool, spreadsheet, and email platform. I want to automate that so it happens by itself whenever something new comes in.",
    products: ['zapier', 'make'], tags: ['no-code-automation'] },
  { title: 'I need to build complex, multi-step automated workflows visually', category: 'automation',
    description: "My automation needs go beyond simple 'if this happens, do that' — I need branching logic, multiple steps, and the ability to transform data along the way, ideally through a visual builder.",
    products: ['make', 'zapier'], tags: ['no-code-automation'] },
  { title: 'I need to sync data automatically between my CRM and email tool', category: 'automation',
    description: "Every time we get a new lead in our CRM, someone has to manually add them to our email list. I want that to happen automatically without anyone remembering to do it.",
    products: ['zapier', 'make'], tags: ['no-code-automation'] },

  // AI
  { title: 'I need an AI assistant to help write emails and answer questions', category: 'ai',
    description: "I spend a lot of time drafting emails, summarizing documents, and looking things up. I want an AI assistant I can just ask, that helps me get through that faster.",
    products: ['chatgpt'], tags: ['ai-assistant'] },
  { title: 'I need AI software to generate marketing copy and blog content faster', category: 'ai',
    description: "Our small marketing team can't keep up with the volume of blog posts, ad copy, and social captions we need. I want AI writing software built for marketing specifically, that can stay consistent with our brand voice.",
    products: ['jasper', 'chatgpt'], tags: ['ai-writing'] },
  { title: 'I need a tool to check grammar and improve my writing', category: 'ai',
    description: "I miss typos and awkward phrasing more than I'd like. I want something that checks my writing as I type across email and other apps, not just one document.",
    products: ['grammarly'], tags: ['ai-writing'] },
  { title: 'I need AI software to generate images from text descriptions', category: 'ai',
    description: "I need concept art and illustrations for a project but don't have a budget for a professional illustrator for every draft. I want to generate images from text descriptions to explore ideas quickly.",
    products: ['midjourney'], tags: ['ai-image-generation'] },
  { title: 'I need an AI tool to summarize long documents and research quickly', category: 'ai',
    description: "I regularly need to get through long reports and articles and want an AI tool that can summarize the key points so I can decide what's worth reading in full.",
    products: ['chatgpt'], tags: ['ai-assistant'] },

  // Data & Analytics
  { title: 'I need free software to track website traffic and visitor behavior', category: 'analytics',
    description: "I want to understand where my website visitors are coming from, which pages they view, and where they drop off, without paying for an analytics platform before I even know if I need one.",
    products: ['google-analytics'], tags: ['web-analytics'] },
  { title: 'I need product analytics to understand how users interact with my app', category: 'analytics',
    description: "I want to see which features people actually use in my app, where they get stuck, and how that relates to whether they stick around, beyond basic page-view tracking.",
    products: ['mixpanel'], tags: ['product-analytics'] },
  { title: 'I need to run experiments and understand which features drive engagement', category: 'analytics',
    description: "We want to test changes to our product and measure the actual impact on user behavior and retention, rather than guessing which features matter.",
    products: ['mixpanel'], tags: ['product-analytics'] },

  // Finance & Accounting
  { title: 'I need simple invoicing and accounting software for my small business', category: 'finance',
    description: "I'm a freelancer and just need to send professional invoices, track what clients owe me, and keep basic records for tax time, without learning full accounting software.",
    products: ['freshbooks', 'quickbooks'], tags: ['invoicing'] },
  { title: 'I need accounting software to manage bookkeeping for a growing business', category: 'finance',
    description: "We've outgrown tracking finances manually and need proper accounting software to handle bookkeeping, reporting, and working with our accountant as the business grows.",
    products: ['quickbooks', 'xero'], tags: ['accounting'] },
  { title: 'I need cloud accounting software with strong bank reconciliation', category: 'finance',
    description: "Manually matching bank transactions to our books every month is eating up too much time. I want accounting software that handles bank feeds and reconciliation well.",
    products: ['xero'], tags: ['accounting'] },
  { title: 'I need software to track business expenses and manage a budget', category: 'finance',
    description: "I want a clear picture of where money is going each month and a simple way to categorize and track business expenses against a budget.",
    products: ['quickbooks', 'freshbooks'], tags: ['accounting'] },

  // HR & Recruiting
  { title: 'I need HR software to manage employee records and time off', category: 'hr',
    description: "We're tracking employee information and vacation requests across spreadsheets and email, and it's becoming hard to keep accurate. I want centralized HR software for records and time off.",
    products: ['bamboohr'], tags: ['hr-management'] },
  { title: 'I need payroll software that also handles benefits for a small business', category: 'hr',
    description: "Running payroll manually and separately managing benefits enrollment is taking up too much time each month. I want one system that handles both, including tax filings.",
    products: ['gusto'], tags: ['payroll'] },
  { title: 'I need an applicant tracking system to manage job candidates', category: 'hr',
    description: "We're hiring for multiple roles at once and tracking candidates through email and spreadsheets is falling apart. I want a proper system to manage applications, interviews, and hiring decisions.",
    products: ['greenhouse'], tags: ['applicant-tracking'] },
  { title: 'I need onboarding software to get new employees set up quickly', category: 'hr',
    description: "New hires currently piece together their own onboarding from scattered documents and emails. I want a structured way to get them set up with the right information and tasks from day one.",
    products: ['bamboohr', 'gusto'], tags: ['hr-management'] },

  // Customer Support
  { title: 'I need a help desk tool to manage customer support tickets', category: 'customer-support',
    description: "Support requests are coming in through email, and it's hard to track who's handling what or make sure nothing falls through the cracks. I want dedicated ticketing software for our support team.",
    products: ['zendesk'], tags: ['help-desk'] },
  { title: 'I need live chat software to talk to customers on my website in real time', category: 'customer-support',
    description: "I want visitors to be able to ask questions and get answers while they're actually on our website, instead of only being able to reach us by email.",
    products: ['intercom', 'zendesk'], tags: ['live-chat'] },
  { title: 'I need a shared inbox so my team can manage customer emails together', category: 'customer-support',
    description: "Multiple people on our team handle customer emails, and right now we can't tell who's already responded to what. I want a shared inbox built for a support team, not everyone forwarding emails to each other.",
    products: ['intercom', 'zendesk'], tags: ['help-desk'] },

  // Security & Compliance
  { title: 'I need a secure way to store and share passwords across my team', category: 'security',
    description: "We're currently sharing passwords over chat and email, which I know isn't secure. I want a proper password manager built for teams, where we can share access without exposing the actual passwords.",
    products: ['1password', 'bitwarden'], tags: ['password-manager'] },
  { title: 'I need an affordable password manager for personal use', category: 'security',
    description: "I reuse the same few passwords across too many accounts and want a personal password manager to generate and store strong, unique passwords without a high price tag.",
    products: ['bitwarden', '1password'], tags: ['password-manager'] },
];

module.exports = { NEW_CATEGORIES, CATEGORY_SEO, TAGS, PRODUCTS, NEEDS };
