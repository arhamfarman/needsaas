import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

export const metadata: Metadata = {
  title: 'Submit a Software, AI Agent or Automation Need',
  description: 'Have a problem you wish software, AI, or automation could solve? Post your Need for free and share it with others who have the same problem.',
  alternates: { canonical: `${SITE_URL}/submit-need` },
  openGraph: {
    title: 'Submit Your Need — NeedSaaS',
    description: 'Have a problem you wish software, AI, or automation could solve? Post your Need for free and share it with others who have the same problem.',
    url: `${SITE_URL}/submit-need`,
    siteName: 'NeedSaaS',
    images: ['/Logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Submit Your Need — NeedSaaS',
    description: 'Have a problem you wish software, AI, or automation could solve? Tell us what you need.',
  },
};

export default function SubmitNeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
