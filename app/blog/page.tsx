import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { JsonLd, breadcrumbJsonLd } from '@/components/json-ld';
import { FileText, ArrowRight } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

// Server-rendered so search engines see the real post list (or the real
// empty state) in the initial HTML, matching the pattern used by
// app/starter-packs/page.tsx.
export const revalidate = 300;

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function getPublishedPosts() {
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false });
  return data ?? [];
}

export async function generateMetadata(): Promise<Metadata> {
  const posts = await getPublishedPosts();
  const hasContent = posts.length > 0;

  const title = 'Blog — Software guides, comparisons, and buying advice';
  const description = 'Practical guides to finding and choosing business software — comparisons, buying advice, and industry software stacks.';

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog` },
    // Noindex an empty blog rather than let a content-free listing page get
    // indexed — matches the "don't create misleading indexable pages" rule.
    // Once at least one post is published this flips to indexable on its own.
    robots: hasContent ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: 'Blog — NeedSaaS',
      description,
      url: `${SITE_URL}/blog`,
      siteName: 'NeedSaaS',
      images: ['/Logo.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Blog — NeedSaaS',
      description,
    },
  };
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
      ])} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            <FileText className="h-3.5 w-3.5 text-brand" />
            Guides &amp; comparisons
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Blog
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Practical guides to finding and choosing business software — comparisons, buying advice, and industry software stacks.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No articles published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all hover:border-brand/20 hover:shadow-card-hover"
              >
                {post.cover_image_url ? (
                  <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-brand/10 via-brand/5 to-transparent">
                    <FileText className="h-12 w-12 text-brand/30" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  {post.published_at && (
                    <span className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {formatDate(post.published_at)}
                    </span>
                  )}
                  <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-brand">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand">
                    Read article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
