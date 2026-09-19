import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BuilderProfileView } from '@/components/builder-profile-view';
import { JsonLd, builderJsonLd, breadcrumbJsonLd } from '@/components/json-ld';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: builder } = await supabase
    .from('profiles')
    .select(`username, full_name, bio, avatar_url, verified, pro_builder`)
    .eq('id', params.id)
    .maybeSingle();

  if (!builder) {
    // Unreachable once notFound() fires below -- kept correct regardless.
    // (This one already needed the explicit suffix for the same
    // layout-inheritance reason as the found-case title above.)
    return {
      title: 'Builder not found — NeedSaaS',
      robots: { index: false, follow: false },
    };
  }

  const b = builder as any;
  const name = b.full_name || `@${b.username}`;
  // NOT the same fix as the other [id]/[slug] pages -- this route has its
  // own app/builders/layout.tsx, which sets a static string `metadata.title`
  // of its own. That breaks inheritance of the root layout's title template
  // for everything under /builders: confirmed live, a real builder page
  // was rendering just "Name, Builder" with no "— NeedSaaS" suffix at all
  // once the template-reliant version of this line shipped. So this one
  // page needs the suffix appended explicitly instead of relying on the
  // template like every other detail page does.
  const title = `${name}, Builder — NeedSaaS`;
  const description = (b.bio || `Software builder on NeedSaaS`).slice(0, 160);
  const canonical = `${SITE_URL}/builders/${params.id}`;
  const ogImage = b.avatar_url || `${SITE_URL}/Logo.png`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'NeedSaaS',
      // No fixed width/height -- ogImage is either the builder's own avatar
      // (arbitrary dimensions) or the /Logo.png fallback (2303x404, not
      // 1200x630), so a hardcoded size would misdeclare whichever loads.
      images: [{ url: ogImage, alt: name }],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function BuilderPage({ params }: Props) {
  const { data: builder } = await supabase
    .from('profiles')
    .select(`*`)
    .eq('id', params.id)
    .maybeSingle();

  // Same fix as app/needs/[id]/page.tsx and app/products/[id]/page.tsx --
  // was returning HTTP 200 with BuilderProfileView's own inline "Builder
  // not found" state instead of the branded 404 page.
  if (!builder) notFound();

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', params.id)
    .eq('paid', true);

  const canonical = `${SITE_URL}/builders/${params.id}`;

  return (
    <>
      {builder && (
        <>
          <JsonLd data={builderJsonLd({
            username: (builder as any).username,
            full_name: (builder as any).full_name,
            bio: (builder as any).bio,
            avatar_url: (builder as any).avatar_url,
            verified: (builder as any).verified ?? false,
            product_count: productCount ?? 0,
            canonicalUrl: canonical,
          })} />
          <JsonLd data={breadcrumbJsonLd([
            { name: 'Home', url: SITE_URL },
            { name: 'Builders', url: `${SITE_URL}/builders` },
            { name: (builder as any).full_name || (builder as any).username, url: canonical },
          ])} />
        </>
      )}
      <BuilderProfileView />
    </>
  );
}
