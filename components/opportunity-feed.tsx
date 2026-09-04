'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { logActivity } from '@/lib/analytics';
import type { OpportunityFeedItem } from '@/lib/types';
import { NeedScoreDisplay } from '@/components/needscore-display';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Trophy, DollarSign, Users, TrendingUp, Target, Zap, ArrowRight,
  ExternalLink, Eye, Bookmark, X, Sparkles, Shield, Swords, Lightbulb,
  Crown, Rocket, Lock, ChevronRight, BarChart3, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';

export function OpportunityFeed({ limit = 12 }: { limit?: number }) {
  const { user, profile } = useAuth();
  const [opportunities, setOpportunities] = useState<OpportunityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    // Fetch dismissed need IDs
    const { data: dismissals } = await supabase
      .from('opportunity_dismissals')
      .select('need_id')
      .eq('user_id', user.id);
    const dismissedIds = new Set((dismissals ?? []).map((d: any) => d.need_id));
    setDismissed(dismissedIds);

    // Fetch the opportunity feed
    const { data, error: feedError } = await supabase.rpc('get_opportunity_feed', {
      builder_uuid: user.id,
      limit_count: limit,
    });

    if (feedError) {
      console.error('Opportunity feed error:', feedError);
      setError('Could not load opportunities right now. Please try again.');
      setOpportunities([]);
    } else {
      setOpportunities((data as OpportunityFeedItem[]) ?? []);
    }
    setLoading(false);
  }, [user, limit]);

  useEffect(() => { load(); }, [load]);

  async function dismiss(needId: string) {
    if (!user) return;
    setOpportunities((prev) => prev.filter((o) => o.need_id !== needId));
    setDismissed((prev) => new Set(prev).add(needId));
    const { error } = await supabase
      .from('opportunity_dismissals')
      .insert({ user_id: user.id, need_id: needId });
    if (error) toast.error('Could not dismiss');
  }

  async function iWillBuildThis(item: OpportunityFeedItem) {
    if (!user) return;
    await logActivity(user.id, 'committed_to_build', 'need', item.need_id, {
      need_title: item.title,
      need_score: item.need_score,
    });
    toast.success('Great! Redirecting you to the need so you can commit as a builder.');
    window.location.href = `/needs/${item.need_id}?action=commit`;
  }

  const isPro = profile?.pro_builder;

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-brand/20 bg-gradient-to-b from-brand/5 to-transparent p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/15">
          <Crown className="h-7 w-7" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground">Opportunity Feed is a Pro Builder feature</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Get a personalized feed of validated software opportunities ranked by NeedScore™, reward pools, growth rate, competition level, and your existing expertise.
        </p>
        <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link href="/pricing"><Rocket className="mr-2 h-4 w-4" /> Upgrade to Pro</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-10 text-center">
        <AlertCircle className="h-8 w-8 text-destructive/70" />
        <h3 className="font-display text-lg font-semibold text-foreground">Couldn&apos;t load opportunities</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button size="sm" variant="outline" onClick={load} className="mt-2">Try again</Button>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-white p-10 text-center">
        <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="font-display text-lg font-semibold text-foreground">No new opportunities right now</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t find open needs that match your expertise. Check back soon — new needs are posted every day.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/search?tab=needs"><Lightbulb className="mr-2 h-4 w-4" /> Browse all needs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{opportunities.length}</span> personalized opportunities
          {profile && <span> ranked for your expertise</span>}
        </p>
        <Button variant="ghost" size="sm" onClick={load} className="text-muted-foreground">
          <Zap className="mr-1 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {opportunities.map((item, i) => (
            <motion.div
              key={item.need_id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <OpportunityCard
                item={item}
                onDismiss={() => dismiss(item.need_id)}
                onBuild={() => iWillBuildThis(item)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OpportunityCard({
  item,
  onDismiss,
  onBuild,
}: {
  item: OpportunityFeedItem;
  onDismiss: () => void;
  onBuild: () => void;
}) {
  const competitionColor = {
    None: 'text-emerald-600 bg-emerald-50',
    Low: 'text-emerald-600 bg-emerald-50',
    Medium: 'text-amber-600 bg-amber-50',
    High: 'text-red-500 bg-red-50',
  }[item.competition_level];

  const growthPct = Math.round(item.growth_rate * 100);

  return (
    <div className="group flex flex-col rounded-2xl border border-border/60 bg-white p-5 shadow-card transition-all hover:border-brand/20 hover:shadow-card-hover">
      {/* Header: title + dismiss */}
      <div className="flex items-start justify-between gap-3">
        <Link href={`/needs/${item.need_id}`} className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-foreground group-hover:text-brand">
            {item.title}
          </h3>
          {item.category_name && (
            <span className="mt-0.5 inline-block text-xs text-muted-foreground">{item.category_name}</span>
          )}
        </Link>
        <button
          onClick={onDismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition hover:bg-muted hover:text-foreground"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {item.description}
      </p>

      {/* Key metrics */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">NeedScore™</span>
          <span className="font-display text-xl font-bold text-foreground">{Math.round(item.need_score)}</span>
        </div>
        {item.reward_amount > 0 && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-medium text-foreground">{formatNumber(Math.round(item.reward_amount))}</span>
            <span className="text-xs text-muted-foreground">reward</span>
          </div>
        )}
      </div>

      {/* Detail badges */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline" className="border-border/50 text-xs font-normal">
          <Users className="mr-1 h-3 w-3 text-brand" /> {formatNumber(item.vote_count)} votes
        </Badge>
        <Badge variant="outline" className={cn('border-0 text-xs font-normal', competitionColor)}>
          <Swords className="mr-1 h-3 w-3" /> {item.competition_level} competition
        </Badge>
        {growthPct > 0 && (
          <Badge variant="outline" className="border-border/50 text-xs font-normal text-emerald-600">
            <TrendingUp className="mr-1 h-3 w-3" /> +{growthPct}% this week
          </Badge>
        )}
        {item.builder_interest_count > 0 && (
          <Badge variant="outline" className="border-border/50 text-xs font-normal">
            <Target className="mr-1 h-3 w-3" /> {item.builder_interest_count} interested
          </Badge>
        )}
      </div>

      {/* Match reasons */}
      {item.match_reasons && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-brand/5 px-3 py-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
          <p className="text-xs leading-relaxed text-brand">{item.match_reasons}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-border/40 pt-4">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href={`/needs/${item.need_id}`}><Eye className="mr-1.5 h-3.5 w-3.5" /> View Need</Link>
        </Button>
        <Button onClick={onBuild} size="sm" className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90">
          <Rocket className="mr-1.5 h-3.5 w-3.5" /> I&apos;ll Build This
        </Button>
      </div>
    </div>
  );
}
