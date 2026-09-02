# Content seed generator

Reproducible source for the curated launch-content batch (categories, tags,
products, needs, and their relationships) applied in
`supabase/migrations/20260902130000_seed_launch_content.sql`.

## Usage

1. Edit `data.js` — add/edit entries in `PRODUCTS` and `NEEDS`. Every product
   needs a unique `slug` (referenced by needs' `products: []` arrays); every
   need lists the product slugs it should link to via `products: []`.
2. Regenerate the SQL:
   ```
   node generate.js > ../../supabase/migrations/<timestamp>_<name>.sql
   ```
3. Review the diff, then apply the same way as any other migration
   (`supabase db push`).

## Design notes (read before adding more content)

- **All inserts are idempotent.** Products/needs use
  `WHERE NOT EXISTS (... WHERE name/title = ...)` since those columns have no
  unique constraint; categories/tags use `ON CONFLICT (slug)`; junction
  tables use their real unique constraints. Re-running the generated SQL
  against a database that already has the content is always a no-op for
  those rows.
- **Content policy — keep this consistent for future batches:**
  - State only stable, verifiable facts about a product (what it does, who
    it's for). Never invent pricing figures, ratings, user counts, awards,
    or testimonials. Use the `pricing` field's four categorical values
    (`Free` / `Freemium` / `Paid` / `Open Source`) rather than exact prices,
    which go stale and are easy to get wrong.
  - Don't store or hotlink third-party product logos — leave `logo_url`
    unset and rely on the existing initials-avatar fallback in the product
    card/detail components. Revisit per-product later via the admin image
    uploader if you've confirmed usage rights for a specific asset.
  - All curated content is owned by one clearly-labeled editorial profile
    (see `OWNER_USERNAME` in `generate.js`) — never attribute researched
    listings to a real company as if they signed up as a builder.
  - Needs are inserted with `status='fulfilled'` and zero engagement
    counters (votes, rewards, bookmarks) — they represent real search-intent
    problems with real linked solutions, not fabricated community activity.
    Only link a product to a need when it genuinely solves that specific
    problem — don't attach every product in a category to every need in it.
- **The owner profile must already exist.** The migration's `DO` block looks
  up a profile by `username = 'needsaas'` and raises a clear error if it's
  missing, rather than inserting bad data. Create that account through the
  app's normal signup flow (this script deliberately never writes to
  `auth.users` directly).

## Adding a logo

`logo_url` is a **private Supabase Storage path**, not an external URL —
`ProductImage` (`components/product-image.tsx`) always resolves it via
`supabase.storage.from('product-images').createSignedUrl(path, ...)`. Setting
it to a plain `https://...` URL will silently fail closed to the
initials-avatar fallback, not error.

`logo-mapping.json` records the product → Simple Icons slug pairs already
uploaded. To add one more:

1. `./add-logos.sh "<Product Name>" <simple-icons-slug>` — downloads the
   brand icon from Simple Icons (CC0-licensed) and uploads it via
   `supabase storage cp`, authenticated with the CLI's own linked project
   session (never a builder account password).
2. Apply the `UPDATE` it prints via a new migration + `supabase db push`.
3. If the brand isn't in Simple Icons, don't substitute another source —
   leave `logo_url` unset. Several well-known brands (Slack, Salesforce,
   Adobe, OpenAI/ChatGPT among them) have been pulled from Simple Icons over
   trademark requests at various points; that absence is itself a signal to
   stay conservative, not a gap to route around.
