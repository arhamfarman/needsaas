'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { categoryIcon } from '@/lib/categories';
import { trackSearchEvent } from '@/lib/analytics';
import type { Category, Need, Product, NeedStatus, SearchResult } from '@/lib/types';
import { NeedCard } from '@/components/need-card';
import { ProductCard } from '@/components/product-card';
import { ProductImage } from '@/components/product-image';
import { VerifiedBadge } from '@/components/verified-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, Lightbulb, Package, TrendingUp, ArrowRight, X, DollarSign, Users, Star, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'needs' | 'products';
type Sort = 'top' | 'new' | 'reward';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Needs' },
  { value: 'open', label: 'Looking for Builder' },
  { value: 'committed', label: 'Builder Committed' },
  { value: 'building', label: 'In Progress' },
  { value: 'fulfilled', label: 'Software Available' },
];

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const categorySlug = params.get('category') ?? '';
  const tab = (params.get('tab') as Tab) ?? 'all';
  const sort = (params.get('sort') as Sort) ?? 'top';
  const status = params.get('status') ?? 'all';

  const [input, setInput] = useState(q);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  useEffect(() => { setInput(q); }, [q]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug) ?? null,
    [categories, categorySlug]
  );

  const loadResults = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);

    if (q.trim().length >= 2) {
      // Use FTS universal search
      const { data, error } = await supabase.rpc('universal_search', {
        search_term: q.trim(),
        limit_count: 60,
      });

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        const searchResults = (data as SearchResult[]) ?? [];

        // If category filter is active, filter results by category
        let filtered = searchResults;
        if (activeCategory) {
          // Fetch the product/need IDs that match the category
          const [prodIds, needIds] = await Promise.all([
            supabase.from('products').select('id').eq('category_id', activeCategory.id),
            supabase.from('needs').select('id').eq('category_id', activeCategory.id),
          ]);
          const prodIdSet = new Set((prodIds.data ?? []).map((r: any) => r.id));
          const needIdSet = new Set((needIds.data ?? []).map((r: any) => r.id));
          filtered = searchResults.filter((r) =>
            (r.result_type === 'product' && prodIdSet.has(r.result_id)) ||
            (r.result_type === 'need' && needIdSet.has(r.result_id)) ||
            r.result_type === 'builder' ||
            r.result_type === 'category'
          );
        }

        // Apply status filter to needs
        if (status !== 'all') {
          // Fetch need IDs matching status
          const { data: statusNeeds } = await supabase.from('needs').select('id').eq('status', status);
          const statusNeedSet = new Set((statusNeeds ?? []).map((r: any) => r.id));
          filtered = filtered.filter((r) =>
            r.result_type !== 'need' || statusNeedSet.has(r.result_id)
          );
        }

        setResults(filtered);

        // Load full product and need data for the results
        const productIds = filtered.filter((r) => r.result_type === 'product').map((r) => r.result_id);
        const needIds = filtered.filter((r) => r.result_type === 'need').map((r) => r.result_id);

        const [prodRes, needRes] = await Promise.all([
          productIds.length > 0
            ? supabase.from('products').select(`*, category:categories(*), profile:profiles(*)`).in('id', productIds)
            : Promise.resolve({ data: [] }),
          needIds.length > 0
            ? supabase.from('needs').select(`*, category:categories(*), profile:profiles(*)`).in('id', needIds)
            : Promise.resolve({ data: [] }),
        ]);

        let loadedProducts = (prodRes.data as Product[]) ?? [];
        let loadedNeeds = (needRes.data as Need[]) ?? [];

        // Sort
        if (sort === 'new') {
          loadedProducts = loadedProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          loadedNeeds = loadedNeeds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sort === 'reward') {
          loadedNeeds = loadedNeeds.sort((a, b) => b.reward_amount - a.reward_amount);
        } else {
          // Top: sort by FTS rank (already in results order)
          const prodRankMap = new Map(filtered.filter((r) => r.result_type === 'product').map((r) => [r.result_id, r.rank]));
          const needRankMap = new Map(filtered.filter((r) => r.result_type === 'need').map((r) => [r.result_id, r.rank]));
          loadedProducts = loadedProducts.sort((a, b) => (needRankMap.get(b.id) ?? 0) - (needRankMap.get(a.id) ?? 0));
          loadedProducts = loadedProducts.sort((a, b) => (prodRankMap.get(b.id) ?? 0) - (prodRankMap.get(a.id) ?? 0));
          loadedNeeds = loadedNeeds.sort((a, b) => (needRankMap.get(b.id) ?? 0) - (needRankMap.get(a.id) ?? 0));
        }

        setProducts(loadedProducts);
        setNeeds(loadedNeeds);

        // Track search event
        trackSearchEvent(q, filtered.length);
        
        if (filtered.length === 0) {
          router.push(`/dashboard?tab=needs&title=${encodeURIComponent(q.trim())}#post-a-need`);
          return;
        }
      }
    } else {
      // No query — load by category/sort without FTS
      const needQuery = supabase
        .from('needs')
        .select(`*, category:categories(*), profile:profiles(*)`)
        .neq('status', 'closed');
      const prodQuery = supabase
        .from('products')
        .select(`*, category:categories(*), profile:profiles(*)`)
        .eq('paid', true);

      if (activeCategory) {
        needQuery.eq('category_id', activeCategory.id);
        prodQuery.eq('category_id', activeCategory.id);
      }
      if (status !== 'all') {
        needQuery.eq('status', status);
      }

      if (sort === 'top') {
        needQuery.order('vote_count', { ascending: false }).order('created_at', { ascending: false });
        prodQuery.order('avg_rating', { ascending: false }).order('created_at', { ascending: false });
      } else if (sort === 'reward') {
        needQuery.order('reward_amount', { ascending: false }).order('vote_count', { ascending: false });
        prodQuery.order('avg_rating', { ascending: false }).order('created_at', { ascending: false });
      } else {
        needQuery.order('created_at', { ascending: false });
        prodQuery.order('created_at', { ascending: false });
      }

      const [n, p] = await Promise.all([needQuery.limit(60), prodQuery.limit(60)]);
      setNeeds((n.data as Need[]) ?? []);
      setProducts((p.data as Product[]) ?? []);
      setResults([]);
    }

    setLoading(false);
  }, [q, activeCategory, sort, status, router]);

  useEffect(() => { loadResults(); }, [loadResults]);

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === '') sp.delete(k);
      else sp.set(k, v);
    });
    router.replace(`/search?${sp.toString()}`);
  }

  const showNeeds = tab === 'all' || tab === 'needs';
  const showProducts = tab === 'all' || tab === 'products';
  const builderResults = results.filter((r) => r.result_type === 'builder');
  const categoryResults = results.filter((r) => r.result_type === 'category');
  const hasAnyResults = products.length > 0 || needs.length > 0 || builderResults.length > 0 || categoryResults.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Explore the marketplace
        </h1>
        <p className="text-muted-foreground">
          Find software that already exists. If it doesn&apos;t, help make it exist.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') update({ q: input.trim() || null }); }}
            placeholder="Search software, needs, builders..."
            className="h-11 rounded-xl pl-10 pr-9"
          />
          {input && (
            <button
              onClick={() => { setInput(''); update({ q: null }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button className="h-11 rounded-xl" onClick={() => update({ q: input.trim() || null })}>
          <SearchIcon className="mr-2 h-4 w-4" /> Search
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <CategoryChip active={!categorySlug} onClick={() => update({ category: null })} label="All" icon={SearchIcon} />
        {categories.map((c) => {
          const Icon = categoryIcon(c.icon);
          return (
            <CategoryChip key={c.id} active={categorySlug === c.slug} onClick={() => update({ category: c.slug })} label={c.name} icon={Icon} />
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1">
          {([
            { k: 'all', label: 'All', icon: SearchIcon },
            { k: 'needs', label: 'Needs', icon: Lightbulb },
            { k: 'products', label: 'Software', icon: Package },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => update({ tab: t.k === 'all' ? null : t.k })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
                tab === t.k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {([
            { v: 'top', label: 'Most Wanted', icon: TrendingUp },
            { v: 'reward', label: 'High Reward', icon: DollarSign },
            { v: 'new', label: 'Newest', icon: SearchIcon },
          ] as const).map((s) => (
            <SortBtn key={s.v} active={sort === s.v} onClick={() => update({ sort: s.v })}>
              <s.icon className="h-3.5 w-3.5" /> {s.label}
            </SortBtn>
          ))}
        </div>
      </div>

      {showNeeds && (
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => update({ status: f.value === 'all' ? null : f.value })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition',
                (status === 'all' && f.value === 'all') || status === f.value
                  ? 'border-brand/40 bg-brand/10 text-brand'
                  : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-12">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : !hasAnyResults && hasSearched ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Lightbulb className="h-7 w-7" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">
              We couldn&apos;t find software matching your search.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Post your Need for free and inspire someone to build it.
            </p>
            <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href="/dashboard?tab=needs">
                <Sparkles className="mr-2 h-4 w-4" /> Post your need — it&apos;s free
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Builder results (FTS only) */}
            {tab === 'all' && builderResults.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
                  <Users className="h-5 w-5 text-sky-600" /> Builders
                  <span className="text-sm font-normal text-muted-foreground">{builderResults.length}</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {builderResults.map((b, i) => (
                    <motion.div key={b.result_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Link href={b.href} className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-4 transition hover:border-border hover:shadow-card">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                            {b.title.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-foreground">{b.title}</p>
                            {b.is_verified && <VerifiedBadge />}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{b.subtitle ?? 'Builder'}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Category results */}
            {tab === 'all' && categoryResults.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
                  <SearchIcon className="h-5 w-5 text-muted-foreground" /> Categories
                  <span className="text-sm font-normal text-muted-foreground">{categoryResults.length}</span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  {categoryResults.map((c) => (
                    <Link key={c.result_id} href={c.href} className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm font-medium transition hover:border-border hover:shadow-card">
                      {c.title}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {showProducts && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                    <Package className="h-5 w-5 text-emerald-500" /> Software
                    {!loading && <span className="text-sm font-normal text-muted-foreground">{products.length}</span>}
                  </h2>
                </div>
                {products.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((p, i) => (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <ProductCard product={p} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  !q.trim() && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-white px-6 py-12 text-center">
                      <Package className="mb-3 h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No software found in this category yet.</p>
                    </div>
                  )
                )}
              </section>
            )}

            {showNeeds && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                    <Lightbulb className="h-5 w-5 text-brand" /> Needs
                    {!loading && <span className="text-sm font-normal text-muted-foreground">{needs.length}</span>}
                  </h2>
                </div>
                {needs.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {needs.map((n, i) => (
                      <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <NeedCard need={n} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  !q.trim() && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-white px-6 py-12 text-center">
                      <Lightbulb className="mb-3 h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No needs found in this category yet.</p>
                    </div>
                  )
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CategoryChip({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: typeof SearchIcon }) {
  return (
    <button onClick={onClick} className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
      active ? 'border-brand/40 bg-brand/10 text-brand' : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:text-foreground'
    )}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function SortBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
      active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
    )}>
      {children}
    </button>
  );
}
