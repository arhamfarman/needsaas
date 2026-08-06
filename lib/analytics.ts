import { supabase } from '@/lib/supabase';

const VISITOR_KEY = 'ns_visitor_id';

export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `v_${Math.random().toString(36).slice(2) + Date.now().toString(36)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export async function trackPageView(
  entityType: 'product' | 'builder' | 'need',
  entityId: string,
) {
  if (typeof window === 'undefined') return;
  try {
    const visitor_id = getVisitorId();
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('page_views').insert({
      entity_type: entityType,
      entity_id: entityId,
      visitor_id,
      user_id: session?.user?.id ?? null,
      referrer: document.referrer || null,
    });

    if (entityType === 'product') {
      await supabase.rpc('increment_product_views', { p_id: entityId });
    }
  } catch {
    // Silent fail
  }
}

export async function trackSearchEvent(
  query: string,
  resultCount: number,
  clickedType?: string,
  clickedId?: string,
) {
  try {
    const visitor_id = getVisitorId();
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('search_events').insert({
      query: query.trim(),
      result_count: resultCount,
      clicked_type: clickedType ?? null,
      clicked_id: clickedId ?? null,
      user_id: session?.user?.id ?? null,
      visitor_id,
    });
  } catch {
    // Silent fail
  }
}

export async function logActivity(
  userId: string,
  type: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, any>,
) {
  try {
    await supabase.from('activity_feed').insert({
      user_id: userId,
      type,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      metadata: metadata ?? {},
    });
  } catch {
    // Silent fail
  }
}
