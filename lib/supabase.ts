import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// `product-images` is a public bucket (see 20260923120000_builder_product_submission.sql)
// -- its objects are already readable by anon via storage RLS, so a public
// URL carries no less exposure than a signed one, but it works permanently
// in server-rendered OG/JSON-LD tags without needing to mint (and refresh) a
// signed URL for a crawler that will never re-fetch it after the first scrape.
export function productImagePublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${supabaseUrl}/storage/v1/object/public/product-images/${path}`;
}
