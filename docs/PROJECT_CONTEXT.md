# NeedSaaS — Project Context

Persistent memory for Claude Code sessions on this repo. Read this first every session. Update it after every meaningful change, investigation, or verification pass. Do not mark anything "done" here unless this file records what changed, where, how it was verified, and whether it's local, deployed, or still pending.

## 1. Purpose and launch goal

NeedSaaS is a SaaS marketplace: people post software needs, the community upvotes needs and can fund build-reward pools, builders express interest and list completed products, and users discover products matched to their needs, with reviews/ratings and an eventual Pro Builder subscription. Categories, tags, starter packs, SEO pages, and editorial content round it out.

**Current goal: ship a credible, functional MVP.** Not adding features, not rewriting architecture. Verified launch blockers are Stripe live-flow verification, Google OAuth verification, Netlify readiness, and a full browser QA pass (see §11).

## 2. Tech stack and architecture

- Next.js 13.5.1 App Router, React 18.2, TypeScript (strict), Tailwind, shadcn/ui + Radix
- Supabase: Auth, Postgres, Storage, Edge Functions (Deno). Project ref: `wowugivczgicuqfvqgqy`
- Raw `@supabase/supabase-js` client + Postgres RPCs (SECURITY DEFINER functions for privileged writes). No ORM.
- Stripe, called through two Supabase Edge Functions (`stripe-checkout`, `stripe-webhook`)
- Netlify deployment via `@netlify/plugin-nextjs` (`netlify.toml`: `npx next build`, publish `.next`)
- npm, no middleware, no test framework, no CI

Do not introduce an ORM, rewrite the architecture, or replace working systems without a verified, compelling reason.

## 3. Routes and major features

Top-level `app/` routes: `/`, `/needs`, `/needs/[id]`, `/products`, `/products/[id]`, `/software`, `/software/[slug]`, `/builders`, `/builders/[id]`, `/starter-packs`, `/starter-packs/[slug]`, `/search`, `/pricing`, `/signin`, `/onboarding/builder`, `/dashboard`, `/dashboard/builder`, `/admin/*` (analytics, blog, builders, categories, needs, reviews, rewards, settings, software, starter-packs, users), `/api/test-db` (debug endpoint — see §10 known issues), `/robots.txt`, `/sitemap.xml`.

Build output (confirmed 2026-09-03, `npm run build`, exit 0): all 41 routes generate successfully. `/search` deopts into fully client-side rendering (Next.js warning, not an error) — acceptable for launch, not SEO-critical.

## 4. Database structure and RLS/security rules

Core tables (see `supabase/migrations/20260804114937_create_needsaas_schema.sql.sql` for the base schema): `profiles`, `needs`, `products`, `categories`, `reviews`, `stripe_customers`, `stripe_subscriptions`, `stripe_orders`, plus build-rewards, blog, starter-pack, and admin CMS tables added later.

Security rules confirmed by reading the applied migrations:

- **`products.paid` cannot be set by the client.** `INSERT` on `products` is revoked from `authenticated` and re-granted only for the safe column list (`name, tagline, description, url, repo_url, doc_url, pricing, price_from, logo_url, images, category_id`) — `paid`, `paid_at`, `featured`, and the count columns are excluded, so every new listing starts unpaid/unfeatured regardless of what the client sends. `UPDATE` on `paid`/`paid_at`/`featured` is similarly restricted. Legitimate paid/free state changes go only through three `SECURITY DEFINER` RPCs: `admin_approve_product(product_id)`, `admin_set_product_featured(product_id, featured)` (both admin-only, re-check `profiles.is_admin` server-side), and `claim_free_product_listing(product_id)` (re-derives free-listing eligibility server-side — Pro Builder or first paid listing — rather than trusting the client), or through the Stripe webhook using the service-role key.
- **Admin moderation RLS bypass policies** exist on `needs` (update/delete), `profiles` (update), `reviews` (update/delete), and `products` (delete), each gated on `EXISTS (... profiles.is_admin = true)`, additive to (OR'd with) the existing owner-only policies. Without these, admin panel actions on rows the admin doesn't own would silently affect 0 rows.
- **`handle_new_user()` trigger** on `auth.users` auto-creates a `profiles` row on signup (this is the *only* thing that gives a Google OAuth signup a profile row — email/password signup also inserts one manually client-side in `components/auth-provider.tsx`). This trigger previously existed only as a hand-run SQL Editor script (`fix_relations.sql` at repo root) and has since been promoted into tracked migrations. `EXECUTE` on the trigger function itself is revoked from public roles (see `20260804115933_revoke_trigger_function_execute.sql.sql`) so it can only run as the trigger, not be called directly.
- **`stripe_orders`, `stripe_customers`, `stripe_subscriptions`** are written only by the Edge Functions using the service-role key; not directly writable by `authenticated` clients (standard Bolt/Stripe-recommendations pattern).

Confirmed live via read-only anon-key query against `wowugivczgicuqfvqgqy` (2026-09-03): `products` = 53 rows, `needs` = 60 rows, `categories` = 14 rows, and a `profiles` row exists for `username = 'needsaas'` (`is_admin: false`, `verified: true`). These counts are close to but not identical to the "50 products / 57 needs" figures in earlier session notes — treat the live counts above as current truth.

**Not independently verified this session:** whether `pg_cron` is actually enabled and the `update-need-scores` job is actually scheduled and running (the migration exists and is idempotent, but `cron.job` isn't queryable via the anon-key REST API, and no `supabase` CLI is installed locally to check with elevated access).

## 5. Supabase migrations applied

`supabase/migrations/` contains 28 files, newest five from this launch-readiness push (2026-09-02):

1. `20260902120000_admin_moderation_rls.sql` — admin RLS bypass policies (needs/profiles/reviews/products)
2. `20260902120100_product_paid_status_functions.sql` — the three SECURITY DEFINER RPCs above
3. `20260902120200_restrict_product_insert_columns.sql` — column-level INSERT grant restricting what a listing INSERT can set
4. `20260902120300_schedule_need_score_updates.sql` — pg_cron job for `update_need_scores()` every 15 min
5. `20260902120400_reconcile_profile_trigger_and_fks.sql` — promotes the hand-run `handle_new_user()` trigger + FK repoints + category re-seed into tracked history
6. `20260902130000_seed_launch_content.sql`, `20260902131500_add_product_logos.sql`, `20260902133000_fix_product_logo_urls.sql` — launch content and logo seeding (large files, not re-read line by line this session; content presence confirmed by live row counts above)

All of the above are assumed applied to the live `wowugivczgicuqfvqgqy` project based on the working tree being clean and prior session notes, and this session's live queries showing the expected resulting state (needsaas profile, row counts, RLS behavior implied by app working). Not re-verified by running each migration's SQL against the DB this session.

**Known repo hygiene item:** `fix_relations.sql`, `seed_categories.sql`, `all_migrations.sql` still exist at the repo root — these are the original hand-run scripts that migration `20260902120400` was written to reconcile/supersede. They're now redundant with tracked migrations. Left in place; not deleted without explicit approval since they weren't created this session and their removal wasn't requested.

## 6. Edge Functions

- **`stripe-checkout`** (`supabase/functions/stripe-checkout/index.ts`) — creates a Stripe Checkout Session. Accepts either a stored `price_id` or inline `amount`+`product_name` pricing; requires `interval` (`month`/`year`) when mode is `subscription` with inline pricing (Stripe requires `recurring` on `price_data` in that case — this was a prior bug fix). Authenticates the caller via their Supabase JWT, creates/reuses a `stripe_customers` row, and passes through `product_metadata` (e.g. `product_id`) as session metadata so the webhook can act on it later.
- **`stripe-webhook`** (`supabase/functions/stripe-webhook/index.ts`) — verifies the Stripe signature, then for `checkout.session.completed` either syncs the subscription (`syncCustomerFromStripe`, which also sets `profiles.pro_builder`/`pro_builder_since`/`pro_builder_until` and auto-verifies Pro Builders) or, for a one-time payment, inserts a `stripe_orders` row and — if `metadata.product_id` is present — marks that product `paid = true` after verifying the product's `owner_id` matches the paying customer's user (defense in depth beyond the service-role bypass).
- **`ai-need-matching`** — exists under `supabase/functions/` but not inspected this session; purpose inferred from name only (matching needs to relevant products/builders). Flag as **not yet verified** in this pass.
- `supabase/config.toml` sets `[functions.stripe-webhook] verify_jwt = false`, required because Stripe calls the webhook with its own `stripe-signature` header, not a Supabase user JWT — confirmed correctly configured.

## 7. Stripe integration status

- **Code-level: looks correct.** Listing fee is `$10.00` (`LISTING_FEE_CENTS = 1000`, defined identically in `components/forms/pay-product-button.tsx` and `components/forms/product-form.tsx`). Pro Builder pricing in `app/pricing/page.tsx` is `$15/mo` or `$99/yr` (`amount = billingCycle === 'monthly' ? 1500 : 9900`), passed as inline `price_data` with the required `interval`.
- **Not verified this session (requires live/dashboard access, not attempted):**
  1. One-time $10 listing checkout completes and updates `products.paid`
  2. Pro Builder subscription checkout completes and updates `profiles.pro_builder`
  3. Stripe webhook is actually receiving deliveries (endpoint registered in Stripe dashboard, secret matches `STRIPE_WEBHOOK_SECRET`)
  4. Failed/cancelled checkout is handled gracefully client-side
  5. No path exists to mark a product paid without a real payment — **code-level this is now closed** (see §4), but not re-tested against a live attempt this session
- Stripe secret values live only in Supabase Edge Function secrets (not in this repo's `.env`, which only has the two public Supabase vars). Never ask the user to paste them.

## 8. Google OAuth status

- Client triggers `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/dashboard` } })` in `components/auth-provider.tsx`; UI entry point in `app/signin/page.tsx`.
- Profile creation on OAuth signup depends entirely on the `handle_new_user()` trigger (see §4/§5) — there is no client-side profile insert for the OAuth path (unlike email/password signup).
- **Not verified this session:** actual Google Cloud OAuth client configuration, the Supabase Auth provider toggle/redirect URL allowlist, or a live signup walkthrough. Some of this requires manual dashboard verification (Supabase Auth providers page, Google Cloud Console) that wasn't performed this session.

## 9. Netlify / deployment status

- `netlify.toml`: build command `npx next build`, publish `.next`, `@netlify/plugin-nextjs` plugin — looks correctly configured for Next.js 13 App Router on Netlify.
- Env vars referenced by the app (from a full `process.env.NEXT_PUBLIC_*` search): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (both required — used directly for the Supabase client and Edge Function calls, no fallback), `NEXT_PUBLIC_SITE_URL` (optional — falls back to `https://needsaas.com` in `robots.ts`, `sitemap.ts`, and `layout.tsx` metadata if unset, but should be set explicitly to the real production URL for correct canonical/OG URLs and sitemap).
- **Not verified this session:** actual Netlify site linkage, which branch is set as production, whether the three env vars above are actually set in the Netlify dashboard, or a live/preview deploy. No deployment was triggered.

## 10. Known bugs / limitations

- `/api/test-db` (`app/api/test-db/route.ts`) is a debug endpoint that queries categories/needs/profiles and returns them as JSON. It uses only the public anon key (no secret exposure), but it's still a diagnostic endpoint left reachable in production. Consider removing or gating before/soon after launch — not fixed this session, no instruction to do so.
- `/search` renders fully client-side (Next.js "deopted into client-side rendering" build warning) — functional but not SSR'd; acceptable for MVP.
- Three stray hand-run SQL files remain at repo root (`fix_relations.sql`, `seed_categories.sql`, `all_migrations.sql`) — superseded by tracked migrations, not yet deleted (see §5).
- 6 pre-existing ESLint warnings (`@next/next/no-img-element`) in `app/admin/blog/page.tsx`, `app/onboarding/builder/page.tsx`, `app/starter-packs/page.tsx`, `app/starter-packs/[slug]/page.tsx`, `components/image-uploader.tsx`, `components/product-image.tsx` — non-blocking, unchanged from prior session.
- `ai-need-matching` Edge Function not yet reviewed for correctness/deployment status.
- 38 of 50 products have real Simple-Icons logos; the rest intentionally use initials/fallback branding (icon unavailable or trademark-restricted) — by design, do not fake these.
- **Minor, not fixed:** the header/footer `Logo` component (`components/logo.tsx`) passes a fixed `height` to `next/image` with `width: 'auto'` in inline `style`, which still trips Next's "width or height modified, but not the other" console warning in dev. Cosmetic/dev-only, found while investigating the hydration bug below; not touched.
- **This sandboxed dev environment specifically** has slow/unreliable outbound access to Google Fonts (`fonts.googleapis.com`/`fonts.gstatic.com`, 5s+ per request) and occasionally to the Supabase REST API from the Next.js dev server process (not from plain `curl`, and not from the browser's own client-side requests) — causes next/font to fall back to system fonts and can intermittently 404 a route under dev-server load. Transient in this sandbox; not seen as a code bug and not expected on the user's own machine or in production, but worth knowing about if a future session sees an unexplained flaky 404/500 while driving the dev server here.

### Fixed this session (2026-09-03)

- **Nested `<a>` inside `<a>` hydration error in `ProductCard`** (`components/product-card.tsx`) — the card's outer `Link` (wrapping the whole thumbnail+content area) contained a second `Link` around the category `Badge`. An anchor can't legally contain another anchor; the browser's HTML parser silently un-nests them before React hydrates, producing exactly the "Warning: Expected server HTML to contain a matching `<div>` in `<a>`" / `validateDOMNesting` errors the user reported live from their own browser. Confirmed via a live console read on `/search` (`ProductCard` is used there via `app/search/page.tsx`) before touching any code. Fixed by converting the component to `'use client'`, replacing the inner `Link` with a `<span role="link" tabIndex={0}>` that calls `router.push()` on click/Enter with `stopPropagation()` so it still navigates to the category page without nesting inside the outer anchor. Re-verified live: reloading `/search` repeatedly after the fix produced zero nesting/hydration console messages (the only remaining console entry was the pre-fix one, timestamped before the edit). `need-card.tsx`, the app's other reusable card component, was checked and does not have this pattern. A handful of other files matched a broad "two Links in the same file" sweep but were manually confirmed to be sibling links, not nested — a more exhaustive sweep for the same anti-pattern elsewhere in the app was not done (out of scope for this fix; flag as a possible follow-up if similar reports come in from other pages).

## 11. Remaining launch checklist

In order:

1. **Stripe test-mode verification** — the 5 items in §7, requires either a live Stripe test-mode walkthrough (browser QA) or Stripe dashboard inspection.
2. **Google OAuth verification** — the items in §8, requires Supabase/Google Cloud dashboard checks plus a live signup walkthrough.
3. **Netlify readiness** — the items in §9, requires Netlify dashboard access; do not trigger a deploy without explicit approval.
4. **Full browser QA pass** covering: email signup, login, logout, Google login, username/profile creation, create/edit/delete a need, upvote, builder onboarding, free product listing, paid listing checkout, product discovery, need↔product relationships, reviews/ratings, Pro Builder gating, admin moderation (approve/feature), responsive layouts, broken links, console errors, empty/loading states, unauthorized access, mobile nav.

## 12. Decisions and why

- Chose SECURITY DEFINER RPCs over broader RLS policies for `products.paid`/`featured` because Postgres column-level privileges (already revoking client UPDATE on those columns) can't be overridden by a same-role RLS policy — an RPC running as an elevated function was the only way to let admin actions and legitimate free-claims through while keeping the column locked down from direct client writes.
- Kept the free-listing-eligibility check server-side (`claim_free_product_listing`) instead of trusting a client-computed "is this my first listing" flag, closing the $10 fee bypass at the root rather than patching the UI.
- Left `products` UPDATE RLS otherwise alone for admins — `paid`/`paid_at`/`featured` intentionally route through RPCs, not a same-role admin bypass policy, per the column-privilege constraint above.
- Did not delete the stray root SQL files or the `/api/test-db` route this session — out of scope for a read-only verification pass, and deletion wasn't requested.

## 13. Files changed this session (2026-09-03)

- `docs/PROJECT_CONTEXT.md` — created (this file).
- `components/product-card.tsx` — fixed a nested-`<a>`-inside-`<a>` hydration bug (see §10 "Fixed this session"). This is the one code change made this session; everything else was read-only inspection/verification. **Not committed** — left as an uncommitted working-tree change pending your review/approval, consistent with "don't push/commit without being asked."

## 14. Verification results (this session, 2026-09-03)

| Check | Result |
|---|---|
| `git status` | Clean working tree, `main` branch, 1 commit ahead of `origin/main` (`70c90dd`, unpushed) |
| `npm run typecheck` | PASS, no errors |
| `npm run lint` | PASS, only the 6 pre-existing `img`-element warnings |
| `npm run build` | PASS, exit 0, all 41 routes generated (`/search` client-rendered by design/warning only) |
| Live DB read (anon key) | `needsaas` profile exists (`verified: true`, `is_admin: false`); `products` = 53, `needs` = 60, `categories` = 14 |
| Stripe Edge Function code review | Checkout + webhook logic reads correctly; not exercised live |
| Google OAuth code review | Client + trigger logic reads correctly; not exercised live |
| Netlify config review | `netlify.toml` present and correctly structured; dashboard state not checked |
| Live browser QA (dev server) | Found + fixed a nested-`<a>` hydration bug in `ProductCard` (see §10); re-verified fix live on `/search` with a clean console after the fix, `npm run typecheck`/`npm run lint` still pass with no new issues |

**Confirmed:** repo state matches the prior session's summary closely enough to trust it (git checkpoint, typecheck/lint/build, RLS/Stripe/OAuth code, editorial profile, seed content presence).
**Assumed (not independently verified):** pg_cron job actually running; all 28 migrations applied byte-for-byte as committed (only inferred from live query results matching expectations); `ai-need-matching` function behavior.
**Not yet verified:** everything in §11 (Stripe live flow, Google OAuth dashboard config, Netlify dashboard config, full browser QA).
**Blocked on:** nothing technical — next steps need either live browser QA (available via claude-in-chrome) or dashboard access (Stripe/Supabase/Google Cloud/Netlify) that the user may need to grant/perform manually.

## 15. Git checkpoint

- Latest commit: `70c90dd` — "Launch readiness: security fixes, SSR/SEO pass, curated marketplace content"
- Branch: `main`, working tree clean, 1 commit ahead of `origin/main`
- **Not pushed.** Do not push without explicit approval. Treat `70c90dd` as the rollback reference.

## 16. Changelog

- **2026-09-03** — New session. Created this context document. Performed read-only verification: confirmed clean git state at `70c90dd`; re-ran and confirmed typecheck/lint/build all pass with the same results as the prior session's report; read and confirmed the security-fix migrations (admin RLS, product paid-status RPCs, insert column restriction, profile trigger reconciliation, pg_cron scheduling) do what the commit message claims; read the Stripe Edge Functions and confirmed checkout/webhook logic; confirmed via live anon-key query that the `needsaas` editorial profile exists and seed content (53 products / 60 needs / 14 categories) is present. No code changes made in this initial pass. No deploys triggered. No commits made.
- **2026-09-03 (same day, continued)** — User reported a live hydration error from their own browser session (three "Expected server HTML to contain a matching `<div>` in `<a>`" React errors, pasted mid-turn). Started a local dev server, reproduced the underlying `validateDOMNesting` warning live via the browser console on `/search`, traced it to `components/product-card.tsx` (a `Link` nested inside the card's outer `Link` around the category badge), fixed it (see §10), and re-verified live that the warning no longer occurs. `npm run typecheck` and `npm run lint` re-run clean after the fix. Change is **uncommitted** in the working tree pending review. No deploys triggered, no commits made.

## 17. Phase 2 (deferred — starts only after Stripe/OAuth/Netlify readiness are settled): SEO Content, Starter Packs & Software Profiles

**Status: not started.** The user specified this as a full product direction on 2026-09-03, explicitly scheduled to begin only once Stripe test-mode verification, Google OAuth verification, and Netlify readiness (§11 items 1–3) are all settled. Recorded here in full so it survives to whichever session picks it up. Treat this as a product requirement, not an idea to revisit casually.

**Required process (do not skip or reorder):**
1. Audit the existing blog, Starter Packs, product-profile, and SEO architecture — schema, routes, content model, UI. Do not assume the current architecture is sufficient.
2. Update this document with audit findings and a proposed implementation plan.
3. Propose the minimum schema changes required — get them approved before migrating.
4. Implement the blog/content model and routes.
5. Implement a scalable Starter Pack model and build the highest-value industry packs first.
6. Improve software/product pages into shareable public profiles.
7. Add SEO metadata, structured data, internal linking, and social sharing.
8. Add admin/editorial workflows where needed.
9. Verify all generated pages for quality, uniqueness, and broken links.
10. Run typecheck, lint, build, and browser QA.
11. Update this document after every meaningful step (changes made, files changed, DB changes, content added, verification results, deployment status, remaining work, next action).

**Before writing any code**, report to the user: what already exists, what's missing, what can be reused, what needs schema changes, what to implement first, which Starter Packs to create initially, which pages will be indexable, how duplicate/thin content will be prevented, how software profiles will support future awards/analytics, and any risks or out-of-scope items. Then implement only the approved/safest phase — not all of this in one uncontrolled pass.

**Known existing pieces to reconcile against during the audit** (seen in passing this session, not yet verified for completeness/quality): `app/admin/blog` route exists; migrations `20260806120023_..._starter_packs.sql.sql`, `20260806120840_..._category_seo.sql.sql`, and `20260806121739_..._admin_cms.sql.sql` suggest starter-pack, category-SEO, and blog/CMS tables already exist at some level — their actual schema, content quality, and completeness against the requirements below have not been assessed.

### 17.1 SEO / AI-search-friendly blog
Target real software-search intent: recommendations, "best software for X," "software for [industry]," comparisons, alternatives, how-to guides, workflow/ops guides, buying guides, industry tech guides, small-business stacks, free/affordable guides. Content must be human-readable, genuinely useful, SEO-optimized without stuffing, structured for search engines and AI answer systems, based on real/verifiable software facts, organized by search intent, internally linked to products/needs/categories/starter packs, and must avoid thin/repetitive/auto-generated pages. Where appropriate: H1/H2 structure, short answer/intro sections, FAQs, article metadata, author/editorial info, updated dates, canonical URLs, OG metadata, relevant JSON-LD, breadcrumbs, internal links, related articles, links to relevant software profiles/starter packs. No fake authors, reviews, statistics, or customer stories.

### 17.2 Industry-specific Starter Packs
Goal: someone searching "software for plumbers" finds a NeedSaaS Starter Pack that ranks organically and gives a genuinely useful stack. Start with as many industries as existing content quality and product-directory depth actually support — prioritize real search demand and distinct software needs over page count. The user supplied a long candidate list (trades/contractors, medical/dental/vet, personal care/fitness, food service, real estate/finance/legal, agencies/freelancers/creative, events, e-commerce/retail/logistics, HR/education/nonprofit, travel/home-care — see full list in the original request if needed, not reproduced here to keep this doc concise). Do not auto-create every industry — first confirm each candidate has distinct software workflows, enough relevant products already in the directory, genuine search intent, and a non-duplicative content angle.

Each Starter Pack should be a real editorial landing page (not just product cards): SEO title, meta description, H1, intro explaining the industry's software needs, recommended stack by category, product recommendations with reasons, free/low-cost alternatives where appropriate, suggested workflow, implementation considerations, common mistakes, FAQs, related needs/products/blog articles, internal links, breadcrumbs, structured data. Use real products already in the DB; a missing relevant product is a content/data gap to flag, not something to invent. Explicitly distinguish industry-specific software vs. general-purpose software useful to that industry vs. software that merely integrates with the industry's workflow — never claim industry-specificity that isn't factually true.

### 17.3 Software pages as shareable public profiles
A listed product's page should become a stable, shareable public profile (HomeStars-like): stable URL, branding, description, website link, categories/tags, screenshots/media (only where legally/technically appropriate), features, verified pricing, reviews, ratings, builder/company info, related needs/products, activity/engagement, shareable metadata, social preview image, SEO title/description, structured data. Builders should be able to share the profile directly.

Design the data model/UI so future features can be added without a rewrite: Product of the Day/Week/Month, Most Used by Industry, Best Rated, Most Helpful Reviews, Rising Product, Most Popular in Category, industry awards, builder badges, verified badges — but do not implement any of these with fake data now. Build the structure so they can later be computed from real, explainable criteria.

### 17.4 Profile architecture requirements
Before touching the product page, inspect: the products table, product ownership, builder profiles, reviews/ratings, product-to-need relationships, categories/tags, product URLs, existing SEO metadata, existing sharing functionality, admin moderation, RLS policies, and any existing analytics/counters. Determine whether the current page can be safely extended or needs a schema change. **Do not perform a UUID-to-slug URL rewrite unless separately approved** — if shareable URLs are currently UUID-based (they are — `/products/[id]` uses the product's UUID, confirmed in §3/§4 of this doc), document that as a known limitation and propose a safe future migration rather than silently changing routes.

### 17.5 Content quality rules (hard constraints)
Never: generate hundreds of thin keyword-targeting pages; duplicate one article across industries with only the industry name swapped; invent features, prices, ratings, reviews, customer counts, or awards; claim official affiliation with listed software companies; copy competitor site text; keyword-stuff; fake engagement or usage stats; make unsupported "best" claims without stating criteria; use screenshots/logos that create copyright/trademark risk. Every page must answer a real question and give a visitor something actionable.

---

## Next Session Handoff

**State:** Repo is at commit `70c90dd` (unpushed, 1 ahead of origin/main) **plus one uncommitted working-tree change**: `components/product-card.tsx` (nested-anchor hydration fix, see §10/§13). Build/lint/typecheck all pass with that change in place. Security migrations and Stripe/OAuth code have been read and look correct, but none of Stripe, Google OAuth, or Netlify has been exercised live yet.

**Exact next recommended action:** First, confirm with the user whether to commit the `product-card.tsx` fix (it's currently just sitting in the working tree). Then begin Stripe test-mode verification (§7/§11 item 1) via a live browser QA walkthrough using claude-in-chrome — attempt a $10 listing checkout and a Pro Builder subscription checkout in Stripe test mode, then confirm `products.paid` / `profiles.pro_builder` update correctly and that the webhook delivered (check Stripe dashboard's webhook logs if accessible, or infer from DB state). Note: this session's local dev server had intermittent slow/failed outbound requests to Google Fonts and occasionally Supabase (sandbox-specific, see §10) — if a future session sees a flaky 404 while driving the dev server, retry before assuming it's a code bug. Then proceed to Google OAuth verification, then Netlify readiness, then the full browser QA checklist in §11. **Only once Stripe/OAuth/Netlify readiness are all settled**, begin §17 (SEO content / Starter Packs / software profiles) starting with the audit step — do not start §17 work early.

**Reminders for whoever picks this up:**
- Do not push `70c90dd` or any new commit to `origin/main` without explicit approval.
- Do not commit the pending `product-card.tsx` change without asking first either — general rule is commit only when asked.
- Do not trigger a Netlify deploy without explicit approval.
- Never ask the user to paste Stripe secret keys, service-role keys, or other credentials into chat/files.
- This document (`docs/PROJECT_CONTEXT.md`) is the source of truth when conversation history is unavailable — but reconcile it against actual repo/DB state, since it can drift.
