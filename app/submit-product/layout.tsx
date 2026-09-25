import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

export const metadata: Metadata = {
  title: 'Submit Your Product — List Software on NeedSaaS',
  description: 'Give your SaaS, AI agent, automation, or software product a home. Get a shareable public product page in minutes — your first listing is free.',
  alternates: { canonical: `${SITE_URL}/submit-product` },
  openGraph: {
    title: 'Submit Your Product — NeedSaaS',
    description: 'Give your SaaS, AI agent, automation, or software product a home. Get a shareable public product page — your first listing is free.',
    url: `${SITE_URL}/submit-product`,
    siteName: 'NeedSaaS',
    images: ['/Logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Submit Your Product — NeedSaaS',
    description: 'Give your product a home. First listing free.',
  },
};

export default function SubmitProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
