# NeedSaaS — Launch Readiness

Compiled 2026-09-09 as part of the pre-soft-launch cleanup pass. This is a snapshot, not a permanent doc — update it (or retire it) once the checklist below is actually worked through.

## 1. Executive summary

NeedSaaS's core mechanics — auth, Stripe payments, need/product/review CRUD, admin moderation — were already verified working in earlier sessions and were not found broken in this pass. The real risk this pass addressed was **content and presentation, not code**: the live homepage, search results, and Featured Builders section were showing internal QA/test records (a gibberish product with a self-authored 5-star review, three products literally named "QA Test Product" / "QA2 First/Second Listing," and a Need whose description referenced a git commit hash) as if they were real marketplace activity. That content has been removed. A related class of bug — a doubled page title on Need, blog, Starter Pack, builder-profile, and (in one edge case) product pages — was found and fixed everywhere it occurred, not just on the one page originally reported. A missing Terms/Privacy pair, an unstyled default 404 page, an unenforced self-review restriction, and a hero animation that passed through incomplete text on every cycle were also fixed.

## 2. Current launch verdict

**Materially better than the prior audit, but not yet a clean GO — two things are still outside my control:** (1) none of this is deployed yet (explicit standing rule: no commit/push/deploy without your approval), and (2) mobile has never been verified on a real device or a working viewport emulator in this environment — that gap is unchanged from every prior audit pass. See §7 (Final report) for the actual verdict line.

## 3. Fixes completed (this pass)

All of the below are **local file changes only** — verified via `tsc`, `lint`, a production `next build`, and (for the new pages/404/hero) a local dev server request/screenshot check. **Nothing has been deployed.**

- **Data cleanup (live production database, via the admin CMS UI):** deleted the Tozmel product, QA Test Product, QA2 First Listing, QA2 Second Listing, and the "QA2 relaunch test" Need. The one review in the reviews table (a self-authored 5★ on Tozmel) was removed automatically as a cascade of deleting Tozmel — confirmed via the admin Reviews panel showing 0 reviews afterward, and via a direct database query for all four deleted record IDs returning empty. The `qa2_launch_tester` account itself was **not** deleted (no admin-CMS capability exists for that — see §6) — it stops appearing publicly once its products/Need are gone, since Featured Builders is computed live from published-product ownership, not a stored list.
- **Self-review prevention** — UI now hides the review form and shows a plain message ("You can't review your own listing...") when the signed-in user is the product's owner; `submitReview()` also short-circuits with a clear toast as a second layer. **Database-level enforcement is written but not yet applied** — see §4.
- **Need/blog/Starter Pack/builder-profile/product title-doubling** — fixed on all five, not just the one reported. Root cause: each page appended its own "— NeedSaaS" (or similar) on top of the root layout's title template, which already adds "— NeedSaaS" to every page. Confirmed via direct title-tag checks against a local dev server.
- **Branded 404 page** (`app/not-found.tsx`) — previously didn't exist at all (Next's bare default was showing). New page inherits the existing header/footer via the root layout, uses the same icon/button language as the rest of the app, and has a "Back to homepage" CTA. Confirmed via a direct request returning HTTP 404 with the new markup.
- **Terms of Service and Privacy Policy** (`app/terms`, `app/privacy`) — plain-language MVP versions covering everything requested, explicitly marked as not lawyer-reviewed, with specific sections flagged for legal review (contribution/reward-pool refund treatment, payment refund policy, limitation-of-liability language, compliance-framework applicability). No invented company/legal details — contact info is left as an explicit placeholder (see §11).
- **Sign-in and footer now link to both pages** — the sign-in screen's Terms/Privacy mention was previously plain, unlinked text.
- **Homepage revalidate lowered from 300s to 0** — found live during this pass that a product/Need deleted in the admin panel could still show on the homepage for up to 5 minutes afterward (confirmed: Tozmel and the QA products were still visible immediately after deletion). Same class of fix already applied to Starter Packs and Blog pages in an earlier phase of this project.
- **"Highest Rated Software" no longer surfaces unrated products** — the homepage query now requires `review_count > 0`. With zero genuine reviews currently in the database, this section will not render at all until a real one exists, rather than showing unrated products under a "Top-rated by the community" label.
- **Hero animation replaced** — was a character-by-character typewriter that passed through partial/deleting text on every cycle after the first (confirmed live and exactly matching what you saw in the homepage recording). Now crossfades between two always-complete strings, respects `prefers-reduced-motion` (shows the first message only, no cycling, for a visitor with that preference), and reserves the same fixed-height container so there's no layout shift. Verified via local screenshots at two different points in the cycle — no partial text at either.
- **"Currently Being Built" verified genuinely empty, not broken** — 0 Needs currently have `status IN ('committed', 'building')`; the section's existing conditional already hides it correctly rather than showing a broken-looking empty state.

## 4. Fixes still requiring your approval

- **`supabase/migrations/20260909120000_prevent_self_review.sql`** — written, adds the database-level check (`NOT EXISTS ... WHERE p.owner_id = auth.uid()`) to the `reviews` INSERT policy, matching what you approved in the plan. **I have no Supabase CLI or service-role key in this environment, so I cannot apply it myself.** You'll need to run it via the Supabase SQL Editor against the `wowugivczgicuqfvqgqy` project. Until you do, self-review prevention is UI-only (real, but not enforced if someone bypasses the client).
- **Commit, push, deploy** — everything above is local-only per your standing rule. Nothing goes live until you say so.
- **`jasmine.dossa_ad7a` / "Enara Dossa"** — not touched, per your instruction. This is a real-looking account (Google-OAuth signup pattern, created 2026-09-08) with zero content — no Need, product, or review. No action taken or recommended; flagged for your own recognition, not mine to decide.
- **The "gilgities" and "carpenters" Needs** — not touched, per your instruction.

## 5. Remaining technical risks

- **Same stale-cache class of bug likely exists on other public pages** not touched this pass (e.g. `/software/[slug]` category pages, `/builders/[id]`) — not confirmed broken, just not checked. Worth a deliberate sweep later rather than assuming.
- **The self-review RLS policy is not live yet** (see §4) — until applied, the restriction is enforced only by the client, not the database.
- **No automated tests exist in this project** (confirmed earlier this session — no test framework configured), so "run any existing tests" in Phase 6 has nothing to run. All verification here is manual/live-checked, not test-suite-covered.

## 6. Remaining content/data risks

- **`qa2_launch_tester` the account itself still exists** in `profiles`/`auth.users` — harmless now that it owns no public content, but it's still a test artifact sitting in the users table. The admin CMS has no delete/ban capability for accounts (only `is_admin`/`verified`/`pro_builder` toggles) — removing it would require direct SQL, which per your rules needs separate explicit approval.
- **Only 3–4 real profiles total, 2 real open Needs, 0 genuine reviews** — this pass removed what was actively misleading, but it did not (and per your rules, should not) manufacture the appearance of a larger community. The site will still look like an early, small marketplace to a visitor — because it is one. That's an honest state, not a bug.
- **The admin dashboard's summary tiles (Total Users / Published Software / Total Needs) appeared stale** immediately after this session's deletions, even though every underlying list page was already correct — not fully root-caused (likely the same ISR-style caching pattern found elsewhere, but this specific admin overview route wasn't inspected in depth). Cosmetic and admin-only; doesn't affect what real visitors see.

## 7. Manual tests you must perform

Nothing below was tested by me this pass beyond what's explicitly marked "verified" above — do not treat any of these as done:

- [ ] Full mobile pass on a real phone (see §6 of the prior audit's manual test plan — unchanged, still unverified in this environment)
- [ ] New user email/password signup, end to end, including email confirmation if enabled
- [ ] Google sign-in, end to end
- [ ] Posting a real Need through the actual form (not just viewing the UI)
- [ ] Editing an existing Need
- [ ] Listing a product through the builder flow up to the Stripe checkout screen (do not need to complete a real payment to confirm the handoff works)
- [ ] Contributing to a reward pool
- [ ] Bookmarking, following, and notifications
- [ ] A full click-through of every admin panel not opened this pass (Software, Needs, Builders, Users, Blog, Categories, Starter Packs, Rewards, Analytics, Settings — only Dashboard, Software, Needs, and Reviews were used this pass)

## 8. Exact Netlify dashboard actions you must perform

- **The "Powered by Netlify" badge is not controlled by anything in this repository** — confirmed by a full-repo search; it's served by Netlify's own platform script (`/.netlify/scripts/hud`). This is a **site-level dashboard setting**, not a `netlify.toml` option. In the Netlify dashboard for this site: **Site configuration → General → this is typically labeled "Badge" or governed by your plan tier** — on Netlify's free tier, the badge may not be removable at all without upgrading; on a paid plan it's a toggle. I don't have dashboard access to check which applies to this specific site, so you'll need to look directly rather than take my word for the exact menu path.
- Once you've applied the migration and are ready, a deploy is needed to actually ship every code fix above — not done, awaiting your approval.

## 9. Exact Supabase dashboard actions you must perform

- **Run `supabase/migrations/20260909120000_prevent_self_review.sql`** via SQL Editor (Supabase dashboard → SQL Editor → paste the file's contents → Run) against project `wowugivczgicuqfvqgqy`. This is the one piece of this pass I could not do myself.
- Optional, your call: consider whether to remove the `qa2_launch_tester` profile row directly (`profiles` table, and optionally the corresponding `auth.users` row) — I have not done this and am flagging it only as an option per §6, not recommending it be rushed.

## 10. Exact Stripe dashboard actions you must perform

None identified this pass. Pricing/payment claims across the app (Terms page, pricing page, dashboard, product form) were grep-checked for consistency and all agree: $10 one-time listing fee after a free first listing, $15/month or $99/year Pro Builder, and the "Save 45%" yearly-discount claim is arithmetically correct ($15 × 12 = $180; $99 is a genuine 45% reduction from that). This matches the Stripe checkout configuration verified end-to-end in earlier sessions. No action needed unless you're changing pricing.

## 11. Exact content I need to provide

- **A real contact email** for the Terms and Privacy pages — both currently have an explicit bracketed placeholder rather than an invented address. Low urgency for a small controlled soft launch to people you know personally, but needed before a wider release.
- **Confirmation on `jasmine.dossa_ad7a` / "Enara Dossa"** — do you recognize this signup?
- **A decision on the `qa2_launch_tester` account itself** (leave it inert, or have it removed via direct SQL with your separate approval).

## 12. What should not be changed before launch

- The core two-sided model, the homepage's existing structure and copy, the pricing figures, and the overall visual design — none of these were touched, per your explicit instructions, and nothing in this pass surfaced a reason they should be.
- Don't add new homepage sections, fake reviews/builders/activity, or a redesigned hero to "fill space" — the small-community state is honest; padding it would undo the point of this cleanup.

## 13. Final soft-launch checklist

```
[x] QA products removed
[x] QA Need removed
[x] Fake review removed
[ ] Self-review prevention verified          -- UI done; DB-level migration written but not applied (needs your action, §9)
[ ] Terms page live                           -- built and verified locally; not deployed
[ ] Privacy page live                         -- built and verified locally; not deployed
[ ] 404 page live                             -- built and verified locally; not deployed
[x] Need title fixed                          -- and the same bug on blog/starter-pack/builder/product pages
[ ] Homepage contains no test content         -- true in the database; still cached on the live site until this deploys (or ~5 min passes)
[ ] No misleading empty sections              -- fixed locally (Highest Rated Software query, hero animation); not deployed
[ ] Netlify badge handled                     -- guidance given above; dashboard action is yours
[ ] Desktop smoke test completed              -- partially done live this session (homepage, search, admin panels); not a full pass of every flow
[ ] Mobile smoke test completed               -- NOT done; no reliable mobile viewport available in this environment
[ ] New user signup tested                    -- NOT done
[ ] Google login tested                       -- verified working in an earlier session (2 days prior), not re-tested this pass
[ ] Real Need posting tested                  -- NOT done (form UI reviewed only)
[ ] Need editing tested                       -- NOT done
[ ] Builder listing flow tested                -- NOT done this pass (Stripe flow verified end-to-end in an earlier session)
[ ] Stripe checkout handoff tested             -- verified end-to-end in an earlier session, not re-tested this pass
[ ] Admin moderation tested                    -- partially: product/Need/review deletion all confirmed working live this pass
[ ] Production database backup/export completed if appropriate -- NOT done; your call whether this is warranted before further data changes
```
