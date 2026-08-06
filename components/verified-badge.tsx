import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VerifiedBadge({
  size = 'sm',
  className,
  showLabel = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}) {
  const sizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  const labelSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-medium text-sky-600',
        className,
      )}
      title="Verified Builder"
    >
      <BadgeCheck className={cn(sizes[size], 'fill-sky-100 text-sky-600')} />
      {showLabel && <span className={labelSizes[size]}>Verified</span>}
    </span>
  );
}
