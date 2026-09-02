'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Need, Product, NeedProductLink, Contribution, BuilderInterest, NeedStatus } from '@/lib/types';
import { ProductRowMini } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowUp, ArrowLeft, Share2, Lightbulb, Package, ChevronUp,
  DollarSign, Users, Hammer, Calendar, Check, Loader2, Info,
  Sparkles, TrendingUp,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { NeedScoreDisplay } from '@/components/needscore-display';
import { AttachProductDialog } from '@/components/forms/attach-product-dialog';

const STATUS_CONFIG: Record<NeedStatus, { label: string; color: string; dot: string }> = {
  open:       { label: 'Looking for Builder', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  committed:  { label: 'Builder Committed',   color: 'bg-sky-50 text-sky-700 border-sky-200',     dot: 'bg-sky-400' },
  building:   { label: 'In Progress',          color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-400' },
  fulfilled:  { label: 'Software Available',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  closed:     { label: 'Archived',             color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-300' },
};

const TIMELINE_LABELS: Record<string, string> = {
  '30_days': '30 Days',
  '60_days': '60 Days',
  '90_days': '90 Days',
  'flexible': 'Flexible',
};

const STAGES: NeedStatus[] = ['open', 'committed', 'building', 'fulfilled'];

function getDemandLevel(votes: number, reward: number): { label: string; className: string } {
  const score = votes + reward / 10;
  if (score >= 100) return { label: 'High Demand', className: 'text-emerald-600' };
  if (score >= 30)  return { label: 'Growing Demand', className: 'text-amber-600' };
  return { label: 'Early Stage', className: 'text-muted-foreground' };
}

export function NeedDetailView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [need, setNeed] = useState<Need | null>(null);
  const [links, setLinks] = useState<NeedProductLink[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [interest, setInterest] = useState<BuilderInterest[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votePending, setVotePending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Contribution UI state
  const [showContribute, setShowContribute] = useState(false);
  const [contribAmount, setContribAmount] = useState<number | null>(25);
  const [contribCustom, setContribCustom] = useState('');
  const [contribPending, setContribPending] = useState(false);

  // Builder interest state
  const [myInterest, setMyInterest] = useState<'interested' | 'committed' | null>(null);
  const [interestPending, setInterestPending] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('needs')
      .select(`*, category:categories(*), profile:profiles(*)`)
      .eq('id', id)
      .maybeSingle();
    if (!data) { setLoading(false); return; }
    setNeed(data as Need);

    const [linksRes, contribsRes, interestRes] = await Promise.all([
      supabase.from('need_product_links')
        .select(`*, product:products(*, category:categories(*), profile:profiles(*))`)
        .eq('need_id', id).order('created_at', { ascending: false }),
      supabase.from('contributions')
        .select(`*, profile:profiles(*)`)
        .eq('need_id', id).order('created_at', { ascending: false }),
      supabase.from('builder_interest')
        .select(`*, profile:profiles(*)`)
        .eq('need_id', id).order('created_at', { ascending: false }),
    ]);

    setLinks((linksRes.data as NeedProductLink[]) ?? []);
    setContributions((contribsRes.data as Contribution[]) ?? []);
    setInterest((interestRes.data as BuilderInterest[]) ?? []);

    if (user) {
      const [voteRes, myIntRes] = await Promise.all([
        supabase.from('votes').select('id').eq('need_id', id).eq('user_id', user.id).maybeSingle(),
        supabase.from('builder_interest').select('type').eq('need_id', id).eq('builder_id', user.id).maybeSingle(),
      ]);
      setHasVoted(!!voteRes.data);
      if (myIntRes.data) setMyInterest((myIntRes.data as any).type);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  async function toggleVote() {
    if (!user) { router.push('/signin'); return; }
    if (!need) return;
    setVotePending(true);
    if (hasVoted) {
      const { error } = await supabase.from('votes').delete().eq('need_id', need.id).eq('user_id', user.id);
      if (!error) { setHasVoted(false); setNeed({ ...need, vote_count: need.vote_count - 1 }); toast.success('Vote removed'); }
    } else {
      const { error } = await supabase.from('votes').insert({ need_id: need.id, user_id: user.id });
      if (!error) { setHasVoted(true); setNeed({ ...need, vote_count: need.vote_count + 1 }); toast.success('Voted!'); }
      else if (error.code === '23505') toast.error('You already voted on this need');
      else toast.error(error.message);
    }
    setVotePending(false);
  }

  async function submitContribution() {
    if (!user) { router.push('/signin'); return; }
    if (!need) return;
    const amt = contribAmount ?? (contribCustom ? parseFloat(contribCustom) : null);
    if (!amt || amt < 1) { toast.error('Please enter an amount of at least $1'); return; }
    setContribPending(true);
    const { error } = await supabase.from('contributions').insert({
      need_id: need.id,
      amount: amt,
    });
    setContribPending(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Thanks for contributing $${amt} to the Build Reward!`);
    setShowContribute(false);
    setContribAmount(25); setContribCustom('');
    load();
  }

  async function expressInterest(type: 'interested' | 'committed') {
    if (!user) { router.push('/signin'); return; }
    if (!need) return;
    setInterestPending(true);

    if (myInterest) {
      // Update existing
      const { error } = await supabase.from('builder_interest')
        .update({ type }).eq('need_id', need.id).eq('builder_id', user.id);
      if (error) { setInterestPending(false); toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('builder_interest').insert({
        need_id: need.id,
        builder_id: user.id,
        type,
      });
      if (error) { setInterestPending(false); toast.error(error.message); return; }
    }

    // If committing, update need status + builder_committed_id
    if (type === 'committed') {
      await supabase.from('needs').update({
        status: 'committed',
        builder_committed_id: user.id,
        committed_at: new Date().toISOString(),
      }).eq('id', need.id);
      toast.success("You've committed to building this!");
    } else {
      // If was committed and switching back to interested, revert status
      if (myInterest === 'committed') {
        await supabase.from('needs').update({
          status: 'open',
          builder_committed_id: null,
          committed_at: null,
        }).eq('id', need.id);
      }
      toast.success("You're now marked as interested!");
    }

    setMyInterest(type);
    setInterestPending(false);
    load();
  }

  async function startBuilding() {
    if (!need || !user) return;
    const { error } = await supabase.from('needs').update({
      status: 'building',
    }).eq('id', need.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Development started!');
    load();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-5 w-20" />
        <Skeleton className="mb-4 h-10 w-3/4" />
        <Skeleton className="mb-8 h-24 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!need) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">Need not found</h1>
        <p className="mt-2 text-muted-foreground">This need may have been removed.</p>
        <Button asChild className="mt-6"><Link href="/search">Back to search</Link></Button>
      </div>
    );
  }

  const status = STATUS_CONFIG[need.status] ?? STATUS_CONFIG.open;
  const demand = getDemandLevel(need.vote_count, need.reward_amount);
  const matchingProducts = links.map((l) => l.product).filter(Boolean) as Product[];
  const committedBuilder = interest.find((i) => i.type === 'committed');
  const interestedBuilders = interest.filter((i) => i.type === 'interested');
  const currentStageIdx = STAGES.indexOf(need.status);
  const isOwner = user?.id === need.owner_id;
  const isCommittedBuilder = user?.id === need.builder_committed_id;
  const hasReward = need.reward_amount > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link href="/search" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to explore
      </Link>

      {/* Status Timeline */}
      <div className="mb-8 rounded-2xl border border-border/60 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-1">
          {STAGES.map((stage, idx) => {
            const cfg = STATUS_CONFIG[stage];
            const isComplete = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            const isFuture = idx > currentStageIdx;
            return (
              <div key={stage} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition',
                    isComplete && 'border-emerald-500 bg-emerald-500 text-white',
                    isCurrent && 'border-brand bg-brand text-white',
                    isFuture  && 'border-border bg-muted/30 text-muted-foreground/50'
                  )}>
                    {isComplete ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <span className={cn(
                    'hidden text-center text-[11px] font-medium sm:block',
                    isCurrent ? 'text-foreground' : isFuture ? 'text-muted-foreground/50' : 'text-muted-foreground'
                  )}>
                    {cfg.label}
                  </span>
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={cn(
                    'mx-1 h-0.5 flex-1 rounded-full transition sm:mx-2',
                    isComplete ? 'bg-emerald-500' : 'bg-border'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Status badge + category */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', status.color)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
            {status.label}
          </span>
          {need.category && (
            <Link href={`/software/${need.category.slug}`}>
              <Badge variant="outline" className="border-border/60 text-muted-foreground hover:border-brand hover:text-brand">{need.category.name}</Badge>
            </Link>
          )}
          {need.timeline && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> {TIMELINE_LABELS[need.timeline] ?? need.timeline}
            </span>
          )}
        </div>

        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {need.title}
        </h1>

        <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
          {need.description}
        </p>

        {need.reward_note && (
          <div className="mt-4 rounded-lg bg-muted/30 p-3 text-sm italic text-muted-foreground">
            &ldquo;{need.reward_note}&rdquo;
          </div>
        )}

        {/* Meta */}
        <div className="mt-6 flex items-center gap-3">
          <Link href={`/builders/${need.owner_id}`} className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                {(need.profile?.username ?? 'U').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hover:text-foreground">
              @{need.profile?.username ?? 'anonymous'}
            </span>
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-sm text-muted-foreground">{formatDate(need.created_at)}</span>
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={ArrowUp} label="Votes" value={formatNumber(need.vote_count)} />
          <StatBox icon={DollarSign} label="Reward" value={hasReward ? `$${formatNumber(Math.round(need.reward_amount))}` : '—'} />
          <StatBox icon={Users} label="Contributors" value={String(need.contributor_count)} />
          <StatBox icon={Hammer} label="Builders" value={String(interest.length)} />
        </div>

        {/* NeedScore */}
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NeedScore™</span>
          <NeedScoreDisplay need={need} isPro={profile?.pro_builder} />
        </div>
      </motion.div>

      {/* Action bar */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button
          onClick={toggleVote}
          disabled={votePending}
          variant={hasVoted ? 'default' : 'outline'}
          className={cn('h-11 rounded-xl px-5', hasVoted ? 'bg-brand text-brand-foreground hover:bg-brand/90' : '')}
        >
          <ChevronUp className="mr-1.5 h-4 w-4" />
          {hasVoted ? 'Voted' : 'Upvote'}
          <span className="ml-2 rounded-md bg-black/20 px-1.5 py-0.5 text-sm font-semibold">{need.vote_count}</span>
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-xl px-4"
          onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }}
        >
          <Share2 className="mr-1.5 h-4 w-4" /> Share
        </Button>
        <Button
          variant="outline"
          className={cn('h-11 rounded-xl px-4', hasReward && 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-50')}
          onClick={() => setShowContribute((v) => !v)}
        >
          <DollarSign className="mr-1.5 h-4 w-4" /> Contribute to Reward
        </Button>
      </div>

      {/* Contribution panel */}
      {showContribute && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 overflow-hidden">
          <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-card">
            <h3 className="font-display text-lg font-semibold">Contribute to the Build Reward</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The Build Reward is a shared pool. Multiple users can contribute to encourage a builder to take this on.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[10, 25, 50, 100, 250].map((a) => (
                <button
                  key={a}
                  onClick={() => { setContribAmount(a); setContribCustom(''); }}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                    contribAmount === a && !contribCustom
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  ${a}
                </button>
              ))}
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="1"
                  value={contribCustom}
                  onChange={(e) => { setContribCustom(e.target.value); setContribAmount(null); }}
                  placeholder="Custom"
                  className="w-24 pl-6"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={submitContribution} disabled={contribPending} className="bg-brand text-brand-foreground hover:bg-brand/90">
                {contribPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
                Contribute
              </Button>
              <Button variant="ghost" onClick={() => setShowContribute(false)}>Cancel</Button>
            </div>

            <div className="mt-4 flex gap-2.5 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-700">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Builders own the software they create.</p>
                <p className="mt-1 text-blue-600/80">
                  Your contribution helps encourage someone to build it. If the software launches, contributors receive access according to the builder&apos;s offering.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Builder committed banner */}
      {committedBuilder && (
        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-sky-100 text-xs font-semibold text-sky-700">
                {(committedBuilder.profile?.username ?? 'B').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-sky-900">
                <Check className="h-4 w-4" /> Builder committed
              </p>
              <p className="text-xs text-sky-700">
                <Link href={`/builders/${committedBuilder.builder_id}`} className="font-medium hover:underline">
                  @{committedBuilder.profile?.username ?? 'builder'}
                </Link> will own the software if completed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Builder experience */}
      {!isOwner && need.status !== 'fulfilled' && need.status !== 'closed' && (
        <div className="mt-6 rounded-2xl border border-border/60 bg-white p-5 shadow-card">
          <h3 className="font-display text-lg font-semibold">Are you a builder?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            See an opportunity? Express interest or commit to building it. Builders own the software they create.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={interestPending || myInterest === 'interested'}
              onClick={() => expressInterest('interested')}
              className={cn(myInterest === 'interested' && 'border-brand text-brand')}
            >
              <Hammer className="mr-2 h-4 w-4" />
              {myInterest === 'interested' ? "You're interested" : "I'm Interested"}
            </Button>
            <Button
              disabled={interestPending || myInterest === 'committed'}
              onClick={() => expressInterest('committed')}
              className={cn('bg-brand text-brand-foreground hover:bg-brand/90', myInterest === 'committed' && 'opacity-60')}
            >
              {myInterest === 'committed' ? <Check className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {myInterest === 'committed' ? "You've committed" : "I'll Build This"}
            </Button>
          </div>

          {/* If committed builder, show start building button */}
          {isCommittedBuilder && need.status === 'committed' && (
            <div className="mt-4 border-t border-border/60 pt-4">
              <Button onClick={startBuilding} variant="outline" className="border-violet-300 text-violet-600 hover:bg-violet-50">
                <Package className="mr-2 h-4 w-4" /> Start Development
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">This will mark the need as &ldquo;In Progress&rdquo;.</p>
            </div>
          )}
        </div>
      )}

      {/* Interested builders list */}
      {interestedBuilders.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground">
            <Hammer className="h-4 w-4" /> {interestedBuilders.length} builder{interestedBuilders.length !== 1 ? 's' : ''} interested
          </h3>
          <div className="flex flex-wrap gap-2">
            {interestedBuilders.map((b) => (
              <Link key={b.id} href={`/builders/${b.builder_id}`} className="flex items-center gap-2 rounded-lg border border-border/60 bg-white px-3 py-1.5 text-sm transition hover:border-border hover:shadow-card">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-muted text-[9px] font-semibold text-muted-foreground">
                    {(b.profile?.username ?? 'B').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground hover:text-foreground">@{b.profile?.username ?? 'builder'}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Contributors */}
      {hasReward && contributions.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground">
            <Users className="h-4 w-4" /> Build Reward Contributors
          </h3>
          <div className="space-y-2">
            {contributions.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-white p-3">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                    {(c.profile?.username ?? 'U').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">@{c.profile?.username ?? 'anonymous'}</span>
                <span className="ml-auto text-sm font-semibold text-emerald-600">${formatNumber(Math.round(c.amount))}</span>
                <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching software */}
      <section className="mt-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Package className="h-5 w-5 text-emerald-500" /> Matching Software
            {matchingProducts.length > 0 && <span className="text-sm font-normal text-muted-foreground">{matchingProducts.length}</span>}
          </h2>
          {user && <AttachProductDialog need={need} />}
        </div>

        {matchingProducts.length > 0 ? (
          <>
            {/* Solution available banner */}
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">A solution is now available.</p>
                  <p className="text-sm text-emerald-700">Your requested software exists. Check it out below.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {matchingProducts.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ProductRowMini product={p} />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-white px-6 py-10 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-semibold">No matching software yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              No builder has attached a solution to this need yet. If you&apos;ve built something that fits, attach it.
            </p>
            {user ? (
              <div className="mt-4">
                <AttachProductDialog need={need} />
              </div>
            ) : (
              <Button asChild size="sm" variant="outline" className="mt-4">
                <Link href="/signin">Sign in to attach a product</Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: typeof ArrowUp; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-white p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 font-display text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
