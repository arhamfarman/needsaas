-- Seed categories for the application
-- Run this in your Supabase SQL Editor to populate the categories table

INSERT INTO public.categories (slug, name, description, icon) VALUES
('marketing', 'Marketing', 'Tools to help you grow your audience, manage campaigns, and increase sales.', 'Megaphone'),
('sales', 'Sales & CRM', 'Software for tracking leads, managing customer relationships, and closing deals.', 'TrendingUp'),
('dev-tools', 'Developer Tools', 'Infrastructure, deployment, monitoring, and coding utilities.', 'Terminal'),
('analytics', 'Data & Analytics', 'Business intelligence, product analytics, and data visualization.', 'LineChart'),
('ai', 'Artificial Intelligence', 'AI-powered tools, LLM wrappers, and automated generative platforms.', 'Sparkles'),
('design', 'Design & UI', 'Graphic design, prototyping, video editing, and creative tools.', 'PenTool'),
('productivity', 'Productivity', 'Note-taking, task management, time tracking, and collaboration.', 'CheckSquare'),
('finance', 'Finance & Accounting', 'Invoicing, bookkeeping, expense tracking, and payroll solutions.', 'DollarSign'),
('hr', 'HR & Recruiting', 'Applicant tracking, employee engagement, and team management.', 'Users'),
('customer-support', 'Customer Support', 'Help desks, live chat, ticketing, and knowledge base software.', 'MessageSquare'),
('ecommerce', 'E-Commerce', 'Storefronts, inventory management, fulfillment, and checkout solutions.', 'ShoppingCart'),
('security', 'Security & Compliance', 'Authentication, data protection, privacy tools, and compliance monitoring.', 'ShieldCheck')
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon;
