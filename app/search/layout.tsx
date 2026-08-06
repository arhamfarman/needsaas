import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

export const metadata: Metadata = {
  title: 'Search — Find software, needs, and builders',
  description: 'Search across software listings, needs, builders, and categories. Find the right software for your business or post a need.',
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    title: 'Search — NeedSaaS',
    description: 'Find software that solves your problem, or post a need and inspire someone to build it.',
    url: `${SITE_URL}/search`,
    siteName: 'NeedSaaS',
    images: ['/Logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Search — NeedSaaS',
    description: 'Find software that solves your problem.',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
