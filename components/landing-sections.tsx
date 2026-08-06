'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { Product, Need, Category, Profile, Review } from '@/lib/types';
import { HeroSearch } from '@/components/hero-search';
import { ProductCard } from '@/components/product-card';
import { NeedCard } from '@/components/need-card';
import { ProductImage } from '@/components/product-image';
import { categoryIcon } from '@/lib/categories';
import { formatNumber } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowRight, Sparkles, TrendingUp, Package, Lightbulb,
  Star, ArrowDown, Users, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const HERO_MESSAGES = ['Find software for your needs.', 'Or inspire someone to build it.'];

export function LandingHero() {
  const [text, setText] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const currentText = HERO_MESSAGES[msgIdx];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (text.length < currentText.length) {
        timer = setTimeout(() => setText(currentText.slice(0, text.length + 1)), 50);
      } else {
        timer = setTimeout(() => setPhase('pausing'), 1800);
      }
    } else if (phase === 'pausing') {
      timer = setTimeout(() => setPhase('deleting'), 400);
    } else {
      if (text.length > 0) {
        timer = setTimeout(() => setText(currentText.slice(0, text.length - 1)), 25);
      } else {
        timer = setTimeout(() => {
          setMsgIdx((i) => (i + 1) % HERO_MESSAGES.length);
          setPhase('typing');
        }, 200);
      }
    }

    timersRef.current.push(timer);
    return () => clearTimeout(timer);
  }, [text, phase, msgIdx]);

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Mesh gradient background — very subtle */}
      <div className="absolute inset-0 -z-10 mesh-gradient" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/5 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-40 -z-10 h-[300px] w-[400px] rounded-full bg-purple-500/4 blur-[120px]" />

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pb-24 lg:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          Where software demand meets software builders
        </motion.div>

        <div className="min-h-[4rem] text-center sm:min-h-[6rem] lg:min-h-[7rem]">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            {text}
            <span className="ml-0.5 inline-block h-[0.8em] w-[3px] animate-pulse bg-brand align-middle" />
          </motion.h1>
        </div>

        <motion.p
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="show"
          className="mx-auto mt-6 max-w-2xl text-balance text-center text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Find software that already exists. If it doesn&apos;t, post your need and help make it happen. Builders create products for everyone — your contribution helps encourage them.
        </motion.p>

        {/* Hero Search */}
        <motion.div
          variants={fadeUp}
          custom={4}
          initial="hidden"
          animate="show"
          className="mt-10"
        >
          <HeroSearch />
        </motion.div>

        {/* Two journeys */}
        <motion.div
          variants={fadeUp}
          custom={5}
          initial="hidden"
          animate="show"
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg" className="group h-11 rounded-xl bg-brand px-6 text-sm text-brand-foreground shadow-soft hover:bg-brand/90">
            <Link href="/dashboard?tab=needs">
              I&apos;m looking for software
              <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="group h-11 rounded-xl px-6 text-sm shadow-soft">
            <Link href="/dashboard?tab=products">
              I&apos;m a builder
              <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-14 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs uppercase tracking-widest">Discover what&apos;s trending</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          >
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingContent() {
  const [trendingNeeds, setTrendingNeeds] = useState<Need[]>([]);
  const [newestSoftware, setNewestSoftware] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [highestReward, setHighestReward] = useState<Need[]>([]);
  const [beingBuilt, setBeingBuilt] = useState<Need[]>([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState<Need[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [builders, setBuilders] = useState<(Profile & { product_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [needs, newest, rated, highReward, building, completed, cats, builderProds] = await Promise.all([
        supabase.from('needs').select(`*, category:categories(*)`).order('vote_count', { ascending: false }).limit(6),
        supabase.from('products').select(`*, category:categories(*)`).eq('paid', true).order('created_at', { ascending: false }).limit(6),
        supabase.from('products').select(`*, category:categories(*)`).eq('paid', true).order('avg_rating', { ascending: false }).limit(6),
        supabase.from('needs').select(`*, category:categories(*)`).order('reward_amount', { ascending: false }).limit(6),
        supabase.from('needs').select(`*, category:categories(*)`).in('status', ['committed', 'building']).order('updated_at', { ascending: false }).limit(6),
        supabase.from('needs').select(`*, category:categories(*)`).eq('status', 'fulfilled').order('updated_at', { ascending: false }).limit(6),
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('owner_id').eq('paid', true),
      ]);

      setTrendingNeeds((needs.data as Need[]) ?? []);
      setNewestSoftware((newest.data as Product[]) ?? []);
      setTopRated((rated.data as Product[]) ?? []);
      setHighestReward((highReward.data as Need[]) ?? []);
      setBeingBuilt((building.data as Need[]) ?? []);
      setRecentlyCompleted((completed.data as Need[]) ?? []);
      setCategories((cats.data as Category[]) ?? []);

      const ownerCounts = new Map<string, number>();
      (builderProds.data ?? []).forEach((p: any) => {
        ownerCounts.set(p.owner_id, (ownerCounts.get(p.owner_id) ?? 0) + 1);
      });
      const topOwnerIds = Array.from(ownerCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map((entry) => entry[0]);
      if (topOwnerIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', topOwnerIds);
        const enriched = (profiles ?? []).map((p: any) => ({ ...p, product_count: ownerCounts.get(p.id) ?? 0 }));
        setBuilders(enriched as (Profile & { product_count: number })[]);
      }

      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Highest Reward Needs */}
      {!loading && highestReward.length > 0 && (
        <Section
          icon={Sparkles}
          iconClass="text-amber-500"
          title="Highest Reward Needs"
          subtitle="Biggest build reward pools the community is funding"
          href="/search?tab=needs&sort=reward"
          hrefLabel="View all needs"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highestReward.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <NeedCard need={n} />
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Currently Being Built */}
      {!loading && beingBuilt.length > 0 && (
        <Section
          icon={Package}
          iconClass="text-violet-500"
          title="Currently Being Built"
          subtitle="Builders are working on these right now"
          href="/search?tab=needs&status=building"
          hrefLabel="View all"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {beingBuilt.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <NeedCard need={n} />
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Recently Completed */}
      {!loading && recentlyCompleted.length > 0 && (
        <Section
          icon={Lightbulb}
          iconClass="text-emerald-500"
          title="Recently Completed"
          subtitle="Needs where software is now available"
          href="/search?tab=needs&status=fulfilled"
          hrefLabel="View all"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyCompleted.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <NeedCard need={n} />
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Trending Needs */}
      {!loading && trendingNeeds.length > 0 && (
        <Section
          icon={TrendingUp}
          iconClass="text-brand"
          title="Trending Needs"
          subtitle="What people are looking for right now"
          href="/search?tab=needs"
          hrefLabel="View all needs"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trendingNeeds.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <NeedCard need={n} />
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Newest Software */}
      {!loading && newestSoftware.length > 0 && (
        <Section
          icon={Package}
          iconClass="text-emerald-500"
          title="Newest Software"
          subtitle="Fresh tools builders just shipped"
          href="/search?tab=products"
          hrefLabel="View all software"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newestSoftware.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Highest Rated Software */}
      {!loading && topRated.length > 0 && (
        <Section
          icon={Star}
          iconClass="text-amber-500"
          title="Highest Rated Software"
          subtitle="Top-rated by the community"
          href="/search?tab=products&sort=top"
          hrefLabel="Browse all"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topRated.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Popular Categories */}
      {!loading && categories.length > 0 && (
        <Section
          icon={Sparkles}
          iconClass="text-brand"
          title="Popular Categories"
          subtitle="Browse by what you're building or looking for"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 12).map((c, i) => {
              const Icon = categoryIcon(c.icon);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                >
                  <Link
                    href={`/search?category=${c.slug}`}
                    className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-4 text-center shadow-soft transition-all hover:border-border hover:bg-card hover:shadow-soft-lg"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15 transition group-hover:scale-110 group-hover:bg-brand/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-brand">{c.name}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Featured Builders */}
      {!loading && builders.length > 0 && (
        <Section
          icon={Users}
          iconClass="text-emerald-500"
          title="Featured Builders"
          subtitle="Creators shipping real software"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {builders.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Link
                  href={`/builders/${b.id}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-5 text-center shadow-soft transition-all hover:border-border hover:bg-card hover:shadow-soft-lg"
                >
                  <Avatar className="h-14 w-14 ring-2 ring-border/60 transition group-hover:ring-brand/30">
                    <AvatarFallback className="bg-gradient-to-br from-brand/20 to-brand/5 text-sm font-semibold text-brand">
                      {(b.username ?? b.full_name ?? 'B').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-brand">
                      {b.full_name ?? `@${b.username}`}
                    </p>
                    <p className="text-xs text-muted-foreground">@{b.username}</p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Package className="h-3 w-3" />
                    {b.product_count} {b.product_count === 1 ? 'listing' : 'listings'}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {loading && (
        <div className="space-y-12 py-20">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/40" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-muted/30" />
            ))}
          </div>
        </div>
      )}

      {/* Final CTA */}
      <div className="py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card p-10 text-center shadow-soft sm:p-16">
          <div className="absolute inset-0 -z-10 mesh-gradient-soft" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/5 blur-[100px]" />
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Find the software you need. Or inspire someone to build it.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Join the community where demand meets builders.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl bg-brand px-6 text-base text-brand-foreground shadow-soft hover:bg-brand/90">
              <Link href="/signin?tab=signup">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 text-base shadow-soft">
              <Link href="/search">Explore software</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  href,
  hrefLabel,
  children,
}: {
  icon: typeof TrendingUp;
  iconClass: string;
  title: string;
  subtitle: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-12 sm:py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50', iconClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {href && hrefLabel && (
          <Button asChild variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-foreground">
            <Link href={href}>
              {hrefLabel}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}
