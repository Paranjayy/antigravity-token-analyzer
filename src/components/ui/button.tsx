import * as React from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
};

const buttonVariants = {
  default: 'bg-gradient-to-r from-[var(--color-primary)] to-[oklch(0.68_0.26_315)] text-white shadow-[0_4px_20px_color-mix(in_oklab,var(--color-primary)_40%,transparent)] hover:opacity-90 hover:shadow-[0_4px_28px_color-mix(in_oklab,var(--color-primary)_55%,transparent)]',
  secondary: 'bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[color-mix(in_oklab,var(--color-muted)_85%,white)]',
  ghost: 'bg-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/60',
  outline: 'border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-card)_60%,transparent)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/50 backdrop-blur-sm'
};

const buttonSizes = {
  sm: 'h-8 px-3.5 text-xs rounded-full',
  default: 'h-10 px-4 text-sm rounded-full',
  lg: 'h-11 px-5 text-sm rounded-full'
};

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  );
}
