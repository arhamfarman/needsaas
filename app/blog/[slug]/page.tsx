import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { markdownToHtml } from '@/lib/markdown';
import { JsonLd, blogPostJsonLd, breadcrumbJsonLd } from '@/components/json-ld';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowRight, Calendar } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

type Props = { params: { slug: string } };

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function getPublishedPost(slug: string) {
  const { data } = await supabase
    .from('blog_posts')
    .select(`
      id, title, slug, excerpt, content, cover_image_url, published_at, updated_at,
      seo_title, seo_description, canonical_url, og_image_url, author_id,
      author:profiles(username, full_name, avatar_url)
    `)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  return data as any;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPost(params.slug);

  if (!post) {
    return {
      title: 'Article not found — NeedSaaS',
      robots: { index: false, follow: false },
    };
  }

  const title = post.seo_title || `${post.title} — NeedSaaS`;
  const description = post.seo_description || post.excerpt || '';
  const canonical = post.canonical_url || `${SITE_URL}/blog/${post.slug}`;
  const ogImage = post.og_image_url || post.cover_image_url || `${SITE_URL}/Logo.png`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'NeedSaaS',
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      type: 'article',
      ...(post.published_at && { publishedTime: post.published_at }),
      ...(post.updated_at && { modifiedTime: post.updated_at }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedPost(params.slug);
  if (!post) notFound();

  const [{ data: tagLinks }, { data: packLinks }] = await Promise.all([
    supabase
      .from('blog_post_tags')
      .select('blog_tag:blog_tags(id, name, slug)')
      .eq('blog_post_id', post.id),
    supabase
      .from('starter_pack_blog_posts')
      .select('starter_pack:starter_packs(id, title, slug, short_description, industry, published)')
      .eq('blog_post_id', post.id),
  ]);

  const tags = (tagLinks ?? []).map((t: any) => t.blog_tag).filter(Boolean);
  const relatedPacks = (packLinks ?? [])
    .map((p: any) => p.starter_pack)
    .filter((p: any) => p && p.published);

  const author = post.author;
  const authorName = author?.full_name?.trim() || (author?.username ? `@${author.username}` : null);
  const canonical = post.canonical_url || `${SITE_URL}/blog/${post.slug}`;
  const contentHtml = markdownToHtml(post.content || '');

  return (
    <>
      <JsonLd data={blogPostJsonLd({
        title: post.title,
        excerpt: post.excerpt,
        cover_image_url: post.og_image_url || post.cover_image_url,
        published_at: post.published_at,
        updated_at: post.updated_at,
        author_name: authorName,
        canonicalUrl: canonical,
      })} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
        { name: post.title, url: canonical },
      ])} />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/blog" className="hover:text-foreground">Blog</Link>
          <span>/</span>
          <span className="text-foreground">{post.title}</span>
        </nav>

        {post.cover_image_url && (
          <div className="mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted">
            <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}

        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-border/40 py-4 text-sm text-muted-foreground">
          {authorName && (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                {author?.avatar_url ? (
                  <img src={author.avatar_url} alt={authorName} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                    {authorName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="font-medium text-foreground">{authorName}</span>
            </div>
          )}
          {post.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Published {formatDate(post.published_at)}
            </span>
          )}
          {post.updated_at && post.published_at && post.updated_at !== post.published_at && (
            <span>Updated {formatDate(post.updated_at)}</span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag: any) => (
              <Badge key={tag.id} variant="outline" className="border-border/50 text-xs font-medium text-muted-foreground">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Article body — content is admin-authored (RLS-restricted) markdown,
            HTML-escaped by markdownToHtml before any tags are generated. */}
        <div
          className="blog-content mt-8"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {relatedPacks.length > 0 && (
          <section className="mt-14">
            <div className="mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-brand" />
              <h2 className="font-display text-xl font-semibold text-foreground">Related Starter Packs</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedPacks.map((pack: any) => (
                <Link
                  key={pack.id}
                  href={`/starter-packs/${pack.slug}`}
                  className="group rounded-xl border border-border/60 bg-card p-4 transition hover:border-brand/20 hover:shadow-card"
                >
                  {pack.industry && (
                    <span className="text-xs font-medium uppercase tracking-wide text-brand">{pack.industry}</span>
                  )}
                  <h3 className="mt-1 flex items-center gap-1 font-medium text-foreground group-hover:text-brand">
                    {pack.title}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </h3>
                  {pack.short_description && (
                    <p className="mt-1 text-sm text-muted-foreground">{pack.short_description}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
