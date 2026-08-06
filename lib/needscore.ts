export type NeedScoreLevel = 'Low' | 'Medium' | 'High' | 'Very High';

export function getNeedScoreLevel(score: number): NeedScoreLevel {
  if (score >= 75) return 'Very High';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

export function getNeedScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-sky-600';
  if (score >= 25) return 'text-amber-600';
  return 'text-muted-foreground';
}

export function getNeedScoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-sky-500';
  if (score >= 25) return 'bg-amber-500';
  return 'bg-muted-foreground/40';
}
