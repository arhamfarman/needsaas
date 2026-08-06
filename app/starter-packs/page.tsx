import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

export const metadata: Metadata = {
  title: 'Starter Packs — Curated software collections for your industry',
  description: 'Discover curated collections of the best software for your industry. Construction, restaurants, clinics, accounting, and more.',
  alternates: { canonical: `${SITE_URL}/starter-packs` },
  openGraph: {
    title: 'Starter Packs — NeedSaaS',
    description: 'Curated software collections for every industry.',
    url: `${SITE_URL}/starter-packs`,
    siteName: 'NeedSaaS',
    images: ['/Logo.png'],
  },
};

export default async function StarterPacksPage() {
  const { data: packs } = await supabase
    .from('starter_packs')
    .select('id, title, slug, short_description, cover_image_url, industry')
    .eq('published', true)
    .order('title');

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
          <Package className="h-3.5 w-3.5 text-brand" />
          Curated collections
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Starter Packs
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Hand-picked software collections for specific industries. Find the right tools for your business, all in one place.
        </p>
      </div>

      {!packs || packs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No starter packs available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => (
            <Link
              key={pack.id}
              href={`/starter-packs/${pack.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all hover:border-brand/20 hover:shadow-card-hover"
            >
              {pack.cover_image_url ? (
                <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                  <img
                    src={pack.cover_image_url}
                    alt={pack.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-brand/10 via-brand/5 to-transparent">
                  <Package className="h-12 w-12 text-brand/30" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                {pack.industry && (
                  <span className="mb-2 text-xs font-medium uppercase tracking-wide text-brand">
                    {pack.industry}
                  </span>
                )}
                <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-brand">
                  {pack.title}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {pack.short_description || pack.title}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand">
                  Explore pack
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
