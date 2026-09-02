// Generates the SQL migration for the NeedSaaS launch content seed.
// Run: node generate.js > output.sql
//
// Idempotency strategy:
//  - categories/tags have UNIQUE(slug) -> ON CONFLICT (slug) DO NOTHING
//  - products/needs have no unique text column -> INSERT ... WHERE NOT EXISTS
//  - link/junction tables have real UNIQUE/PK constraints -> ON CONFLICT DO NOTHING
// Re-running this migration is always safe.

const { NEW_CATEGORIES, CATEGORY_SEO, TAGS, PRODUCTS, NEEDS } = require('./data');

function esc(s) {
  if (s === null || s === undefined) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

const OWNER_USERNAME = 'needsaas';
let sql = [];

sql.push(`/*
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
  profile (username '${OWNER_USERNAME}') rather than pretending these
  companies signed up as builders. See profiles_update below for the bio
  that makes this explicit on the profile page.
- All needs are inserted with status='fulfilled', vote_count=0,
  reward_amount=0, bookmark_count=0 — they represent real search-intent
  problems that already have real solutions linked (need_product_links),
  not fabricated community engagement.

## Requires
A profile with username '${OWNER_USERNAME}' must already exist (create it by
signing up normally through the app, then confirming the email — this
migration does not create auth.users rows). The DO block below fails loudly
with a clear message if that profile is missing, rather than inserting bad
data.
*/

DO $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT id INTO v_owner_id FROM public.profiles WHERE username = ${esc(OWNER_USERNAME)};
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Content owner profile "%" not found. Sign up that account first, then re-run this migration.', ${esc(OWNER_USERNAME)};
  END IF;
END $$;

-- ---------- editorial profile identity ----------
UPDATE public.profiles SET
  full_name = 'NeedSaaS Editorial Team',
  bio = 'Official software directory entries curated and researched by the NeedSaaS team. We are not affiliated with, endorsed by, or partnered with the companies listed here — these are independent, informational listings to help you discover software that solves real problems.',
  verified = true,
  builder_onboarded = true,
  updated_at = now()
WHERE username = ${esc(OWNER_USERNAME)};

-- ---------- new categories ----------`);

for (const c of NEW_CATEGORIES) {
  sql.push(`INSERT INTO public.categories (slug, name, description, icon)
VALUES (${esc(c.slug)}, ${esc(c.name)}, ${esc(c.description)}, ${esc(c.icon)})
ON CONFLICT (slug) DO NOTHING;`);
}

sql.push(`\n-- ---------- category SEO fields (all 14 categories) ----------`);
for (const [slug, seo] of Object.entries(CATEGORY_SEO)) {
  sql.push(`UPDATE public.categories SET
  seo_title = ${esc(seo.seo_title)},
  seo_description = ${esc(seo.seo_description)},
  long_description = ${esc(seo.long_description)}
WHERE slug = ${esc(slug)};`);
}

sql.push(`\n-- ---------- tags ----------`);
for (const t of TAGS) {
  const name = t.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  sql.push(`INSERT INTO public.tags (name, slug) VALUES (${esc(name)}, ${esc(t)}) ON CONFLICT (slug) DO NOTHING;`);
}

sql.push(`\n-- ---------- products ----------`);
for (const p of PRODUCTS) {
  sql.push(`INSERT INTO public.products (name, tagline, description, url, pricing, category_id, owner_id, paid, paid_at)
SELECT ${esc(p.name)}, ${esc(p.tagline)}, ${esc(p.description)}, ${esc(p.url)}, ${esc(p.pricing)},
  (SELECT id FROM public.categories WHERE slug = ${esc(p.category)}),
  (SELECT id FROM public.profiles WHERE username = ${esc(OWNER_USERNAME)}),
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE name = ${esc(p.name)});`);
}

sql.push(`\n-- ---------- product tags ----------`);
for (const p of PRODUCTS) {
  for (const t of p.tags) {
    sql.push(`INSERT INTO public.product_tags (product_id, tag_id)
SELECT (SELECT id FROM public.products WHERE name = ${esc(p.name)}), (SELECT id FROM public.tags WHERE slug = ${esc(t)})
ON CONFLICT DO NOTHING;`);
  }
}

sql.push(`\n-- ---------- needs ----------`);
for (const n of NEEDS) {
  sql.push(`INSERT INTO public.needs (title, description, category_id, owner_id, status, timeline)
SELECT ${esc(n.title)}, ${esc(n.description)},
  (SELECT id FROM public.categories WHERE slug = ${esc(n.category)}),
  (SELECT id FROM public.profiles WHERE username = ${esc(OWNER_USERNAME)}),
  'fulfilled', 'flexible'
WHERE NOT EXISTS (SELECT 1 FROM public.needs WHERE title = ${esc(n.title)});`);
}

sql.push(`\n-- ---------- need tags ----------`);
for (const n of NEEDS) {
  for (const t of n.tags) {
    sql.push(`INSERT INTO public.need_tags (need_id, tag_id)
SELECT (SELECT id FROM public.needs WHERE title = ${esc(n.title)}), (SELECT id FROM public.tags WHERE slug = ${esc(t)})
ON CONFLICT DO NOTHING;`);
  }
}

sql.push(`\n-- ---------- need <-> product relationships ----------`);
for (const n of NEEDS) {
  for (const prodSlug of n.products) {
    const prod = PRODUCTS.find(p => p.slug === prodSlug);
    if (!prod) throw new Error(`Unknown product slug "${prodSlug}" referenced by need "${n.title}"`);
    sql.push(`INSERT INTO public.need_product_links (need_id, product_id, owner_id, status)
SELECT (SELECT id FROM public.needs WHERE title = ${esc(n.title)}), (SELECT id FROM public.products WHERE name = ${esc(prod.name)}),
  (SELECT id FROM public.profiles WHERE username = ${esc(OWNER_USERNAME)}), 'approved'
ON CONFLICT (need_id, product_id) DO NOTHING;`);
  }
}

console.log(sql.join('\n\n'));
console.error(`\n[generate.js] ${NEW_CATEGORIES.length} new categories, ${Object.keys(CATEGORY_SEO).length} category SEO updates, ${TAGS.length} tags, ${PRODUCTS.length} products, ${NEEDS.length} needs, ${NEEDS.reduce((a, n) => a + n.products.length, 0)} need-product links`);
