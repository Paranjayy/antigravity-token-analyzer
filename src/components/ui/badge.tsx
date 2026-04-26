import * as React from 'react';
import { cn } from '../../lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'soft';
};

const badgeVariants = {
  default: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
  secondary: 'bg-[var(--color-muted)] text-[var(--color-foreground)]',
  outline: 'border border-[var(--color-border)] text-[var(--color-muted-foreground)]',
  soft: 'bg-[color-mix(in_oklab,var(--color-primary)_16%,transparent)] text-[var(--color-foreground)]'
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.28em]',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}
