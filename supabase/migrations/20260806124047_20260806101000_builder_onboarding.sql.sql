/*
# Progressive Builder Onboarding: account model changes

## What this does
Updates the profiles table to support the unified account model where every
user starts as a standard account and can become a builder through onboarding.
Adds need_follows and notifications tables for the user dashboard.

## Modified Tables
- `profiles`: adds `linkedin` (text), `country` (text), `builder_onboarded` (boolean, default false)

## New Tables
1. `need_follows` — allows users to follow needs
2. `notifications` — in-app notifications for users

## Security
- need_follows: users can CRUD their own follows
- notifications: users can SELECT/UPDATE/DELETE their own notifications
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS builder_onboarded boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS need_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  need_id uuid NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, need_id)
);
ALTER TABLE need_follows ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_needfollows_user ON need_follows (user_id);
CREATE INDEX IF NOT EXISTS idx_needfollows_need ON need_follows (need_id);

DROP POLICY IF EXISTS "nf_select_own" ON need_follows;
CREATE POLICY "nf_select_own" ON need_follows FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "nf_insert_own" ON need_follows;
CREATE POLICY "nf_insert_own" ON need_follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "nf_delete_own" ON need_follows;
CREATE POLICY "nf_delete_own" ON need_follows FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id);

DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_insert_own" ON notifications;
CREATE POLICY "notif_insert_own" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_own" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

UPDATE profiles SET builder_onboarded = true
WHERE id IN (SELECT DISTINCT owner_id FROM products WHERE owner_id IS NOT NULL);
