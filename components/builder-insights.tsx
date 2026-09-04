'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Need } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, DollarSign, Lightbulb, Bookmark, Zap, Trophy, ArrowRight,
  Crown, Rocket, AlertCircle,
} from 'lucide-react';
import { getNeedScoreLevel, getNeedScoreColor } from '@/lib/needscore';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

type InsightTab = 'growing' | 'needscore' | 'reward' | 'newest' | 'bookmarked';

export function BuilderInsights() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<InsightTab>('growing');
  const [needs, setNeeds] = useState<Need[]>([]);
  const [searchTerms, setSearchTerms] = useState<{ query: string; count: number }[]>([]);
  const [zeroSearches, setZeroSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('needs')
      .select(`*, category:categories(*), profile:profiles(*)`)
      .neq('status', 'closed');

    if (tab === 'growing') {
      // Fastest growing: highest vote_count with recent creation
      query = query.order('vote_count', { ascending: false }).order('created_at', { ascending: false }).limit(8);
    } else if (tab === 'needscore') {
      // Highest NeedScore
      query = query.order('need_score', { ascending: false }).limit(8);
    } else if (tab === 'reward') {
      // Highest reward pools
      query = query.order('reward_amount', { ascending: false }).limit(8);
    } else if (tab === 'newest') {
      // Newest opportunities (open status only)
      query = query.eq('status', 'open').order('created_at', { ascending: false }).limit(8);
    } else if (tab === 'bookmarked') {
      // Most bookmarked
      query = query.order('bookmark_count', { ascending: false }).limit(8);
    }

    const { data, error: needsError } = await query;
    if (needsError) {
      setError('Could not load insights right now. Please try again.');
      setNeeds([]);
      setLoading(false);
      return;
    }
    setNeeds((data as Need[]) ?? []);

    // Search analytics (only for pro builders)
    if (profile?.pro_builder) {
      const { data: searchEvents, error: searchError } = await supabase
        .from('search_events')
        .select('query, result_count')
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      // Search-demand analytics are a bonus on top of the needs list above;
      // a failure here shouldn't blank out insights that already loaded fine.
      if (!searchError && searchEvents && searchEvents.length > 0) {
        const termMap = new Map<string, number>();
        const zeroSet = new Set<string>();
        searchEvents.forEach((e) => {
          const q = (e as any).query as string;
          if (q) {
            termMap.set(q, (termMap.get(q) ?? 0) + 1);
            if ((e as any).result_count === 0) zeroSet.add(q);
          }
        });
        setSearchTerms(Array.from(termMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([query, count]) => ({ query, count })));
        setZeroSearches(Array.from(zeroSet).slice(0, 5));
      }
    }

    setLoading(false);
  }, [tab, profile?.pro_builder]);

  useEffect(() => { load(); }, [load]);

  const isPro = profile?.pro_builder;

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-brand/20 bg-gradient-to-b from-brand/5 to-transparent p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/15">
          <Crown className="h-7 w-7" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground">Builder Insights is a Pro Builder feature</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          See which needs are growing fastest, which have the biggest reward pools, and — with real search-demand
          data — what people are searching for that doesn&apos;t exist yet.
        </p>
        <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link href="/pricing"><Rocket className="mr-2 h-4 w-4" /> Upgrade to Pro</Link>
        </Button>
      </div>
    );
  }

  const tabs: { key: InsightTab; label: string; icon: typeof TrendingUp }[] = [
    { key: 'growing', label: 'Fastest Growing', icon: TrendingUp },
    { key: 'needscore', label: 'Highest NeedScore', icon: Trophy },
    { key: 'reward', label: 'Top Rewards', icon: DollarSign },
    { key: 'newest', label: 'Newest', icon: Zap },
    { key: 'bookmarked', label: 'Most Bookmarked', icon: Bookmark },
  ];

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition',
              tab === t.key
                ? 'border-brand/40 bg-brand/10 text-brand'
                : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:text-foreground'
            )}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Needs list */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-4 py-8 text-center">
          <AlertCircle className="h-6 w-6 text-destructive/70" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={load}>Try again</Button>
        </div>
      ) : needs.length > 0 ? (
        <div className="space-y-2">
          {needs.map((n) => (
            <Link
              key={n.id}
              href={`/needs/${n.id}`}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-white p-3 transition hover:border-border hover:shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatNumber(n.vote_count)} votes</span>
                  {n.reward_amount > 0 && <span className="text-emerald-600">${formatNumber(Math.round(n.reward_amount))}</span>}
                  <span className={cn('font-medium', getNeedScoreColor(n.need_score))}>
                    {getNeedScoreLevel(n.need_score)}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          No needs in this category yet.
        </p>
      )}

      {/* Search analytics (Pro only) */}
      {profile?.pro_builder && (searchTerms.length > 0 || zeroSearches.length > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {searchTerms.length > 0 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="h-3.5 w-3.5 text-brand" /> Most Searched Keywords (7d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchTerms.map((s) => (
                    <div key={s.query} className="flex items-center justify-between text-sm">
                      <span className="truncate text-foreground">&ldquo;{s.query}&rdquo;</span>
                      <span className="ml-2 shrink-0 font-medium text-muted-foreground">{s.count} searches</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {zeroSearches.length > 0 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm"><Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Zero-Result Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {zeroSearches.map((q) => (
                    <div key={q} className="flex items-center gap-2 text-sm">
                      <span className="truncate text-foreground">&ldquo;{q}&rdquo;</span>
                      <Link href="/dashboard?tab=needs" className="ml-auto shrink-0 text-xs text-brand hover:underline">Build it</Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
