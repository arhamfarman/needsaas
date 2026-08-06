import Link from 'next/link';
import { formatDate, formatNumber } from '@/lib/format';
import type { Need, NeedStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUp, DollarSign, Users, Hammer, TrendingUp, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNeedScoreLevel, getNeedScoreColor } from '@/lib/needscore';

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

function getDemandLevel(votes: number, reward: number): { label: string; className: string } {
  const score = votes + reward / 10;
  if (score >= 100) return { label: 'High Demand', className: 'text-emerald-600' };
  if (score >= 30)  return { label: 'Growing Demand', className: 'text-amber-600' };
  return { label: 'Early Stage', className: 'text-muted-foreground' };
}

export function NeedCard({ need }: { need: Need }) {
  const status = STATUS_CONFIG[need.status] ?? STATUS_CONFIG.open;
  const demand = getNeedScoreLevel(need.need_score);
  const demandColor = getNeedScoreColor(need.need_score);
  const hasReward = need.reward_amount > 0;

  return (
    <Link
      href={`/needs/${need.id}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-5 transition-all duration-200 hover:border-border hover:shadow-card-hover"
    >
      {/* Top row: title + status badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-semibold leading-snug text-foreground group-hover:text-brand">
          {need.title}
        </h3>
        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', status.color)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
      </div>

      {/* Category + timeline */}
      <div className="flex flex-wrap items-center gap-2">
        {need.category && (
          <Badge variant="outline" className="border-border/60 text-[11px] font-medium text-muted-foreground">
            {need.category.name}
          </Badge>
        )}
        {need.timeline && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {TIMELINE_LABELS[need.timeline] ?? need.timeline}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <ArrowUp className="h-3.5 w-3.5 text-brand" />
          <span className="font-semibold text-foreground">{formatNumber(need.vote_count)}</span> votes
        </span>
        {hasReward ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-semibold text-foreground">${formatNumber(Math.round(need.reward_amount))}</span> reward
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground/50">
            <DollarSign className="h-3.5 w-3.5" /> No reward
          </span>
        )}
        {hasReward && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{need.contributor_count}</span> contributors
          </span>
        )}
        {(need.interested_builders ?? 0) > 0 && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Hammer className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{need.interested_builders}</span> builders
          </span>
        )}
      </div>

      {/* Bottom row: demand + date */}
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/40">
        <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', demandColor)}>
          <TrendingUp className="h-3 w-3" />
          {demand} Demand
        </span>
        <span className="text-xs text-muted-foreground">{formatDate(need.created_at)}</span>
      </div>
    </Link>
  );
}
