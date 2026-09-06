import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd, breadcrumbJsonLd, starterPackJsonLd } from '@/components/json-ld';
import { ProductImage } from '@/components/product-image';
import { VerifiedBadge } from '@/components/verified-badge';
import {
  Package, ArrowRight, Star, FileText, Lightbulb,
  Users, Award, HelpCircle, ExternalLink, AlertCircle,
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';

// Bug found during Phase 4 live testing: supabase-js's REST calls run
// through Next's global fetch, which the App Router caches indefinitely by
// default in a Server Component. Without this, a pack that was draft when
// first requested would keep 404-ing here even after being published --
// confirmed live (the draft's not-found response stayed cached until the
// dev server was restarted; identical code worked immediately after).
// Forces a fresh query on every request instead of a stale one.
export const revalidate = 0;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: pack } = await supabase
    .from('starter_packs')
    .select('title, slug, description, short_description, seo_title, seo_description, industry')
    .eq('slug', params.slug)
    .eq('published', true)
    .maybeSingle();

  if (!pack) {
    return { title: 'Starter Pack not found — NeedSaaS', robots: { index: false, follow: false } };
  }

  const title = pack.seo_title || `${pack.title} — NeedSaaS`;
  const description = pack.seo_description || pack.short_description || (pack.description || '').slice(0, 160);
  const canonical = `${SITE_URL}/starter-packs/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'NeedSaaS',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

function ErrorState() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive/70" />
      <h1 className="font-display text-2xl font-semibold text-foreground">Couldn&apos;t load this Starter Pack</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong loading this page. Please try again in a moment.
      </p>
      <Link
        href="/starter-packs"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-soft transition hover:bg-brand/90"
      >
        Back to Starter Packs <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

export default async function StarterPackDetailPage({ params }: Props) {
  // A genuine query failure must not be treated the same as "doesn't exist" --
  // `pack` is null in both cases, so `error` is checked separately before
  // falling back to notFound().
  const { data: pack, error: packError } = await supabase
    .from('starter_packs')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .maybeSingle();

  if (packError) return <ErrorState />;
  if (!pack) notFound();

  // Recommended software, including the Phase 2 curation labels.
  const { data: packProducts, error: productsError } = await supabase
    .from('starter_pack_products')
    .select(`id, sort_order, featured, blurb, role_label, best_for_label, pricing_label,
      product:products(id, name, tagline, logo_url, pricing, price_from, url, avg_rating, review_count,
        profile:profiles(id, username, verified)
      )
    `)
    .eq('starter_pack_id', pack.id)
    .order('sort_order');

  // FAQs
  const { data: faqs, error: faqsError } = await supabase
    .from('starter_pack_faqs')
    .select('id, question, answer, sort_order')
    .eq('starter_pack_id', pack.id)
    .order('sort_order');

  // Related Needs -- real admin-curated relationship (starter_pack_needs),
  // replacing the previous needs.description ILIKE text-match approximation.
  const { data: relatedNeedLinks, error: needsError } = await supabase
    .from('starter_pack_needs')
    .select(`sort_order, need:needs(id, title, description, vote_count, reward_amount, need_score, status)`)
    .eq('starter_pack_id', pack.id)
    .order('sort_order');

  // Featured builders (owners of the products in this pack)
  const builderIds = new Set<string>();
  (packProducts || []).forEach((pp: any) => {
    if (pp.product?.profile) builderIds.add(pp.product.profile.username);
  });

  // Related blog posts
  const { data: blogPosts, error: blogPostsError } = await supabase
    .from('starter_pack_blog_posts')
    .select(`sort_order,
      blog_post:blog_posts(id, title, slug, excerpt, cover_image_url, published_at)
    `)
    .eq('starter_pack_id', pack.id)
    .order('sort_order');

  // Categories -- previously fetched but never rendered
  const { data: packCategories, error: categoriesError } = await supabase
    .from('starter_pack_categories')
    .select(`category:categories(id, name, slug)`)
    .eq('starter_pack_id', pack.id);

  const canonical = `${SITE_URL}/starter-packs/${params.slug}`;

  const jsonLd = starterPackJsonLd({
    title: pack.title,
    description: pack.short_description || pack.description,
    industry: pack.industry,
    canonicalUrl: canonical,
    products: (packProducts || []).map((pp: any) => ({
      name: pp.product?.name ?? null,
      tagline: pp.product?.tagline ?? null,
    })),
  });

  const faqJsonLd = faqs && faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  const relatedNeeds = (relatedNeedLinks || [])
    .map((link: any) => link.need)
    .filter(Boolean);

  return (
    <>
      <JsonLd data={jsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', url: SITE_URL },
        { name: 'Starter Packs', url: `${SITE_URL}/starter-packs` },
        { name: pack.title, url: canonical },
      ])} />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/starter-packs" className="hover:text-foreground">Starter Packs</Link>
          <span>/</span>
          <span className="text-foreground">{pack.title}</span>
        </nav>

        {/* Hero */}
        <div className="mb-12">
          {pack.industry && (
            <span className="mb-3 inline-block text-sm font-medium uppercase tracking-wide text-brand">
              {pack.industry}
            </span>
          )}
          {!categoriesError && packCategories && packCategories.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {packCategories.map((pc: any) => pc.category && (
                <Link
                  key={pc.category.id}
                  href={`/software/${pc.category.slug}`}
                  className="rounded-full border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-brand/40 hover:text-brand"
                >
                  {pc.category.name}
                </Link>
              ))}
            </div>
          )}
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {pack.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {pack.short_description}
          </p>
        </div>

        {/* Overview */}
        {pack.description && (
          <section className="mb-12">
            <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">Overview</h2>
            <p className="text-base leading-relaxed text-muted-foreground">{pack.description}</p>
          </section>
        )}

        {/* Recommended Software */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-2">
            <Package className="h-5 w-5 text-brand" />
            <h2 className="font-display text-2xl font-semibold text-foreground">Recommended Software</h2>
          </div>
          {productsError ? (
            <SectionError message="Couldn't load recommended software right now." />
          ) : (!packProducts || packProducts.length === 0) ? (
            <p className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              Software recommendations are being curated. Check back soon.
            </p>
          ) : (
            <div className="space-y-4">
              {packProducts.map((pp: any) => (
                <ProductRow key={pp.id} pp={pp} />
              ))}
            </div>
          )}
        </section>

        {/* Featured Builders */}
        {builderIds.size > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-brand" />
              <h2 className="font-display text-2xl font-semibold text-foreground">Featured Builders</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(packProducts ?? []).length > 0 && Array.from(builderIds).map((username) => (
                <BuilderChip key={username} username={username} packProducts={packProducts ?? []} />
              ))}
            </div>
          </section>
        )}

        {/* Related Needs */}
        {(needsError || relatedNeeds.length > 0) && (
          <section className="mb-12">
            <div className="mb-6 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-brand" />
              <h2 className="font-display text-2xl font-semibold text-foreground">Related Needs</h2>
            </div>
            {needsError ? (
              <SectionError message="Couldn't load related Needs right now." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {relatedNeeds.map((need: any) => (
                  <Link
                    key={need.id}
                    href={`/needs/${need.id}`}
                    className="group rounded-xl border border-border/60 bg-card p-4 transition hover:border-brand/20 hover:shadow-card"
                  >
                    <h3 className="font-medium text-foreground group-hover:text-brand">{need.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{need.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {need.vote_count} votes</span>
                      {need.reward_amount > 0 && <span className="flex items-center gap-1">Reward pool: ${need.reward_amount}</span>}
                      <span>NeedScore: {Math.round(need.need_score)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Related Blog Articles */}
        {(blogPostsError || (blogPosts && blogPosts.length > 0)) && (
          <section className="mb-12">
            <div className="mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand" />
              <h2 className="font-display text-2xl font-semibold text-foreground">Related Articles</h2>
            </div>
            {blogPostsError ? (
              <SectionError message="Couldn't load related articles right now." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {(blogPosts ?? []).map((bp: any) => bp.blog_post && (
                  <Link
                    key={bp.blog_post.id}
                    href={`/blog/${bp.blog_post.slug}`}
                    className="group rounded-xl border border-border/60 bg-card p-4 transition hover:border-brand/20 hover:shadow-card"
                  >
                    {bp.blog_post.cover_image_url && (
                      <img src={bp.blog_post.cover_image_url} alt={bp.blog_post.title} className="mb-3 aspect-[16/9] w-full rounded-lg object-cover" />
                    )}
                    <h3 className="font-medium text-foreground group-hover:text-brand">{bp.blog_post.title}</h3>
                    {bp.blog_post.excerpt && <p className="mt-1 text-sm text-muted-foreground">{bp.blog_post.excerpt}</p>}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* FAQ */}
        {(faqsError || (faqs && faqs.length > 0)) && (
          <section className="mb-12">
            <div className="mb-6 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-brand" />
              <h2 className="font-display text-2xl font-semibold text-foreground">Frequently Asked Questions</h2>
            </div>
            {faqsError ? (
              <SectionError message="Couldn't load FAQs right now." />
            ) : (
              <Accordion type="single" collapsible className="space-y-3">
                {(faqs ?? []).map((faq, i) => (
                  <AccordionItem key={faq.id} value={`faq-${i}`} className="rounded-xl border border-border/60 bg-card px-4">
                    <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </section>
        )}

        {/* CTA */}
        <div className="rounded-2xl border border-brand/20 bg-gradient-to-b from-brand/5 to-transparent p-8 text-center">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Can&apos;t find the right software?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Post your need and let builders know what you&apos;re looking for.
          </p>
          <Link
            href="/dashboard?tab=needs"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-soft transition hover:bg-brand/90"
          >
            Post a Need <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}

function ProductRow({ pp }: { pp: any }) {
  const product = pp.product;
  if (!product) return null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 transition hover:border-brand/20 hover:shadow-card"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        <ProductImage path={product.logo_url} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-foreground group-hover:text-brand">{product.name}</h3>
          {pp.role_label && (
            <Badge variant="outline" className="text-xs font-normal">{pp.role_label}</Badge>
          )}
          {pp.featured && (
            <Badge className="bg-brand/10 text-brand hover:bg-brand/10">Featured</Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{product.tagline}</p>
        {pp.blurb && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/80">{pp.blurb}</p>}
        {(pp.best_for_label || pp.pricing_label) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/80">
            {pp.best_for_label && <span>Best for: {pp.best_for_label}</span>}
            {pp.pricing_label && <span>{pp.pricing_label}</span>}
          </div>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {product.pricing && <Badge variant="outline" className="border-0 px-0 text-xs">{product.pricing}</Badge>}
          {product.avg_rating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {Number(product.avg_rating).toFixed(1)}
            </span>
          )}
          {product.profile?.username && (
            <span className="flex items-center gap-1">
              by @{product.profile.username}
              {product.profile?.verified && <VerifiedBadge />}
            </span>
          )}
        </div>
      </div>
      {product.url && (
        <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-brand" />
      )}
    </Link>
  );
}

function BuilderChip({ username, packProducts }: { username: string; packProducts: any[] }) {
  const pp = packProducts.find((p) => p.product?.profile?.username === username);
  const product = pp?.product;
  if (!product) return null;

  return (
    <Link
      href={`/builders/${product.profile.id || ''}`}
      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition hover:border-brand/20"
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground group-hover:text-brand">@{username}</span>
          {product.profile?.verified && <VerifiedBadge />}
        </div>
        <p className="text-xs text-muted-foreground">Builder in this pack</p>
      </div>
    </Link>
  );
}
