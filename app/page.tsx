import { supabase } from '@/lib/supabase';
import type { Product, Need, Category, Profile } from '@/lib/types';
import { LandingHero, LandingContent } from '@/components/landing-sections';

// Server-rendered so the homepage's actual content — trending needs, newest
// software, categories, featured builders — is present in the initial HTML
// for crawlers, instead of only appearing after a client-side fetch.
// Revalidated periodically (rather than left static-until-redeploy) since
// "Trending"/"Newest" is only meaningful if it isn't frozen at build time.
export const revalidate = 300;

export default async function Home() {
  const [needs, newest, rated, highReward, building, completed, cats, builderProds] = await Promise.all([
    supabase.from('needs').select(`*, category:categories(*)`).order('vote_count', { ascending: false }).limit(6),
    supabase.from('products').select(`*, category:categories(*)`).eq('paid', true).order('created_at', { ascending: false }).limit(6),
    supabase.from('products').select(`*, category:categories(*)`).eq('paid', true).order('avg_rating', { ascending: false }).limit(6),
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
