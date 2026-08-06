import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/builders`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/starter-packs`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/software`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ];

  // Products
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('paid', true)
    .limit(500);

  (products ?? []).forEach((p: any) => {
    entries.push({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: new Date(p.updated_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Needs
  const { data: needs } = await supabase
    .from('needs')
    .select('id, updated_at')
    .neq('status', 'closed')
    .limit(500);

  (needs ?? []).forEach((n: any) => {
    entries.push({
      url: `${SITE_URL}/needs/${n.id}`,
      lastModified: new Date(n.updated_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  // Builders who own paid products
  const { data: builderIds } = await supabase
    .from('products')
    .select('owner_id')
    .eq('paid', true);

  const uniqueBuilderIds = Array.from(new Set((builderIds ?? []).map((b: any) => b.owner_id)));
  if (uniqueBuilderIds.length > 0) {
    const { data: builderProfiles } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .in('id', uniqueBuilderIds)
      .limit(200);

    (builderProfiles ?? []).forEach((b: any) => {
      entries.push({
        url: `${SITE_URL}/builders/${b.id}`,
        lastModified: new Date(b.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });
  }

  // Starter Packs
  const { data: starterPacks } = await supabase
    .from('starter_packs')
    .select('slug, updated_at')
    .eq('published', true);

  (starterPacks ?? []).forEach((sp: any) => {
    entries.push({
      url: `${SITE_URL}/starter-packs/${sp.slug}`,
      lastModified: new Date(sp.updated_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Category landing pages
  const { data: categories } = await supabase
    .from('categories')
    .select('slug');

  (categories ?? []).forEach((c: any) => {
    entries.push({
      url: `${SITE_URL}/software/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return entries;
}
