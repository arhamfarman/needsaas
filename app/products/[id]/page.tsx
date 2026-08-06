import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { ProductDetailView } from '@/components/product-detail-view';
import { JsonLd, softwareJsonLd, breadcrumbJsonLd } from '@/components/json-ld';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: product } = await supabase
    .from('products')
    .select(`name, tagline, description, url, logo_url, pricing, price_from, category:categories(name)`)
    .eq('id', params.id)
    .maybeSingle();

  if (!product) {
    return {
      title: 'Software not found — NeedSaaS',
      robots: { index: false, follow: false },
    };
  }

  const p = product as any;
  const title = `${p.name} — ${p.tagline || 'Software on NeedSaaS'}`;
  const description = (p.description || p.tagline || '').slice(0, 160);
  const canonical = `${SITE_URL}/products/${params.id}`;
  const ogImage = p.logo_url || `${SITE_URL}/Logo.png`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'NeedSaaS',
      images: [{ url: ogImage, width: 1200, height: 630, alt: p.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    other: {
      'ai:context': `${p.name} is ${p.pricing || 'a'} software product. ${p.tagline || ''} ${p.description || ''}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { data: product } = await supabase
    .from('products')
    .select(`*, category:categories(name, slug), profile:profiles(username, verified)`)
    .eq('id', params.id)
    .maybeSingle();

  const canonical = `${SITE_URL}/products/${params.id}`;

  return (
    <>
      {product && (
        <>
          <JsonLd data={softwareJsonLd({
            name: (product as any).name,
            tagline: (product as any).tagline,
            description: (product as any).description,
            url: (product as any).url,
            logo_url: (product as any).logo_url,
            pricing: (product as any).pricing,
            price_from: (product as any).price_from,
            repo_url: (product as any).repo_url,
            doc_url: (product as any).doc_url,
            category_name: (product as any).category?.name ?? null,
            avg_rating: (product as any).avg_rating ?? 0,
            review_count: (product as any).review_count ?? 0,
            owner_username: (product as any).profile?.username ?? null,
            owner_verified: (product as any).profile?.verified ?? false,
            canonicalUrl: canonical,
          })} />
          <JsonLd data={breadcrumbJsonLd([
            { name: 'Home', url: SITE_URL },
            { name: 'Search', url: `${SITE_URL}/search` },
            { name: (product as any).name, url: canonical },
          ])} />
        </>
      )}
      <ProductDetailView />
    </>
  );
}
