/*
# Category SEO enhancements

## What this does
Adds optional SEO fields to categories and a category_faqs table for FAQ sections
on category landing pages.

## Modified Tables
- `categories`: adds `seo_title` (text), `seo_description` (text), `long_description` (text)

## New Tables
- `category_faqs`: FAQs per category (id, category_id, question, answer, sort_order)

## Security
- category_faqs: public SELECT, admin INSERT/UPDATE/DELETE (same pattern as starter_pack_faqs)
*/

ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS long_description text;

CREATE TABLE IF NOT EXISTS category_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE category_faqs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_catfaq_cat ON category_faqs (category_id);

DROP POLICY IF EXISTS "catfaq_select" ON category_faqs;
CREATE POLICY "catfaq_select" ON category_faqs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "catfaq_insert_admin" ON category_faqs;
CREATE POLICY "catfaq_insert_admin" ON category_faqs FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "catfaq_update_admin" ON category_faqs;
CREATE POLICY "catfaq_update_admin" ON category_faqs FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "catfaq_delete_admin" ON category_faqs;
CREATE POLICY "catfaq_delete_admin" ON category_faqs FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
