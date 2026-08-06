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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com'),

  title: {
    default: 'NeedSaaS — Find software that solves your problem',
    template: '%s — NeedSaaS',
  },
  description:
    'Discover software that solves your problem. If it doesn\'t exist, post your need for free. If enough people want it, a builder may decide to build it.',
  icons: {
    icon: '/Icon_Logo.png',
    apple: '/Icon_Logo.png',
  },
  openGraph: {
    title: 'NeedSaaS — Find software that solves your problem',
    description:
      'Discover software that solves your problem. If it doesn\'t exist, post your need for free.',
    images: ['/Logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'NeedSaaS — Find software that solves your problem',
    description: 'Discover software, or inspire someone to build it.',
    images: ['/Logo.png'],
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
