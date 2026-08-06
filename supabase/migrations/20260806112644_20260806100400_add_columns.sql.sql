/*
# Add profile, product, and need columns for pro builder features

Adds columns needed for:
- Pro Builder subscriptions (profiles)
- Verified Builder badges (profiles)
- Featured/boosted products (products)
- View/bookmark counts (products, needs)
- NeedScore columns (needs)
*/

-- Profile columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'cover_url') THEN
    ALTER TABLE profiles ADD COLUMN cover_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified') THEN
    ALTER TABLE profiles ADD COLUMN verified boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pro_builder') THEN
    ALTER TABLE profiles ADD COLUMN pro_builder boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pro_builder_since') THEN
    ALTER TABLE profiles ADD COLUMN pro_builder_since timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pro_builder_until') THEN
    ALTER TABLE profiles ADD COLUMN pro_builder_until timestamptz;
  END IF;
END $$;

-- Product columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'featured') THEN
    ALTER TABLE products ADD COLUMN featured boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'view_count') THEN
    ALTER TABLE products ADD COLUMN view_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'bookmark_count') THEN
    ALTER TABLE products ADD COLUMN bookmark_count integer DEFAULT 0;
  END IF;
END $$;

-- Need columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'needs' AND column_name = 'bookmark_count') THEN
    ALTER TABLE needs ADD COLUMN bookmark_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'needs' AND column_name = 'need_score') THEN
    ALTER TABLE needs ADD COLUMN need_score numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'needs' AND column_name = 'need_score_trend') THEN
    ALTER TABLE needs ADD COLUMN need_score_trend text DEFAULT 'stable';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'needs' AND column_name = 'need_score_updated_at') THEN
    ALTER TABLE needs ADD COLUMN need_score_updated_at timestamptz;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_paid ON products (paid);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_needs_status ON needs (status);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles (verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_pro_builder ON profiles (pro_builder) WHERE pro_builder = true;
