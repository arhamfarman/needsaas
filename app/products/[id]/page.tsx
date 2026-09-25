import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase, productImagePublicUrl } from '@/lib/supabase';
import { ProductDetailView } from '@/components/product-detail-view';
import { JsonLd, softwareJsonLd, breadcrumbJsonLd } from '@/components/json-ld';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: product } = await supabase
    .from('products')
    .select(`name, tagline, description, problem_solved, target_audience, url, logo_url, pricing, price_from, category:categories(name)`)
    .eq('id', params.id)
    .maybeSingle();

  if (!product) {
    // Unreachable once notFound() fires below -- kept correct regardless.
    return {
      title: 'Software not found',
      robots: { index: false, follow: false },
    };
  }

  const p = product as any;
  // The root layout's title template appends "— NeedSaaS" to every page.
  // The fallback here previously ended in "...on NeedSaaS", which the
  // template then doubled for any product missing a tagline. Same fix as
  // app/needs/[id]/page.tsx.
  const title = `${p.name} — ${p.tagline || 'Software'}`;
  const description = (p.description || p.tagline || '').slice(0, 160);
  const canonical = `${SITE_URL}/products/${params.id}`;
  // Was the raw private storage path (e.g. "editorial/logos/slack.svg") used
  // directly as if it were a URL -- resolved to nothing for any crawler.
  // product-images is now a public bucket (see
  // 20260923120000_builder_product_submission.sql); this builds the real,
  // permanently-fetchable URL instead.
  const ogImage = productImagePublicUrl(p.logo_url) || `${SITE_URL}/Logo.png`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'NeedSaaS',
      // No fixed width/height here -- ogImage is either the product's own
      // uploaded logo (arbitrary dimensions) or the /Logo.png fallback
      // (2303x404, not 1200x630), so a hardcoded size would misdeclare
      // whichever one actually loads. Crawlers fetch the image and read its
      // real dimensions when none are declared, which OG's spec allows.
      images: [{ url: ogImage, alt: p.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    other: {
      'ai:context': [
        `${p.name} is ${p.pricing || 'a'} software product.`,
        p.tagline,
        p.description,
        p.problem_solved && `Problem it solves: ${p.problem_solved}`,
        p.target_audience && `Who it's for: ${p.target_audience}`,
      ].filter(Boolean).join(' '),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { data: product } = await supabase
    .from('products')
    .select(`*, category:categories(name, slug), profile:profiles(username, verified)`)
    .eq('id', params.id)
    .maybeSingle();

  // Same fix as app/needs/[id]/page.tsx -- was returning HTTP 200 with
  // ProductDetailView's own inline "Product not found" state instead of
  // the branded 404 page.
  if (!product) notFound();

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
            logo_url: productImagePublicUrl((product as any).logo_url),
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
            key_features: (product as any).key_features ?? null,
            target_audience: (product as any).target_audience ?? null,
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
