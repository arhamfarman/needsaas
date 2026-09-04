import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

export const metadata: Metadata = {
  title: 'Pricing — Pro Builder subscription',
  description: 'Free to start. First listing free. Pro Builder is $15/month or $99/year for unlimited listings, analytics, verified badge, and demand-based opportunity matching.',
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: 'Pricing — NeedSaaS',
    description: 'Free to start. Upgrade to Pro Builder for $15/month — unlimited listings, analytics, verified badge.',
    url: `${SITE_URL}/pricing`,
    siteName: 'NeedSaaS',
    images: ['/Logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Pricing — NeedSaaS',
    description: 'Free to start. Pro Builder from $15/month.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
