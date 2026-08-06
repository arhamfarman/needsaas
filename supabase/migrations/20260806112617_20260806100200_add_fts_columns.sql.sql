/*
# Add FTS vector columns and indexes

Adds generated tsvector columns to products, needs, profiles, and categories
for PostgreSQL full text search. These are needed before the search functions.
*/

-- Products FTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fts_vector') THEN
    ALTER TABLE products ADD COLUMN fts_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
      ) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING gin (fts_vector);

-- Needs FTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'needs' AND column_name = 'fts_vector') THEN
    ALTER TABLE needs ADD COLUMN fts_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
      ) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_needs_fts ON needs USING gin (fts_vector);

-- Profiles FTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'fts_vector') THEN
    ALTER TABLE profiles ADD COLUMN fts_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(username, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(full_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(bio, '')), 'C')
      ) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_profiles_fts ON profiles USING gin (fts_vector);

-- Categories FTS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'fts_vector') THEN
    ALTER TABLE categories ADD COLUMN fts_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
      ) STORED;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_categories_fts ON categories USING gin (fts_vector);
