'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getNeedScoreLevel, getNeedScoreColor, getNeedScoreBg } from '@/lib/needscore';
import { cn } from '@/lib/utils';
import type { Need } from '@/lib/types';

export function NeedScoreDisplay({ need, isPro }: { need: Need; isPro?: boolean }) {
  const level = getNeedScoreLevel(need.need_score);
  const color = getNeedScoreColor(need.need_score);
  const bg = getNeedScoreBg(need.need_score);
  const trend = need.need_score_trend;

  const TrendIcon = trend === 'rising' ? TrendingUp : trend === 'falling' ? TrendingDown : Minus;
  const trendColor = trend === 'rising' ? 'text-emerald-600' : trend === 'falling' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-3">
      {isPro ? (
        <>
          {/* Pro builders see exact score */}
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-foreground">{Math.round(need.need_score)}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <div className="flex flex-col">
            <span className={cn('text-sm font-semibold', color)}>{level}</span>
            <span className={cn('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {trend === 'rising' ? 'Rising' : trend === 'falling' ? 'Falling' : 'Stable'}
            </span>
          </div>
          {/* Score bar */}
          <div className="ml-2 hidden h-2 w-20 overflow-hidden rounded-full bg-muted sm:block">
            <div className={cn('h-full rounded-full transition-all', bg)} style={{ width: `${need.need_score}%` }} />
          </div>
        </>
      ) : (
        <>
          {/* Free users see only level */}
          <span className={cn('text-sm font-semibold', color)}>{level} Demand</span>
          <span className={cn('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {trend === 'rising' ? 'Rising' : trend === 'falling' ? 'Falling' : ''}
          </span>
        </>
      )}
    </div>
  );
}

export function NeedScoreBadge({ need, isPro }: { need: Need; isPro?: boolean }) {
  const level = getNeedScoreLevel(need.need_score);
  const color = getNeedScoreColor(need.need_score);

  if (isPro) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', color)}>
        NeedScore {Math.round(need.need_score)}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', color)}>
      {level}
    </span>
  );
}
