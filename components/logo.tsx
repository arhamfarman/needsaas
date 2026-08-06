import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({
  className,
  height,
  size,
}: {
  className?: string;
  height?: number;
  size?: number;
}) {
  // Logo.png is a wide horizontal lockup (icon + "NeedSaaS" wordmark).
  // Render at a fixed height; width is auto-proportional.
  const h = height ?? size ?? 28;
  return (
    <span className={cn('flex items-center', className)}>
      <Image
        src="/Logo.png"
        alt="NeedSaaS"
        height={h}
        width={h * 5}
        className="shrink-0 object-contain"
        priority
        style={{ height: h, width: 'auto' }}
      />
    </span>
  );
}
