/*
# Build Rewards tables and Need lifecycle columns

## New Tables
- `contributions` — User contributions to a Need's Build Reward pool
- `builder_interest` — Builders who expressed interest in or committed to building a Need

## Modified Tables
- `needs` — Added reward_amount, contributor_count, timeline, reward_note, builder_committed_id, committed_at, progress
- Status constraint expanded: open, committed, building, fulfilled, closed

## Triggers
- `sync_need_reward` — maintains reward_amount + contributor_count on needs
*/

-- ==========================================================
-- Expand needs status constraint and add lifecycle columns
-- ==========================================================

DO $$ BEGIN
  ALTER TABLE public.needs DROP CONSTRAINT IF EXISTS needs_status_check;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.needs
  ADD CONSTRAINT needs_status_check
  CHECK (status IN ('open','committed','building','fulfilled','closed'));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='reward_amount') THEN
    ALTER TABLE public.needs ADD COLUMN reward_amount numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='contributor_count') THEN
    ALTER TABLE public.needs ADD COLUMN contributor_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='timeline') THEN
    ALTER TABLE public.needs ADD COLUMN timeline text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='reward_note') THEN
    ALTER TABLE public.needs ADD COLUMN reward_note text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='builder_committed_id') THEN
    ALTER TABLE public.needs ADD COLUMN builder_committed_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='committed_at') THEN
    ALTER TABLE public.needs ADD COLUMN committed_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='needs' AND column_name='progress') THEN
    ALTER TABLE public.needs ADD COLUMN progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS needs_reward_amount_idx ON public.needs(reward_amount DESC);
CREATE INDEX IF NOT EXISTS needs_builder_committed_idx ON public.needs(builder_committed_id);

-- ==========================================================
-- contributions table
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS contributions_need_idx ON public.contributions(need_id);
CREATE INDEX IF NOT EXISTS contributions_user_idx ON public.contributions(user_id);

-- ==========================================================
-- builder_interest table
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.builder_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES public.needs(id) ON DELETE CASCADE,
  builder_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'interested' CHECK (type IN ('interested','committed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (need_id, builder_id)
);

ALTER TABLE public.builder_interest ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS builder_interest_need_idx ON public.builder_interest(need_id);
CREATE INDEX IF NOT EXISTS builder_interest_builder_idx ON public.builder_interest(builder_id);

-- ==========================================================
-- Trigger: sync need reward_amount + contributor_count
-- ==========================================================

CREATE OR REPLACE FUNCTION public.sync_need_reward() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total numeric;
  cnt integer;
BEGIN
  SELECT COALESCE(SUM(amount), 0), COUNT(DISTINCT user_id)
  INTO total, cnt
  FROM public.contributions
  WHERE need_id = COALESCE(NEW.need_id, OLD.need_id);

  UPDATE public.needs
  SET reward_amount = total, contributor_count = cnt
  WHERE id = COALESCE(NEW.need_id, OLD.need_id);

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS contributions_sync ON public.contributions;
CREATE TRIGGER contributions_sync
  AFTER INSERT OR DELETE OR UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.sync_need_reward();
