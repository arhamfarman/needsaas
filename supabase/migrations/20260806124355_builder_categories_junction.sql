/*
# Builder Categories Junction Table

## Purpose
During builder onboarding, users select their "Primary Categories" — the
software domains they build in (e.g. Productivity, DevOps, Marketing). This
requires a many-to-many relationship between profiles (builders) and categories.

## Changes

1. New Table: `builder_categories`
   - `id` (uuid, primary key)
   - `builder_id` (uuid, foreign key → profiles.id ON DELETE CASCADE) — the builder's profile
   - `category_id` (uuid, foreign key → categories.id ON DELETE CASCADE) — the selected category
   - `created_at` (timestamptz, default now())
   - UNIQUE constraint on (builder_id, category_id) to prevent duplicate selections

2. Security (RLS)
   - Enable row level security on `builder_categories`.
   - SELECT: public read (anon + authenticated) so category pages and builder
     profiles can display which categories a builder works in.
   - INSERT: authenticated users can only insert their own rows
     (auth.uid() = builder_id).
   - DELETE: authenticated users can only delete their own rows.
   - No UPDATE policy (rows are inserted/deleted, never updated).

3. Indexes
   - Index on `builder_id` for fast lookups of a builder's categories.
   - Index on `category_id` for fast lookups of builders in a category.

## Notes
- `builder_id` references `profiles.id` (not auth.users.id directly), but
  profiles.id IS the auth uid (the profiles table key matches auth.users.id),
  so `auth.uid() = builder_id` correctly enforces ownership.
- Idempotent: uses IF NOT EXISTS for the table and indexes; policies use
  DROP IF EXISTS before CREATE so re-running is safe.
*/

CREATE TABLE IF NOT EXISTS builder_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (builder_id, category_id)
);

ALTER TABLE builder_categories ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see which categories a builder works in
DROP POLICY IF EXISTS "Public can read builder categories" ON builder_categories;
CREATE POLICY "Public can read builder categories"
ON builder_categories FOR SELECT
TO anon, authenticated
USING (true);

-- Insert: only the builder themselves
DROP POLICY IF EXISTS "Builders insert own categories" ON builder_categories;
CREATE POLICY "Builders insert own categories"
ON builder_categories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = builder_id);

-- Delete: only the builder themselves
DROP POLICY IF EXISTS "Builders delete own categories" ON builder_categories;
CREATE POLICY "Builders delete own categories"
ON builder_categories FOR DELETE
TO authenticated
USING (auth.uid() = builder_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_builder_categories_builder_id ON builder_categories(builder_id);
CREATE INDEX IF NOT EXISTS idx_builder_categories_category_id ON builder_categories(category_id);
