/*
# Starter Packs: software/AI-agent/automation sections + "ideas you could post"

## Why
NeedSaaS's positioning was updated to make clear it isn't limited to
traditional SaaS requests -- a Need can just as validly be an AI agent, an
agentic workflow, or a business-automation request. The Starter Packs data
model only supported one flat list of linked `products`, which can't
represent "here's real software" vs. "here's a real AI/automation tool that
could cover part of this" vs. "here's something you could ask a NeedSaaS
builder for that doesn't exist as an off-the-shelf product." This adds the
smallest schema change that supports all three without a redesign.

## What this does
1. `starter_pack_products.section` -- a text/CHECK enum ('software',
   'ai_agent', 'automation'), defaulting to 'software' so every existing row
   (and every row the admin editor in components/starter-pack-admin.tsx
   already inserts, which doesn't set this column) keeps behaving exactly as
   before with no data migration needed. Real products already in the
   catalog (Zapier, Make, ChatGPT, etc.) can now be tagged into the
   'ai_agent' or 'automation' section of a pack instead of being lumped in
   with the general software list.
2. `starter_pack_ideas` -- a new table for **illustrative example Need
   prompts** ("I need an AI agent that qualifies incoming leads..."), shown
   on a pack page as ideas a visitor could post, NOT as real posted Needs.
   This is deliberately a separate table from `needs` (no fake rows go into
   the real Needs table) and separate from the existing `starter_pack_needs`
   junction (which links to *real*, admin-curated Need rows) -- the two must
   never be presented as the same kind of content. Follows the identical
   RLS pattern as every other pack child table: public SELECT only when the
   parent pack is published (or caller is admin), admin-only writes.

## Content policy
No row this table (or any future admin-authored one) may claim or imply
real user activity/demand -- these are editorial suggestions only, and the
frontend must present them as such (e.g. "Ideas you could post", never
"Popular Needs" or similar language implying real aggregate demand).
*/

-- ---------- starter_pack_products: section tag ----------
ALTER TABLE starter_pack_products ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'software';
ALTER TABLE starter_pack_products DROP CONSTRAINT IF EXISTS starter_pack_products_section_check;
ALTER TABLE starter_pack_products ADD CONSTRAINT starter_pack_products_section_check
  CHECK (section IN ('software', 'ai_agent', 'automation'));

-- ---------- starter_pack_ideas: illustrative example Need prompts ----------
CREATE TABLE IF NOT EXISTS starter_pack_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starter_pack_id uuid NOT NULL REFERENCES starter_packs(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  note text,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE starter_pack_ideas ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_spi_pack ON starter_pack_ideas (starter_pack_id);

DROP POLICY IF EXISTS "spi_select" ON starter_pack_ideas;
CREATE POLICY "spi_select" ON starter_pack_ideas FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM starter_packs sp WHERE sp.id = starter_pack_ideas.starter_pack_id AND sp.published = true)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "spi_insert_admin" ON starter_pack_ideas;
CREATE POLICY "spi_insert_admin" ON starter_pack_ideas FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spi_update_admin" ON starter_pack_ideas;
CREATE POLICY "spi_update_admin" ON starter_pack_ideas FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "spi_delete_admin" ON starter_pack_ideas;
CREATE POLICY "spi_delete_admin" ON starter_pack_ideas FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
