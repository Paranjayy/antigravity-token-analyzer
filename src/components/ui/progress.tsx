import { cn } from '../../lib/utils';

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[oklch(0.68_0.26_315)] transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
