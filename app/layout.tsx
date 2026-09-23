import './globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from '@/components/ui/sonner';
import { JsonLd, websiteJsonLd } from '@/components/json-ld';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'NeedSaaS — Find the software you need',
    template: '%s — NeedSaaS',
  },
  description: 'Discover software, AI agents, and automations — or inspire someone to build it.',
  alternates: { canonical: '/' },
  icons: {
    icon: '/Icon_Logo.png',
    apple: '/Icon_Logo.png',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'NeedSaaS',
    title: 'NeedSaaS — Find the software you need',
    description: 'Discover software, AI agents, and automations — or inspire someone to build it.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 628,
        alt: 'NeedSaaS — Find the software you need',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeedSaaS — Find the software you need',
    description: 'Discover software, AI agents, and automations — or inspire someone to build it.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <JsonLd data={websiteJsonLd()} />
        <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
