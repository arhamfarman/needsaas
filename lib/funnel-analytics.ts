// Lightweight, structural-only funnel event tracking for the /submit-need
// and /submit-product acquisition funnels. No analytics platform exists in
// this codebase today (confirmed: lib/analytics.ts only has page_views/
// search_events/activity_feed, none of which fit an anonymous pre-auth
// funnel step -- activity_feed specifically requires a non-null user_id).
// Building that infrastructure now is explicitly out of scope for this
// pass. This just gives every funnel step a single, consistently-named
// call site (matching the event names requested) so wiring in a real
// analytics provider later is a one-line change inside this file, not a
// hunt through every form/page for where to add tracking.
export type FunnelEvent =
  | 'submit_need_view' | 'submit_need_started' | 'submit_need_problem_entered'
  | 'submit_need_optional_details_opened' | 'submit_need_submit_clicked'
  | 'submit_need_auth_required' | 'submit_need_created' | 'submit_need_share_clicked'
  | 'submit_need_public_page_viewed'
  | 'submit_product_view' | 'submit_product_started' | 'submit_product_submit_clicked'
  | 'submit_product_auth_required' | 'submit_product_created' | 'submit_product_share_clicked'
  | 'submit_product_public_page_viewed';

export function trackFunnelEvent(event: FunnelEvent, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  // No-op today beyond a dev-visible log. Swap this body for a real
  // provider call (e.g. `window.plausible?.(event, { props })`) when one is
  // added -- every call site below stays unchanged.
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[funnel]', event, props ?? {});
  }
}
