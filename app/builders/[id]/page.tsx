import type { Metadata } from 'next';
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
    return {
      title: 'Builder not found — NeedSaaS',
      robots: { index: false, follow: false },
    };
  }

  const b = builder as any;
  const name = b.full_name || `@${b.username}`;
  const title = `${name} — Builder on NeedSaaS`;
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
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
