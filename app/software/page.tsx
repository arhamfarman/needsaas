import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { JsonLd, breadcrumbJsonLd } from '@/components/json-ld';
import { Package, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

export const metadata: Metadata = {
  title: 'Software Categories — Browse all software on NeedSaaS',
  description: 'Browse software by category. Find the best tools for accounting, marketing, AI, productivity, HR, and more.',
  alternates: { canonical: `${SITE_URL}/software` },
  openGraph: {
    title: 'Software Categories — NeedSaaS',
    description: 'Browse software by category — accounting, marketing, AI, productivity, and more.',
    url: `${SITE_URL}/software`,
    siteName: 'NeedSaaS',
    images: ['/Logo.png'],
  },
};

export default async function SoftwareIndexPage() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  // Get product counts per category
  const { data: productCounts } = await supabase
    .from('products')
    .select('category_id')
    .eq('paid', true);

  const countMap = new Map<string, number>();
  (productCounts ?? []).forEach((p: any) => {
    if (p.category_id) countMap.set(p.category_id, (countMap.get(p.category_id) ?? 0) + 1);
  });

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Software', url: `${SITE_URL}/software` },
      ])} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Software Categories',
        description: 'Browse all software categories on NeedSaaS',
        url: `${SITE_URL}/software`,
      }} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            <Package className="h-3.5 w-3.5 text-brand" />
            Browse by category
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Software Categories
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Find the right software for your business. Browse by category to compare tools, read reviews, and discover new products.
          </p>
        </div>

        {/* Search hint */}
        <div className="mb-10 flex justify-center">
          <Link
            href="/search"
            className="flex w-full max-w-md items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground transition hover:border-brand/40 hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            Search all software...
          </Link>
        </div>

        {/* Category grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? []).map((cat: any) => {
            const count = countMap.get(cat.id) ?? 0;
            return (
              <Link
                key={cat.id}
                href={`/software/${cat.slug}`}
                className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-all hover:border-brand/20 hover:shadow-card-hover"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Package className="h-6 w-6" />
                </div>
                <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-brand">
                  {cat.name}
                </h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {cat.description || `Discover the best ${cat.name} software.`}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {count} {count === 1 ? 'product' : 'products'}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-brand">
                    Browse <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {(!categories || categories.length === 0) && (
          <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No categories available yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
