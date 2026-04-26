import * as React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border border-[var(--color-border)]/90 bg-[color-mix(in_oklab,var(--color-card)_88%,transparent)] text-[var(--color-card-foreground)] shadow-[0_18px_70px_rgba(0,0,0,0.14)]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2 px-6 pt-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[1.05rem] font-semibold tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-6 text-[var(--color-muted-foreground)]', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pb-6 pt-4', className)} {...props} />;
}
