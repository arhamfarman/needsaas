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

## 7. Stripe integration status — ✅ both the one-time $10 listing-fee flow AND the Pro Builder subscription flow are fully verified end-to-end

**Confirmed 2026-09-03 via live browser + direct probing — this is the current top launch blocker.** Both `stripe-checkout` and `stripe-webhook` crash on *every* invocation, including `OPTIONS` preflight and unsigned/unauthenticated requests, before any of our own handler code runs:

```
curl -X OPTIONS .../functions/v1/stripe-checkout  → 500 {"code":"WORKER_ERROR","message":"Function exited due to an error (please check logs)"}
curl -X OPTIONS .../functions/v1/stripe-webhook    → 500 WORKER_ERROR (same)
curl -X POST    .../functions/v1/stripe-webhook    → 500 WORKER_ERROR (same, even with verify_jwt=false so it reaches our code)
```

Reproduced live in-browser too: clicking "Pay $10 to publish" on a real test listing (see below) fired `OPTIONS .../functions/v1/stripe-checkout` → `500`, and the UI just silently stayed on the form (no error shown to the user — a secondary, smaller bug: the client should surface a toast/error here instead of failing silently).

**Root cause (not confirmed via logs, since I have no Supabase dashboard access, but strongly indicated):** both functions construct the Stripe client at module top-level —
```ts
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, { ... });
```
`Deno.env.get()` returns `undefined` at runtime if the secret isn't set (the `!` is TypeScript-only, it doesn't throw) — and the Stripe SDK constructor throws synchronously when given `undefined` as the API key. Because this runs at module load time, it crashes *before* `Deno.serve`'s handler can even distinguish request types, which exactly matches every request type failing identically, `OPTIONS` included. This means **`STRIPE_SECRET_KEY` (and likely `STRIPE_WEBHOOK_SECRET`) are missing or invalid in this Supabase project's (`wowugivczgicuqfvqgqy`) deployed Edge Function secrets** — this is infrastructure/deployment configuration, not an app code bug, and I cannot fix it myself (no dashboard/CLI access, and I must never ask you to paste secret values to me).

**What you need to do:** In the Supabase Dashboard for `wowugivczgicuqfvqgqy` → Edge Functions → Secrets (or `supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... --project-ref wowugivczgicuqfvqgqy` via CLI), confirm both secrets are set with valid Stripe **test-mode** values, then redeploy/restart the two functions if needed. Checking the functions' logs in the dashboard would also show the exact crash stack trace to confirm the diagnosis above. Once fixed, re-run the live checkout walkthrough below.

**Side effect of this session's testing:** created one real, harmless test product row while reproducing this — `products.id = 6000b022-e357-4348-a34d-3161222c63b6`, name "QA Test Product", `paid = false` initially (see below — checkout was later retried against this same row). User asked to keep this row rather than delete it, since it's useful as reusable test state for retrying the payment flow.

**2026-09-03, later same day — user fixed it.** User configured the Stripe test-mode secrets in Supabase (values never seen/requested by me). Re-probed both functions directly:
```
OPTIONS stripe-checkout  → 204 (was 500)
OPTIONS stripe-webhook   → 204 (was 500)
GET     stripe-checkout  → 401 "missing authorization header" (platform auth gate — expected, means the function initialized and is now enforcing auth normally, not crashing)
POST    stripe-webhook   → 400 "No signature found" (our own app-level check now running — confirms the function initializes correctly)
```
**Both functions are healthy again.** Retried the actual UI flow: clicked "Pay $10 to publish" on the existing `QA Test Product` row (id `6000b022-e357-4348-a34d-3161222c63b6`) as the same signed-in builder account — the browser tab navigated to a real Stripe **Sandbox**-mode Checkout Session (`cs_test_...`), correctly showing "Product listing: QA Test Product" / **US$10.00**, with the account's email pre-filled (confirms `stripe_customers` mapping worked). This confirms `stripe-checkout` now creates sessions correctly end-to-end (auth → customer lookup/creation → line item → session).

**Handed off the actual card entry to the user** — I don't fill in card numbers myself, including Stripe's well-known test card, since that falls under "entering financial credentials into a field" in my standing rules regardless of test-mode. User completed the test payment (`4242 4242 4242 4242`).

### 🔴 New finding: checkout succeeds, but the webhook never updates the database

After the user paid, the browser correctly redirected to the success URL (`/products/6000b022-...`), confirming Stripe processed the payment. But:
- `products.paid` for the test row stayed `false` (checked immediately and again after a 6s delay — checked both via the public anon key and, to rule out an RLS false-negative, via the signed-in user's own session token read from the browser's `localStorage` and used for a direct authenticated `fetch` — never printed or exposed, only used in-page to make the read).
- `stripe_customers` **does** have a row for this user (`customer_id: cus_VBzUi0HuevHvrx`, created at checkout-session time) — confirms the `stripe-checkout` function's customer creation/lookup step worked correctly.
- `stripe_orders` is **completely empty** for this user (checked with the same authenticated-session technique, so this isn't an RLS artifact) — this is the key signal. The webhook's order-insert code only runs after Stripe signature verification succeeds and the handler reaches the one-time-payment branch. An empty table means **the webhook handler never ran to completion for this payment at all** — not a partial/silent failure inside our own logic.

**Code-level, the client and edge-function pieces most likely to blame were re-checked and look correct**: `PayProductButton` (`components/forms/pay-product-button.tsx`) sends `product_metadata: { product_id: product.id }` correctly, and `stripe-checkout` correctly forwards that as Stripe session `metadata`; `stripe-webhook`'s handler reads `metadata.product_id` from the completed session in exactly the shape the checkout function sends it. Nothing in the app code explains an empty `stripe_orders` table given a completed payment.

**Most likely cause (needs Stripe Dashboard access I don't have, to confirm):** the Stripe webhook **endpoint isn't registered** in the Stripe Dashboard (Developers → Webhooks, **test mode**) pointing at `https://wowugivczgicuqfvqgqy.supabase.co/functions/v1/stripe-webhook`, so Stripe never attempts delivery — or an endpoint exists but `STRIPE_WEBHOOK_SECRET` doesn't match *that specific endpoint's* signing secret (each Stripe webhook endpoint has its own unique signing secret, distinct from the account's general API keys — it must be copied from that endpoint's own settings page, not from anywhere else), causing signature verification to fail before the handler logic runs.

**What to check (Stripe Dashboard, test mode, Developers → Webhooks):**
1. Does an endpoint exist at all, pointing to the `stripe-webhook` function URL above?
2. Is it subscribed to at least `checkout.session.completed` (and, for Pro Builder later, the `customer.subscription.*` events)?
3. Open "Recent deliveries" for this test payment — no attempt listed at all confirms cause (a); an attempt with a non-2xx response (likely 400) confirms cause (b) and means the endpoint's own signing secret needs to be re-copied into `STRIPE_WEBHOOK_SECRET`.

I have no way to see Stripe's webhook delivery log or the Supabase function's own logs myself, so this diagnosis is as far as I can take it without that dashboard access.

**2026-09-03, later still — user corrected the webhook endpoint URL** in the Stripe Dashboard (test mode) to point at the NeedSaaS Supabase project. Re-probed both functions: still healthy (`OPTIONS` → 204 on both). Re-checked DB state as a baseline before retrying (via the signed-in user's own session token, not the anon key): `stripe_orders` still empty, `products.paid` for `QA Test Product` still `false` — expected, since no new payment had been attempted since the fix. Confirmed in the UI that the `QA Test Product` listing (kept, not recreated) was still present with its "Pay $10 to publish" button available. User chose to **resend the existing `checkout.session.completed` event** from the Stripe Dashboard against the corrected endpoint (rather than a fresh payment) and confirmed it succeeded.

### ✅ RESOLVED — full webhook flow verified end-to-end (2026-09-03)

Re-checked DB state the same way (authenticated fetch using the signed-in user's session token, never printed/exported):
```json
stripe_orders: [{
  "checkout_session_id": "cs_test_a1SOLqQDc8cZAi7KpwUMLYBRWQ90G5gw3jMzcCs14sSMJmeihv7mtok9sq",
  "payment_intent_id": "pi_3UBbpPAPoOoLtNox3ErKnYW2",
  "customer_id": "cus_VBzUi0HuevHvrx",
  "amount_subtotal": 1000, "amount_total": 1000, "currency": "usd",
  "payment_status": "paid", "status": "completed",
  "created_at": "2026-09-03T14:41:26.735915+00:00"
}]
products (QA Test Product): { "paid": true, "paid_at": "2026-09-03T14:41:27.246+00:00" }
```
`paid_at` is exactly ~0.5s after the order's `created_at` — matches the webhook handler's actual code order (insert `stripe_orders` row first, then verify ownership and flip `products.paid`). Also confirmed visually: reloaded `/products/6000b022-...` and the "This listing is not yet published" banner is gone.

**Stripe test-mode verification for the one-time $10 listing-fee flow is now fully confirmed working end-to-end**: checkout session creation → Stripe customer creation/lookup → payment → webhook delivery → signature verification → order recorded → ownership-checked product-paid update. The only remaining Stripe item is the **Pro Builder subscription checkout** (`/pricing`), which hasn't been attempted live yet but shares the same now-fixed webhook path, so it's expected to work — still needs an actual live attempt to confirm `profiles.pro_builder` updates correctly (subscription sync is a different code branch in `stripe-webhook`, `syncCustomerFromStripe`, not yet exercised).

No application code was changed to fix any of this — it was entirely Supabase Edge Function secrets + Stripe Dashboard webhook endpoint configuration, both fixed by the user. No deploys, no pushes, no new test listings created (the same `QA Test Product` row was reused throughout).

### Pro Builder subscription checkout — in progress (2026-09-03)

Baseline before starting (authenticated fetch, same technique as before): `profiles.pro_builder = false`, `pro_builder_since/until = null`, `verified = false`; `stripe_subscriptions` empty for this user (expected — the earlier $10 test only exercised `mode: 'payment'`, never `mode: 'subscription'`).

Started checkout from `/pricing` (Monthly toggle, the page's default), clicked "Upgrade to Pro" → correctly redirected to a new Stripe **Sandbox** Checkout Session: "Subscribe to Pro Builder — Monthly", **US$15.00/month**, email pre-filled. Confirms `stripe-checkout` builds the subscription-mode inline price correctly (interval, amount, recurring config). Handed card entry to the user, same as the $10 flow. User completed payment.

### ✅ RESOLVED — Pro Builder subscription verified end-to-end

Checked via the same authenticated-fetch technique:
```json
stripe_subscriptions: [{
  "subscription_id": "sub_1UBcBlAPoOoLtNoxc91ToEFa", "price_id": "price_1UBc8VAPoOoLtNoxVP5SgGr9",
  "current_period_start": 1788447869, "current_period_end": 1791039869,  // exactly 30 days apart
  "cancel_at_period_end": false, "status": "active"
}]
profiles: { "pro_builder": true, "pro_builder_since": "2026-09-03T15:04:34.66Z", "pro_builder_until": "2026-10-03T15:04:29Z", "verified": true }
stripe_customers: [same cus_VBzUi0HuevHvrx as the earlier $10 test — correctly reused, no duplicate customer created]
```
UI confirmed visually too: `/dashboard` now shows **Pro** and **Verified** badges next to the user's name.

**Minor observation (not a functional bug, not fixed):** `profiles.pro_builder_since` is recomputed as `new Date().toISOString()` on *every* successful webhook sync, not just the first one. Since Stripe fires more than one event around a subscription's creation (e.g. `checkout.session.completed` and `customer.subscription.created` both reach `syncCustomerFromStripe`), the timestamp drifts to whichever sync ran last (observed ~3.5 minutes after the `stripe_subscriptions` row's own `created_at`) rather than staying pinned to the true original subscription start. It would also re-drift forward on every monthly renewal event. Doesn't affect access control or `pro_builder_until` (which correctly reflects Stripe's real `current_period_end` each time) — purely a cosmetic "member since" accuracy issue, worth a small fix later if the UI ever surfaces that date to users.

**Cancellation / failed-payment handling — verified by code review of `syncCustomerFromStripe`, not yet by a live event:**
- A declined/abandoned initial checkout never fires `checkout.session.completed`, so no webhook code runs and no false grant is possible — safe by construction.
- Any later event (renewal failure, cancellation) re-triggers a full resync that reads the subscription's *actual current status from Stripe's API* (not the event payload), and `isActive` is only `true` for `status === 'active' || 'trialing'` — a failed renewal (`past_due`) or cancellation (`canceled`) both correctly resolve to `pro_builder: false`. Canceling "at period end" correctly keeps access active until the period ends (intended grace period, not a bug).
- Offered the user a live cancellation test (cancel the test subscription in the Stripe Dashboard) for empirical confirmation — not yet done as of this write-up.

## 7.1 Stripe integration status (pre-existing notes)

- **Code-level: looks correct.** Listing fee is `$10.00` (`LISTING_FEE_CENTS = 1000`, defined identically in `components/forms/pay-product-button.tsx` and `components/forms/product-form.tsx`). Pro Builder pricing in `app/pricing/page.tsx` is `$15/mo` or `$99/yr` (`amount = billingCycle === 'monthly' ? 1500 : 9900`), passed as inline `price_data` with the required `interval`.
- **Verified this session (final state, after the webhook endpoint URL was corrected in the Stripe Dashboard):**
  1. One-time $10 listing checkout — ✅ **fully verified end-to-end**: session creation, Stripe customer creation/lookup, payment, webhook delivery, signature verification, `stripe_orders` insert, ownership-checked `products.paid` update — all confirmed with real data (see the resolution write-up above)
  2. Pro Builder subscription checkout — ✅ **fully verified end-to-end**: session creation (correct $15/month subscription-mode price), payment, webhook sync, `stripe_subscriptions` row, `profiles.pro_builder`/`pro_builder_until`/`verified` all updated correctly, confirmed in the UI too (see §7 resolution write-up)
  3. Stripe webhook delivery — ✅ **fixed and confirmed working** for both one-time and subscription events. Root cause was the webhook endpoint URL registered in the Stripe Dashboard (test mode), not app code or Edge Function secrets — user corrected it and both a resent `checkout.session.completed` event and a live subscription payment processed successfully
  4. Failed/cancelled checkout handled gracefully — verified **by code review** (not yet a live event): a declined initial checkout never fires a webhook event at all, so no false grant is possible; a failed renewal or cancellation re-syncs the subscription's real status from Stripe and correctly resolves `pro_builder: false`. A live cancellation test was offered to the user for empirical confirmation, not yet performed. Separately, the client fails **silently** when checkout-session creation errors (no toast/error shown) — worth a small UX fix, unrelated to correctness
  5. No path exists to mark a product paid without a real payment — **code-level this is closed** (see §4); now also empirically demonstrated correctly gated the whole time the webhook was broken (stayed `false` until a real payment's webhook event actually processed)
- Stripe secret values live only in Supabase Edge Function secrets (not in this repo's `.env`, which only has the two public Supabase vars). Never ask the user to paste them.

## 8. Google OAuth status — ✅ verified working (with one honest caveat)

- Client triggers `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/dashboard` } })` in `components/auth-provider.tsx`; UI entry point in `app/signin/page.tsx`.
- Profile creation on OAuth signup depends entirely on the `handle_new_user()` trigger (see §4/§5) — there is no client-side profile insert for the OAuth path (unlike email/password signup).
- **Verified 2026-09-03**, discovered opportunistically: the account signed in for this session's Stripe testing (`Arham`) turned out to already be authenticated via a real Google identity, not email/password. Inspected the session's own JWT (`app_metadata.provider: "google"`, `identities: ["google"]`) and the resulting `profiles` row via an authenticated fetch:
  - Exactly **one** profile row exists for this user id — no duplicates.
  - `full_name` ("Arham Farman") matches Google's identity metadata exactly.
  - `avatar_url` is populated (from Google's profile picture).
  - `username` was auto-generated via the documented fallback pattern (`email_local_part + random suffix`) since Google doesn't supply a username claim — exactly matching `handle_new_user()`'s `COALESCE(...)` logic.
  - The post-auth redirect to `/dashboard` works (confirmed across many navigations this session).
  - The mere existence of a valid, well-formed Google-provider session is itself strong indirect evidence that the Supabase Auth Google provider is enabled and correctly configured, and that the Google Cloud OAuth client's authorized redirect URIs include Supabase's callback URL — Google would have rejected the request with a `redirect_uri_mismatch` otherwise, and Supabase wouldn't issue a `google`-provider session without its own provider config being valid.
  - **Honest caveat:** this profile's `created_at` is 2026-08-29, while the migration that formally tracked `handle_new_user()` in version control was applied 2026-09-02. That migration's own comment says it *promotes a previously hand-run script* rather than creating the trigger fresh, so this is still real evidence the trigger logic works — just not proof that this exact signup went through the precise committed migration file. A first-time signup with a Google account that has never touched this Supabase project would be a cleaner, fully airtight test, but wasn't done (would need a spare Google test account, and deliberately clearing this account's existing profile/auth row to simulate "fresh" would be a destructive operation not undertaken without explicit approval).
- Not independently checked (no dashboard access): the exact Supabase Auth provider settings page or Google Cloud Console client config directly — inferred correct from the working session above rather than inspected directly.

## 9. Netlify / deployment status — 🔴 no Netlify site exists yet; this is a fresh setup, not an existing deployment to audit

**Correction (2026-09-03):** earlier notes in this document referred to "Netlify readiness" as if a site might already exist. The user has clarified explicitly: **no Netlify setup has been done at all.** `netlify.toml` and the `@netlify/plugin-nextjs` dependency being present in the repo is only code-level scaffolding — it says nothing about whether a Netlify site, GitHub connection, env vars, or any deployment actually exists. Treat this entire section as a **setup plan**, not a verification of something already running.

### What's already configured in code (repo-side, done)
- `netlify.toml` at repo root: build command `npx next build`, publish directory `.next`, with the `@netlify/plugin-nextjs` plugin enabled — this is the correct, standard configuration for deploying a Next.js 13 App Router site on Netlify (the plugin handles SSR/ISR/route-handler adaptation that a plain static export can't).
- `@netlify/plugin-nextjs` (`^5.15.1`) is a listed dependency in `package.json`, so it installs automatically as part of `npm install` during any Netlify build — nothing extra to add there.
- No `_redirects`, `_headers`, or `netlify/` functions directory in the repo — none are needed for how this app is built (it uses Next.js's own App Router API routes, not standalone Netlify Functions).
- No `.nvmrc` or `package.json` `engines` field pinning a Node version — Netlify will use its own default Node version for the build. Worth setting explicitly later if a specific version becomes load-bearing, but not blocking to start.
- No server-only (non-`NEXT_PUBLIC_`) environment variables are referenced anywhere in the app code (confirmed via a full `process.env.` search) — only the three public vars below are needed for the Next.js app itself. (Stripe/Supabase secrets live in Supabase Edge Function secrets, not in the Next.js app's environment — this is unrelated to Netlify.)

### What must be created in the Netlify dashboard (nothing here exists yet)
1. **A Netlify site** — none exists. Would need to be created via "Import an existing project" / "Add new site" in the Netlify dashboard.
2. **A GitHub connection** — Netlify needs its GitHub App authorized for the target repository (see below) before it can build from it.
3. **Environment variables** — set manually in Site settings → Environment variables (see the list below; I cannot set these for you, and you shouldn't paste the actual values to me).
4. **Build & deploy settings confirmation** — Netlify should auto-detect the settings from `netlify.toml`, but the production branch and any deploy-context overrides still need to be explicitly chosen during setup.
5. **A custom domain / DNS**, if `needsaas.com` (or another domain) is meant to point at this site — entirely unconfigured currently; explicitly out of scope until asked.

### GitHub repository and branch to connect
- Remote: `https://github.com/arhamfarman/needsaas.git` (confirmed via `git remote -v` — this repo does exist on GitHub and already has some history pushed to it).
- Branch: **`main`**.
- ⚠️ **Important gap to know about before connecting anything:** `origin/main` on GitHub is currently **3 commits behind** this local checkout — it's sitting at `8f33662` ("Switch to claude"), while local `main` has gone on to `70c90dd`, `6a2f2f0`, and `c0080a1` (the launch-readiness security fixes, this context doc, and the hydration bug fix). **None of those three commits have been pushed.** If a Netlify site is connected to `origin/main` today and builds immediately, it would deploy the *old* code — missing the security fixes and the hydration fix verified earlier this session. Pushing those commits is a separate explicit-approval step (not done, not requested yet) that should happen before or as part of going live, not something I'll do on my own.

### Required environment variables (names only — I will not ask you for or accept the actual values here)
| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Required** | Supabase project URL — used by the browser/server Supabase client and when calling Edge Functions (Stripe checkout/webhook). No fallback in code; the app breaks without it. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required** | Supabase anonymous/public API key — same usage as above. This is the *public* anon key (safe to expose client-side by Supabase's own design), not a secret credential, but still must be set correctly per-environment. |
| `NEXT_PUBLIC_SITE_URL` | **Recommended, not strictly required** | Used for canonical URLs, Open Graph/Twitter image URLs, `robots.txt`, and `sitemap.xml`. Falls back to `https://needsaas.com` if unset — fine only if that's actually the intended production domain; set explicitly to whatever the real Netlify/custom domain ends up being, otherwise SEO metadata will point at the wrong URL. |

All three are `NEXT_PUBLIC_*`, meaning they get inlined into the client bundle at build time — Netlify needs them set *before* the build runs (as normal site environment variables), not as some runtime-only secret.

### Build command and deployment settings
- **Build command:** `npx next build` (from `netlify.toml`, Netlify should auto-detect this and not need manual entry).
- **Publish directory:** `.next` (same — auto-detected from `netlify.toml`, required so the Next.js plugin can locate build output).
- **Plugin:** `@netlify/plugin-nextjs` — auto-installed and auto-run per `netlify.toml`'s `[[plugins]]` block; this is what makes SSR/ISR/App Router routing work on Netlify's infrastructure instead of only static export.
- **Production branch:** should be `main` to match the single branch this repo actually uses — but this is a choice made *during* Netlify site setup, not something inferable from the repo alone; needs explicit confirmation from the user when the site is created.
- **Node version:** not pinned in the repo (see above) — Netlify's current default should work for Next.js 13.5.1, but worth double-checking once a site exists (Site settings → Build & deploy → Environment) rather than assuming.

### Values the user must manually configure (I cannot do any of this)
- Actually creating the Netlify site and authorizing/connecting the `arhamfarman/needsaas` GitHub repository.
- Choosing `main` as the production branch during setup.
- Entering the three environment variable values above (I know their *names*, not their values, and shouldn't be given the values either).
- Deciding whether/when to push the 3 unpushed local commits before or after the first deploy.
- Any custom domain/DNS configuration, if wanted.
- Confirming the Node version Netlify picks is acceptable, or pinning one explicitly if not.

**Explicitly not done, per instruction:** no Netlify site created, no GitHub connection made, no deploy triggered, no DNS touched, and no secret values requested. Waiting for approval before any dashboard-side action — and even with approval, I have no direct access to the Netlify dashboard myself, so the actual clicking-through would still be the user's to do; my role here is the audit/plan above plus verifying the result afterward once they've done it.

### Pre-push audit (2026-09-03) — user approved the setup plan above, but not deployment; asked for a commit/secrets audit before any push

Exact 3 commits ahead of `origin/main` (newest first): `c0080a1` "Fix nested `<a>` hydration error in ProductCard", `6a2f2f0` "Add docs/PROJECT_CONTEXT.md as persistent session memory", `70c90dd` "Launch readiness: security fixes, SSR/SEO pass, curated marketplace content" — 27 files changed, +3719/−101.

**Secrets check:** no `.env` file tracked in git; `.gitignore` additionally excludes `/supabase/.temp` in this range; scanned the full diff for secret-shaped patterns (`sk_live`/`sk_test`/`whsec_`/service-role keys/private-key blocks/hardcoded passwords) — zero matches; manually eyeballed the two Stripe-touching files (`stripe-checkout/index.ts`, `supabase/config.toml`) — only code logic and the public (non-secret) `project_id`. Clean.

**Working tree check:** **not clean** — `docs/PROJECT_CONTEXT.md` has unstaged changes from this session's ongoing edits (this section included). Reported accurately rather than claiming clean. Not committed, since committing wasn't requested for this round. No push performed — still waiting for explicit approval, per instruction.

## 10. Known bugs / limitations

- `/api/test-db` (`app/api/test-db/route.ts`) is a debug endpoint that queries categories/needs/profiles and returns them as JSON. It uses only the public anon key (no secret exposure), but it's still a diagnostic endpoint left reachable in production. Consider removing or gating before/soon after launch — not fixed this session, no instruction to do so.
- `/search` renders fully client-side (Next.js "deopted into client-side rendering" build warning) — functional but not SSR'd; acceptable for MVP.
- Three stray hand-run SQL files remain at repo root (`fix_relations.sql`, `seed_categories.sql`, `all_migrations.sql`) — superseded by tracked migrations, not yet deleted (see §5).
- 6 pre-existing ESLint warnings (`@next/next/no-img-element`) in `app/admin/blog/page.tsx`, `app/onboarding/builder/page.tsx`, `app/starter-packs/page.tsx`, `app/starter-packs/[slug]/page.tsx`, `components/image-uploader.tsx`, `components/product-image.tsx` — non-blocking, unchanged from prior session.
- `ai-need-matching` Edge Function not yet reviewed for correctness/deployment status.
- 38 of 50 products have real Simple-Icons logos; the rest intentionally use initials/fallback branding (icon unavailable or trademark-restricted) — by design, do not fake these.
- **Minor, not fixed:** the header/footer `Logo` component (`components/logo.tsx`) passes a fixed `height` to `next/image` with `width: 'auto'` in inline `style`, which still trips Next's "width or height modified, but not the other" console warning in dev. Cosmetic/dev-only, found while investigating the hydration bug below; not touched.
- **This sandboxed dev environment specifically** has slow/unreliable outbound access to Google Fonts (`fonts.googleapis.com`/`fonts.gstatic.com`, 5s+ per request) and occasionally to the Supabase REST API from the Next.js dev server process (not from plain `curl`, and not from the browser's own client-side requests) — causes next/font to fall back to system fonts and can intermittently 404 a route under dev-server load. Transient in this sandbox; not seen as a code bug and not expected on the user's own machine or in production, but worth knowing about if a future session sees an unexplained flaky 404/500 while driving the dev server here.
  - **Diagnosed more precisely 2026-09-03:** on a long-running dev server session, this can get worse than a graceful "system-ui fallback" — the `--font-inter`/`--font-display`/`--font-mono` CSS custom properties that `next/font` (`app/layout.tsx`) is supposed to inject can end up completely **unset** (empty string via `getComputedStyle`, confirmed in-browser), rather than pointing at a substitute font. Per the CSS spec, `var(--unset-property)` with no fallback argument invalidates the *entire* `font-family` value it appears in (not just that one entry), so the browser falls all the way back to its own default UA font (**Times New Roman**) instead of even reaching the `system-ui, sans-serif` fallbacks already written into `tailwind.config.ts`. Confirmed the app's own font setup code (`app/layout.tsx`, `tailwind.config.ts` `fontFamily`) is correct — this is purely a symptom of the sandbox's flaky Google Fonts connectivity destabilizing next/font's CSS injection over a long dev session, not an app bug. **Fixed by restarting the dev server** (found and killed an orphaned `node.exe` still holding port 3000 from an earlier background task first, since a naive restart landed on port 3004 instead — same-origin matters here, a different port would have logged out the active test session's `localStorage`). After the clean restart, `--font-inter`/`--font-display`/`--font-mono` resolve correctly (e.g. `'__Inter_f367f3', '__Inter_Fallback_f367f3'`) and the UI renders with the correct Inter font again, confirmed visually. No application code was touched — this really was just a stuck dev-server/font-fetch state, exactly as diagnosed. Won't occur in production (Netlify has normal internet access) or on the user's own machine.

### Fixed this session (2026-09-03)

- **Nested `<a>` inside `<a>` hydration error in `ProductCard`** (`components/product-card.tsx`) — the card's outer `Link` (wrapping the whole thumbnail+content area) contained a second `Link` around the category `Badge`. An anchor can't legally contain another anchor; the browser's HTML parser silently un-nests them before React hydrates, producing exactly the "Warning: Expected server HTML to contain a matching `<div>` in `<a>`" / `validateDOMNesting` errors the user reported live from their own browser. Confirmed via a live console read on `/search` (`ProductCard` is used there via `app/search/page.tsx`) before touching any code. Fixed by converting the component to `'use client'`, replacing the inner `Link` with a `<span role="link" tabIndex={0}>` that calls `router.push()` on click/Enter with `stopPropagation()` so it still navigates to the category page without nesting inside the outer anchor. Re-verified live: reloading `/search` repeatedly after the fix produced zero nesting/hydration console messages (the only remaining console entry was the pre-fix one, timestamped before the edit). `need-card.tsx`, the app's other reusable card component, was checked and does not have this pattern. A handful of other files matched a broad "two Links in the same file" sweep but were manually confirmed to be sibling links, not nested — a more exhaustive sweep for the same anti-pattern elsewhere in the app was not done (out of scope for this fix; flag as a possible follow-up if similar reports come in from other pages).

## 11. Remaining launch checklist

In order:

1. **Stripe test-mode verification** — ✅ **DONE.** Both the one-time $10 listing flow and the Pro Builder subscription flow are fully verified end-to-end with real test-mode data. Optional follow-up (not blocking): a live cancellation test was offered to the user but not yet performed (currently verified by code review only — see §7 item 4).
2. **Google OAuth verification** — ✅ **DONE**, verified opportunistically via the test session's own real Google-authenticated login (see §8 for the honest caveat about it not being a from-scratch first-time-signup test).
3. **Netlify setup (fresh, no existing site)** — 🟡 plan written, see §9. Awaiting user approval before any dashboard action (site creation, GitHub connection, env vars, deploy) — none of that is mine to do unilaterally, and I have no Netlify dashboard access regardless. Also surfaced a real gap: `origin/main` on GitHub is 3 commits behind local `main` (unpushed) — worth resolving before or as part of going live.
4. **Full browser QA pass** covering: email signup, login, logout, Google login, username/profile creation, create/edit/delete a need, upvote, builder onboarding, free product listing, paid listing checkout, product discovery, need↔product relationships, reviews/ratings, Pro Builder gating, admin moderation (approve/feature), responsive layouts, broken links, console errors, empty/loading states, unauthorized access, mobile nav.

## 12. Decisions and why

- Chose SECURITY DEFINER RPCs over broader RLS policies for `products.paid`/`featured` because Postgres column-level privileges (already revoking client UPDATE on those columns) can't be overridden by a same-role RLS policy — an RPC running as an elevated function was the only way to let admin actions and legitimate free-claims through while keeping the column locked down from direct client writes.
- Kept the free-listing-eligibility check server-side (`claim_free_product_listing`) instead of trusting a client-computed "is this my first listing" flag, closing the $10 fee bypass at the root rather than patching the UI.
- Left `products` UPDATE RLS otherwise alone for admins — `paid`/`paid_at`/`featured` intentionally route through RPCs, not a same-role admin bypass policy, per the column-privilege constraint above.
- Did not delete the stray root SQL files or the `/api/test-db` route this session — out of scope for a read-only verification pass, and deletion wasn't requested.

## 13. Files changed this session (2026-09-03)

- `docs/PROJECT_CONTEXT.md` — created, then updated repeatedly throughout the session. Committed as `6a2f2f0`.
- `components/product-card.tsx` — fixed a nested-`<a>`-inside-`<a>` hydration bug (see §10 "Fixed this session"). Committed as `c0080a1`.
- Everything else this session (Stripe verification, the failed-then-fixed webhook investigation) involved **no application code changes** — it was Supabase/Stripe Dashboard configuration, done by the user, plus read-only DB/API verification by me. Both commits above are local only, not pushed.

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
| Live Stripe checkout attempt #1 (signed in as a real builder account with an existing paid listing, so the $10 fee path was exercised, not the free-first-listing path) | 🔴 FAILED at first — both Edge Functions returned `500 WORKER_ERROR` on every request (missing/invalid `STRIPE_SECRET_KEY`). User fixed the Supabase secrets. |
| Live Stripe checkout attempt #2 (same test listing, real test-mode payment completed) | 🟡 Payment succeeded, but webhook never processed it — `stripe_orders` stayed empty, `products.paid` stayed `false`. Root cause narrowed to the Stripe Dashboard webhook endpoint (wrong URL). User corrected it. |
| Live Stripe checkout attempt #3 (resent the existing `checkout.session.completed` event against the corrected endpoint) | ✅ **PASSED** — `stripe_orders` now has a matching completed order row (`$10.00`, `payment_status: paid`), `products.paid` flipped to `true` ~0.5s later (matches the webhook's actual code order), confirmed visually (the "not yet published" banner is gone). |
| Live Pro Builder subscription checkout (real test-mode payment via `/pricing`) | ✅ **PASSED** — `stripe_subscriptions` has an active $15/month subscription row, `profiles.pro_builder`/`pro_builder_until`/`verified` all updated correctly, confirmed visually (Pro + Verified badges in the UI). |
| Cancellation / failed-payment handling | 🟡 Verified by code review only (webhook re-syncs real Stripe status on every event, `isActive` only true for `active`/`trialing`, so no false-positive grant path exists) — a live cancellation test was offered to the user, not yet performed. |
| Sandbox font rendering issue (user-reported) | Diagnosed and fixed — `next/font` CSS variables were unset due to this sandbox's flaky Google Fonts connectivity over a long dev-server session; found and killed an orphaned process holding port 3000, restarted the dev server cleanly on the same port (preserving the browser's authenticated session), fonts render correctly now. No app code changed. |

**Confirmed:** repo state matches the prior session's summary closely enough to trust it (git checkpoint, typecheck/lint/build, RLS/Stripe/OAuth code, editorial profile, seed content presence). **Also now confirmed:** both Stripe flows (one-time $10 listing fee, $15/month Pro Builder subscription) work correctly end-to-end in the live/deployed environment, after two rounds of user-side configuration fixes (Edge Function secrets, then the webhook endpoint URL) — no app code changes were needed for either fix.
**Assumed (not independently verified):** pg_cron job actually running; all 28 migrations applied byte-for-byte as committed (only inferred from live query results matching expectations); `ai-need-matching` function behavior; cancellation/failed-payment handling (verified by code review, not yet by a live event).
**Not yet verified:** a live cancellation event (optional follow-up, offered to the user), Google OAuth dashboard config, Netlify dashboard config, full browser QA.
**Blocked on:** nothing technical remaining for Stripe. Google OAuth and Netlify readiness are not blocked, just not yet attempted; both need either live browser QA (available via claude-in-chrome) or dashboard access the user may need to grant/perform manually.

## 15. Git checkpoint

- Latest commit: `c0080a1` — "Fix nested `<a>` hydration error in ProductCard"
- Previous: `6a2f2f0` — "Add docs/PROJECT_CONTEXT.md as persistent session memory"
- Rollback reference (prior checkpoint, still intact underneath): `70c90dd` — "Launch readiness: security fixes, SSR/SEO pass, curated marketplace content"
- Branch: `main`, working tree clean, 3 commits ahead of `origin/main`
- **Not pushed.** Do not push without explicit approval.

## 16. Changelog

- **2026-09-03** — New session. Created this context document. Performed read-only verification: confirmed clean git state at `70c90dd`; re-ran and confirmed typecheck/lint/build all pass with the same results as the prior session's report; read and confirmed the security-fix migrations (admin RLS, product paid-status RPCs, insert column restriction, profile trigger reconciliation, pg_cron scheduling) do what the commit message claims; read the Stripe Edge Functions and confirmed checkout/webhook logic; confirmed via live anon-key query that the `needsaas` editorial profile exists and seed content (53 products / 60 needs / 14 categories) is present. No code changes made in this initial pass. No deploys triggered. No commits made.
- **2026-09-03 (same day, continued)** — User reported a live hydration error from their own browser session (three "Expected server HTML to contain a matching `<div>` in `<a>`" React errors, pasted mid-turn). Started a local dev server, reproduced the underlying `validateDOMNesting` warning live via the browser console on `/search`, traced it to `components/product-card.tsx` (a `Link` nested inside the card's outer `Link` around the category badge), fixed it (see §10), and re-verified live that the warning no longer occurs. `npm run typecheck` and `npm run lint` re-run clean after the fix. Committed as `6a2f2f0` (docs/PROJECT_CONTEXT.md) and `c0080a1` (the fix) — local commits only, not pushed.
- **2026-09-03 (same day, continued further)** — User specified a large Phase 2 product direction (SEO blog, industry Starter Packs, shareable software profiles), explicitly scheduled to start only after Stripe/OAuth/Netlify readiness are settled — recorded in full as §17. Resumed Stripe test-mode verification: user signed into the running dev server, attempted a real $10 listing checkout (account already had one paid listing, so the free-first-listing path correctly didn't apply and the real Stripe checkout path was exercised). **Discovered both `stripe-checkout` and `stripe-webhook` Edge Functions are completely down** — every request type, including unauthenticated `OPTIONS` preflight, returns `500 WORKER_ERROR`, both live in-browser and via direct `curl` probing against the deployed functions. Root cause strongly indicated (not log-confirmed, no dashboard access): `STRIPE_SECRET_KEY` missing/invalid in the deployed Edge Function secrets, crashing the Stripe SDK client construction at module load time. This blocks all further Stripe testing until the user fixes the secret configuration themselves. Full detail in §7. No code changes made this pass (this is an infra/config issue, not a code bug) — one harmless unpaid test product row was created as a side effect (`id 6000b022-e357-4348-a34d-3161222c63b6`, left in place pending instruction). No deploys, no new commits.
- **2026-09-03 (same day, continued further still)** — User configured the Stripe test-mode secrets in Supabase (values never seen or requested). Re-probed both Edge Functions directly — both now initialize correctly (`OPTIONS` → 204, `stripe-webhook` reaches its own signature check). User asked to keep the `QA Test Product` row rather than delete it (useful reusable test state), and to move on to Google OAuth/Netlify checks while they worked on the secrets — superseded moments later by a follow-up saying the secrets were done and to retry checkout, so proceeded with the retry. Clicked "Pay $10 to publish" on the existing test listing → correctly redirected to a real Stripe **Sandbox**-mode Checkout Session showing the right product/amount. Per standing rules, did not fill in the card form myself (even Stripe's public test card counts as "entering financial credentials into a field") — asked the user to complete payment themselves. User confirmed payment completed. **Verified the payment went through Stripe (successful redirect) but the database was never updated**: `products.paid` stayed `false`, and — checked via the signed-in user's own session token (read from browser `localStorage`, used only in-page for an authenticated fetch, never printed) rather than the anon key, to rule out an RLS false-negative — `stripe_orders` is completely empty for this user while `stripe_customers` does have the expected row. This isolates the failure to Stripe webhook delivery/processing specifically (endpoint likely not registered in the Stripe Dashboard for test mode, or a signing-secret mismatch on that specific endpoint) — a Dashboard-side check the user needs to do, not a code fix. No code changes, no deploys, no new commits this pass.
- **2026-09-03 (same day, final Stripe pass)** — User corrected the webhook endpoint URL in the Stripe Dashboard (test mode) to point at the NeedSaaS Supabase project, and resent the existing `checkout.session.completed` event against the corrected endpoint (chosen over a fresh payment to avoid re-entering a test card and to avoid creating another test listing, per explicit instruction to keep the existing `QA Test Product` row). **Verified success**: `stripe_orders` now has a completed order row matching the original `$10.00` test-mode payment, and `products.paid` for the `QA Test Product` row flipped to `true` (confirmed via the DB, checked with the signed-in user's own session token as before, and visually in the UI — the "not yet published" banner is gone). **The one-time $10 listing-fee Stripe flow is now fully verified end-to-end.** No app code was changed at any point across this whole Stripe investigation — both root causes (missing Edge Function secret, then a misconfigured webhook endpoint URL) were Supabase/Stripe Dashboard configuration issues, both fixed by the user. No deploys, no pushes, no new commits, no new test listings.
- **2026-09-03 (Pro Builder subscription pass)** — User asked to verify the Pro Builder subscription flow next (same session, same signed-in account), explicitly scoped to test mode only, no new $10 charge, smallest-safe-fix-only if something failed. Started checkout from `/pricing` → correctly redirected to a Stripe Sandbox session for "Subscribe to Pro Builder — Monthly", $15.00/month. User completed payment. **Verified full success**: `stripe_subscriptions` has an active subscription row with the correct price/period, `profiles.pro_builder`/`pro_builder_until`/`verified` all updated correctly, and the UI shows Pro + Verified badges. Reviewed the webhook's cancellation/failed-payment handling by code (re-syncs real Stripe status on every event; a declined initial checkout can't produce a false grant since no webhook event fires for it) and offered the user a live cancellation test for empirical confirmation — not yet performed. Noted one minor, non-blocking cosmetic finding: `pro_builder_since` drifts to the last sync's timestamp rather than staying pinned to the true first-subscribed date, since Stripe fires multiple events around subscription creation and each one recomputes it fresh — doesn't affect access control, not fixed (out of scope of what was asked). **Mid-task, user separately reported the site's fonts looked wrong** — diagnosed as this sandbox's flaky Google Fonts connectivity leaving `next/font`'s CSS custom properties completely unset after a long dev-server session (confirmed via `getComputedStyle`, and confirmed the app's own font-config code was correct, not at fault). Found and killed an orphaned `node.exe` still holding port 3000 from an earlier restart attempt, restarted the dev server cleanly on port 3000 (matters for keeping the same origin, so the browser's `localStorage` auth session wasn't lost), and confirmed fonts render correctly again, still logged in. No app code changed for the font fix either. No deploys, no pushes, no new commits.
- **2026-09-03 (Google OAuth + Netlify plan)** — User clarified Stripe was fully done and asked for Google OAuth verification next, then explicitly clarified **no Netlify setup exists at all** (site, GitHub connection, env vars, deploy — none of it), instructing that Netlify be treated as a from-scratch setup rather than an audit of something existing, with a written plan required before any dashboard action. **Google OAuth:** discovered the session's already-signed-in test account was authenticated via a real Google identity (not email/password) — inspected the session JWT and the resulting `profiles` row: exactly one profile, correctly populated from Google's identity data, username auto-generated via the documented fallback pattern, confirming the full OAuth chain (Google Cloud client → Supabase provider config → trigger → redirect) works, with an honest caveat noted that this specific profile predates the trigger's formal migration tracking by a few days (see §8). **Netlify:** inspected `netlify.toml`, `package.json`, git remotes/branches, and searched the whole codebase for env var usage; wrote a full setup plan (§9) covering what's already in code vs. what needs dashboard setup, the GitHub repo/branch to connect (`arhamfarman/needsaas`, `main`), the three required env var *names* (no values), build/publish settings, and what the user must configure themselves. Surfaced a concrete pre-launch gap: `origin/main` on GitHub is 3 commits behind local `main` (unpushed) — connecting Netlify today would build stale code missing this session's fixes. No Netlify site created, no GitHub connection made, no deploy triggered, no DNS touched, nothing pushed — waiting for explicit approval before any of that.

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

**State:** Repo is at commit `c0080a1` (3 ahead of `origin/main`, unpushed, working tree clean). Build/lint/typecheck all pass. **Stripe (§7) and Google OAuth (§8) are both fully verified end-to-end.** **Netlify has no site at all yet** — the user explicitly clarified this after earlier notes wrongly implied it might be partially set up; §9 is now a from-scratch setup plan (GitHub repo `arhamfarman/needsaas` / branch `main`, the 3 required env var names, build settings, the unpushed-commits gap), written but **not acted on** — waiting for the user's explicit approval before any dashboard action, which I can't perform myself anyway (no Netlify dashboard access). §17 (SEO content / Starter Packs / software profiles) is fully specified and queued but explicitly not to start until Stripe/OAuth/Netlify are all settled — Netlify is the one still open.

**Exact next recommended action:** Ask the user whether they're ready to act on the Netlify setup plan in §9 (create the site, connect GitHub, set the 3 env vars, choose `main` as production branch), and separately whether/when to push the 3 unpushed local commits — connecting Netlify before pushing would deploy stale code. Once Netlify is live, verify the deployed site the same way Stripe/OAuth were verified (live browser check, not just "the build succeeded"). Only after that, move to the full browser QA checklist (§11 item 4), and only after *that*, begin §17 starting with its audit step. Optional loose end from the Stripe pass: a live cancellation test for the Pro Builder subscription was offered but not performed (§7 item 4) — not blocking. Note: this session's local dev server had intermittent slow/failed outbound requests to Google Fonts and occasionally Supabase (sandbox-specific, see §10) — this once got severe enough to visibly break font rendering; if it recurs, kill any orphaned `node.exe` holding the port and restart cleanly *on the same port* (a different port is a different origin and silently logs out the browser's session).

**Reminders for whoever picks this up:**
- Do not push to `origin/main` without explicit approval.
- Do not create a Netlify site, connect GitHub, trigger a deploy, or touch DNS without explicit approval — and note I have no direct Netlify dashboard access regardless, so the actual clicking-through is the user's to do.
- Never ask the user to paste Stripe secret keys, service-role keys, Netlify tokens, or other credentials/secret values into chat/files — env var *names* are fine and expected, values are not.
- Do not sign in, create accounts, or enter passwords/card numbers in the browser yourself — even Stripe's public test card counts as "entering financial credentials." Have the user authenticate and complete payment forms; drive the rest of the session (navigation, button clicks, DB verification) from there.
- To check DB state as the signed-in user rather than via the anon key (needed when RLS scopes a table to the owner, e.g. `stripe_orders`/`stripe_customers`/`stripe_subscriptions`), read the session token from the browser's own `localStorage` (`sb-<project-ref>-auth-token`) via the JS tool and use it for an in-page authenticated `fetch` — never print or export the token value itself.
- If restarting the local dev server, check for and kill any orphaned `node.exe` holding the target port first (`netstat -ano | grep :3000`), and restart on the *same* port — a different port is a different origin, which silently logs out any browser tab whose session lives in that origin's `localStorage`.
- This document (`docs/PROJECT_CONTEXT.md`) is the source of truth when conversation history is unavailable — but reconcile it against actual repo/DB state, since it can drift.
