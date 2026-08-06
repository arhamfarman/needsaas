import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

export const metadata: Metadata = {
  title: 'Builders — Meet the software builders on NeedSaaS',
  description: 'Browse verified software builders on NeedSaaS. Find builders by category and expertise.',
  alternates: { canonical: `${SITE_URL}/builders` },
  openGraph: {
    title: 'Builders — NeedSaaS',
    description: 'Browse verified software builders on NeedSaaS.',
    url: `${SITE_URL}/builders`,
    siteName: 'NeedSaaS',
    images: ['/Logo.png'],
  },
};

export default function BuildersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
