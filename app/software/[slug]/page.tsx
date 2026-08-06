import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { JsonLd, breadcrumbJsonLd } from '@/components/json-ld';
import { CategoryBrowser } from '@/components/category-browser';
import { ProductCard } from '@/components/product-card';
import { VerifiedBadge } from '@/components/verified-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Package, Star, TrendingUp, Lightbulb, Users, Award, HelpCircle,
  ArrowRight, FileText, Sparkles, Layers,
} from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com';
const PER_PAGE = 6;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: category } = await supabase
    .from('categories')
    .select('name, slug, description, seo_title, seo_description')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!category) {
    return { title: 'Category not found — NeedSaaS', robots: { index: false, follow: false } };
  }

  const title = category.seo_title || `${category.name} Software — Best Tools in ${category.name}`;
  const description = category.seo_description || category.description || `Discover the best ${category.name} software. Compare features, pricing, and ratings.`;
  const canonical = `${SITE_URL}/software/${params.slug}`;

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

export async function generateStaticParams() {
  const { data: categories } = await supabase.from('categories').select('slug');
  return (categories ?? []).map((c: any) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!category) notFound();

  const catId = (category as any).id;
  const canonical = `${SITE_URL}/software/${params.slug}`;

  // Fetch all categories for internal links
  const { data: allCategories } = await supabase.from('categories').select('*').order('name');

  // Featured products
  const { data: featured } = await supabase
    .from('products')
    .select(`*, category:categories(*), profile:profiles(username, verified)`)
    .eq('paid', true)
    .eq('category_id', catId)
    .eq('featured', true)
    .limit(3);

  // Newest products
  const { data: newest } = await supabase
    .from('products')
    .select(`*, category:categories(*), profile:profiles(username, verified)`)
    .eq('paid', true)
    .eq('category_id', catId)
    .order('created_at', { ascending: false })
    .limit(4);

  // Highest rated
  const { data: topRated } = await supabase
    .from('products')
    .select(`*, category:categories(*), profile:profiles(username, verified)`)
    .eq('paid', true)
    .eq('category_id', catId)
    .order('avg_rating', { ascending: false })
    .limit(4);

  // Trending (most bookmarked)
  const { data: trending } = await supabase
    .from('products')
    .select(`*, category:categories(*), profile:profiles(username, verified)`)
    .eq('paid', true)
    .eq('category_id', catId)
    .order('bookmark_count', { ascending: false })
    .limit(4);

  // Featured builders (owners of products in this category)
  const { data: builderData } = await supabase
    .from('products')
    .select(`profile:profiles(id, username, full_name, avatar_url, verified, bio)`)
    .eq('paid', true)
    .eq('category_id', catId);
  const builderMap = new Map<string, any>();
  (builderData ?? []).forEach((b: any) => {
    if (b.profile && !builderMap.has(b.profile.id)) builderMap.set(b.profile.id, b.profile);
  });
  const featuredBuilders = Array.from(builderMap.values()).slice(0, 6);

  // Related needs
  const { data: relatedNeeds } = await supabase
    .from('needs')
    .select('id, title, description, vote_count, reward_amount, need_score, status')
    .eq('category_id', catId)
    .neq('status', 'closed')
    .order('need_score', { ascending: false })
    .limit(4);

  // Popular tags
  const { data: tagData } = await supabase
    .from('product_tags')
    .select(`tag:tags(id, name), product:products!inner(category_id)`)
    .eq('product.category_id', catId);
  const tagMap = new Map<string, { name: string; count: number }>();
  (tagData ?? []).forEach((t: any) => {
    if (t.tag) {
      const existing = tagMap.get(t.tag.id);
      if (existing) existing.count++;
      else tagMap.set(t.tag.id, { name: t.tag.name, count: 1 });
    }
  });
  const popularTags = Array.from(tagMap.entries()).map(([id, v]) => ({ id, name: v.name, count: v.count })).sort((a, b) => b.count - a.count).slice(0, 15);

  // Starter packs linked to this category
  const { data: starterPacks } = await supabase
    .from('starter_pack_categories')
    .select(`starter_pack:starter_packs(id, title, slug, short_description, industry)`)
    .eq('category_id', catId);
  const packs = (starterPacks ?? []).map((sp: any) => sp.starter_pack).filter(Boolean).slice(0, 3);

  // Category FAQs
  const { data: faqs } = await supabase
    .from('category_faqs')
    .select('id, question, answer, sort_order')
    .eq('category_id', catId)
    .order('sort_order');

  // Generate default FAQs if none exist
  const allFaqs = faqs && faqs.length > 0 ? faqs : [
    { id: 'default-1', question: `What is the best ${(category as any).name} software?`, answer: `The best ${(category as any).name} software depends on your specific needs, budget, and team size. Browse our curated list above to compare features, pricing, and ratings.`, sort_order: 0 },
    { id: 'default-2', question: `How much does ${(category as any).name} software cost?`, answer: `${(category as any).name} software ranges from free plans to enterprise subscriptions. Most small-to-medium businesses spend $20-200/month on their core tools.`, sort_order: 1 },
  ];

  // JSON-LD
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: (category as any).seo_title || `${(category as any).name} Software`,
    description: (category as any).seo_description || (category as any).description,
    url: canonical,
    about: (category as any).name,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: 'Software', url: `${SITE_URL}/software` },
    { name: (category as any).name, url: canonical },
  ];

  return (
    <>
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/software" className="hover:text-foreground">Software</Link>
          <span>/</span>
          <span className="text-foreground">{(category as any).name}</span>
        </nav>

        {/* Hero */}
        <div className="mb-10 rounded-2xl border border-border/40 bg-gradient-to-b from-brand/5 to-transparent p-8 sm:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
              <Layers className="h-3.5 w-3.5 text-brand" />
              Software Category
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {(category as any).name} Software
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {(category as any).long_description || (category as any).description || `Discover the best ${(category as any).name} software. Compare features, pricing, and ratings to find the right tool for your business.`}
            </p>
          </div>
        </div>

        {/* Featured Software */}
        {featured && featured.length > 0 && (
          <Section icon={Sparkles} title="Featured Software">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => <ProductCard key={p.id} product={p as any} />)}
            </div>
          </Section>
        )}

        {/* Full browser with filtering */}
        <Section icon={Package} title={`All ${(category as any).name} Software`} noMargin>
          <CategoryBrowser categoryId={catId} allCategories={(allCategories as any[]) ?? []} />
        </Section>

        {/* Newest + Top Rated side by side */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {newest && newest.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
                <Package className="h-5 w-5 text-brand" /> Newest
              </h2>
              <div className="space-y-3">
                {newest.map((p) => <MiniProductRow key={p.id} product={p as any} />)}
              </div>
            </div>
          )}
          {topRated && topRated.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-foreground">
                <Star className="h-5 w-5 text-brand" /> Highest Rated
              </h2>
              <div className="space-y-3">
                {topRated.map((p) => <MiniProductRow key={p.id} product={p as any} />)}
              </div>
            </div>
          )}
        </div>

        {/* Trending */}
        {trending && trending.length > 0 && (
          <Section icon={TrendingUp} title="Trending Software">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((p) => <ProductCard key={p.id} product={p as any} />)}
            </div>
          </Section>
        )}

        {/* Featured Builders */}
        {featuredBuilders.length > 0 && (
          <Section icon={Award} title="Featured Builders">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBuilders.map((builder) => (
                <Link
                  key={builder.id}
                  href={`/builders/${builder.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition hover:border-brand/20"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
                      {(builder.username || '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground group-hover:text-brand">@{builder.username}</span>
                      {builder.verified && <VerifiedBadge />}
                    </div>
                    {builder.bio && <p className="truncate text-xs text-muted-foreground">{builder.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Related Needs */}
        {relatedNeeds && relatedNeeds.length > 0 && (
          <Section icon={Lightbulb} title="Related Needs">
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedNeeds.map((need) => (
                <Link
                  key={need.id}
                  href={`/needs/${need.id}`}
                  className="group rounded-xl border border-border/60 bg-card p-4 transition hover:border-brand/20 hover:shadow-card"
                >
                  <h3 className="font-medium text-foreground group-hover:text-brand">{need.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{need.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {need.vote_count} votes</span>
                    {need.reward_amount > 0 && <span>Reward: ${need.reward_amount}</span>}
                    <span>NeedScore: {Math.round(need.need_score)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Popular Tags */}
        {popularTags.length > 0 && (
          <Section icon={Package} title="Popular Tags">
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link key={tag.id} href={`/search?q=${encodeURIComponent(tag.name)}&tab=products`}>
                  <Badge variant="outline" className="cursor-pointer border-border/60 text-muted-foreground hover:border-brand hover:text-brand">
                    {tag.name} <span className="ml-1 opacity-50">{tag.count}</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Starter Packs */}
        {packs.length > 0 && (
          <Section icon={Package} title="Starter Packs">
            <div className="grid gap-4 sm:grid-cols-3">
              {packs.map((pack) => (
                <Link
                  key={pack.id}
                  href={`/starter-packs/${pack.slug}`}
                  className="group rounded-xl border border-border/60 bg-card p-5 transition hover:border-brand/20 hover:shadow-card"
                >
                  {pack.industry && <span className="text-xs font-medium uppercase tracking-wide text-brand">{pack.industry}</span>}
                  <h3 className="mt-1 font-medium text-foreground group-hover:text-brand">{pack.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{pack.short_description}</p>
                  <span className="mt-3 flex items-center gap-1 text-sm font-medium text-brand">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* FAQ */}
        <Section icon={HelpCircle} title="Frequently Asked Questions">
          <Accordion type="single" collapsible className="space-y-3">
            {allFaqs.map((faq, i) => (
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
        </Section>

        {/* Internal links to other categories */}
        <div className="mt-12 rounded-2xl border border-border/40 bg-card/50 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Explore other categories</h2>
          <div className="flex flex-wrap gap-2">
            {(allCategories as any[])?.filter((c) => c.id !== catId).map((cat) => (
              <Link key={cat.id} href={`/software/${cat.slug}`}>
                <Badge variant="outline" className="cursor-pointer border-border/60 text-muted-foreground hover:border-brand hover:text-brand">
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ icon: Icon, title, children, noMargin }: { icon: any; title: string; children: React.ReactNode; noMargin?: boolean }) {
  return (
    <section className={noMargin ? '' : 'mt-12'}>
      <h2 className="mb-5 flex items-center gap-2 font-display text-2xl font-semibold text-foreground">
        <Icon className="h-5 w-5 text-brand" /> {title}
      </h2>
      {children}
    </section>
  );
}

function MiniProductRow({ product }: { product: any }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition hover:border-brand/20"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
        {product.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-foreground group-hover:text-brand">{product.name}</h3>
        <p className="truncate text-xs text-muted-foreground">{product.tagline}</p>
      </div>
      {product.avg_rating > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {Number(product.avg_rating).toFixed(1)}
        </span>
      )}
    </Link>
  );
}
