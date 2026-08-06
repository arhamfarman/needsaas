import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { NeedDetailView } from '@/components/need-detail-view';
import { JsonLd, needJsonLd, breadcrumbJsonLd } from '@/components/json-ld';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: need } = await supabase
    .from('needs')
    .select(`title, description, status, vote_count, reward_amount, need_score, category:categories(name)`)
    .eq('id', params.id)
    .maybeSingle();

  if (!need) {
    return {
      title: 'Need not found — NeedSaaS',
      robots: { index: false, follow: false },
    };
  }

  const n = need as any;
  const title = `${n.title} — Need on NeedSaaS`;
  const description = (n.description || '').slice(0, 160);
  const canonical = `${SITE_URL}/needs/${params.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'NeedSaaS',
      images: [{ url: `${SITE_URL}/Logo.png`, width: 1200, height: 630, alt: n.title }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    other: {
      'ai:context': `${n.title} is a software need with ${n.vote_count} votes and a $${n.reward_amount} reward pool. NeedScore: ${n.need_score}. Status: ${n.status}.`,
    },
  };
}

export default async function NeedPage({ params }: Props) {
  const { data: need } = await supabase
    .from('needs')
    .select(`*, category:categories(name, slug)`)
    .eq('id', params.id)
    .maybeSingle();

  const canonical = `${SITE_URL}/needs/${params.id}`;

  return (
    <>
      {need && (
        <>
          <JsonLd data={needJsonLd({
            title: (need as any).title,
            description: (need as any).description,
            category_name: (need as any).category?.name ?? null,
            vote_count: (need as any).vote_count ?? 0,
            reward_amount: (need as any).reward_amount ?? 0,
            need_score: (need as any).need_score ?? 0,
            status: (need as any).status ?? 'open',
            canonicalUrl: canonical,
          })} />
          <JsonLd data={breadcrumbJsonLd([
            { name: 'Home', url: SITE_URL },
            { name: 'Search', url: `${SITE_URL}/search` },
            { name: (need as any).title, url: canonical },
          ])} />
        </>
      )}
      <NeedDetailView />
    </>
  );
}
