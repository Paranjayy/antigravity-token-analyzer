import * as React from 'react';
import { cn } from '../../lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'soft';
};

const badgeVariants = {
  default: 'bg-gradient-to-r from-[var(--color-primary)] to-[oklch(0.68_0.26_315)] text-white shadow-[0_2px_12px_color-mix(in_oklab,var(--color-primary)_35%,transparent)]',
  secondary: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
  outline: 'border border-[var(--color-border)] text-[var(--color-muted-foreground)] bg-[color-mix(in_oklab,var(--color-card)_50%,transparent)]',
  soft: 'bg-[color-mix(in_oklab,var(--color-primary)_14%,transparent)] text-[color-mix(in_oklab,var(--color-primary)_85%,white)] border border-[color-mix(in_oklab,var(--color-primary)_25%,transparent)]'
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em]',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}
