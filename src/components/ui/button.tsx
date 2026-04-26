import * as React from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
};

const buttonVariants = {
  default: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90',
  secondary: 'bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[color-mix(in_oklab,var(--color-muted)_84%,white)]',
  ghost: 'bg-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/60',
  outline: 'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/50'
};

const buttonSizes = {
  sm: 'h-8 px-3 text-xs rounded-full',
  default: 'h-10 px-4 text-sm rounded-full',
  lg: 'h-11 px-5 text-sm rounded-full'
};

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  );
}
