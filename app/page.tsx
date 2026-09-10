import { supabase } from '@/lib/supabase';
import type { Product, Need, Category, Profile } from '@/lib/types';
import { LandingHero, LandingContent } from '@/components/landing-sections';

// Server-rendered so the homepage's actual content — trending needs, newest
// software, categories, featured builders — is present in the initial HTML
// for crawlers, instead of only appearing after a client-side fetch.
//
// Was `revalidate = 300` (5-minute ISR). Found during launch-readiness
// cleanup that this meant deleting a piece of test/QA content from the
// admin panel could stay visible on the homepage for up to 5 more minutes
// -- confirmed live (Tozmel and the QA products were still showing here
// immediately after being deleted in the admin panel, even though the
// database and every admin list already reflected the deletion). Same fix
// already applied to app/starter-packs/[slug]/page.tsx and
// app/blog/[slug]/page.tsx for the same underlying reason: supabase-js's
// REST calls run through Next's global fetch, which the App Router caches
// by default. This is the highest-traffic page in the app, so it gets the
// same fully-fresh treatment.
export const revalidate = 0;

export default async function Home() {
  const [needs, newest, rated, highReward, building, completed, cats, builderProds] = await Promise.all([
    supabase.from('needs').select(`*, category:categories(*)`).order('vote_count', { ascending: false }).limit(6),
    supabase.from('products').select(`*, category:categories(*)`).eq('paid', true).order('created_at', { ascending: false }).limit(6),
    // Filtered to products with at least one real review -- without this,
    // "Highest Rated Software" would rank and display unrated products
    // (avg_rating defaults to 0 for everyone) under a "Top-rated by the
    // community" label that wasn't true yet. Found during launch-readiness
    // review after the one review in production turned out to be a fake
    // self-review, which meant this section had never actually shown a
    // genuinely-rated product. The section hides itself entirely (see
    // LandingContent's `topRated.length > 0` check) once this returns
    // nothing, rather than showing unrated products as if they were rated.
    supabase.from('products').select(`*, category:categories(*)`).eq('paid', true).gt('review_count', 0).order('avg_rating', { ascending: false }).limit(6),
    supabase.from('needs').select(`*, category:categories(*)`).order('reward_amount', { ascending: false }).limit(6),
    supabase.from('needs').select(`*, category:categories(*)`).in('status', ['committed', 'building']).order('updated_at', { ascending: false }).limit(6),
    supabase.from('needs').select(`*, category:categories(*)`).eq('status', 'fulfilled').order('updated_at', { ascending: false }).limit(6),
    supabase.from('categories').select('*').order('name'),
    supabase.from('products').select('owner_id').eq('paid', true),
  ]);

  const ownerCounts = new Map<string, number>();
  (builderProds.data ?? []).forEach((p: any) => {
    ownerCounts.set(p.owner_id, (ownerCounts.get(p.owner_id) ?? 0) + 1);
  });
  const topOwnerIds = Array.from(ownerCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map((entry) => entry[0]);

  let builders: (Profile & { product_count: number })[] = [];
  if (topOwnerIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', topOwnerIds);
    builders = (profiles ?? []).map((p: any) => ({ ...p, product_count: ownerCounts.get(p.id) ?? 0 }));
  }

  return (
    <>
      <LandingHero />
      <LandingContent
        trendingNeeds={(needs.data as Need[]) ?? []}
        newestSoftware={(newest.data as Product[]) ?? []}
        topRated={(rated.data as Product[]) ?? []}
        highestReward={(highReward.data as Need[]) ?? []}
        beingBuilt={(building.data as Need[]) ?? []}
        recentlyCompleted={(completed.data as Need[]) ?? []}
        categories={(cats.data as Category[]) ?? []}
        builders={builders}
      />
    </>
  );
}
