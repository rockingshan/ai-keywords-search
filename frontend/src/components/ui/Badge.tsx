import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'secondary'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors',
        {
          'bg-primary/20 text-primary': variant === 'default',
          'bg-emerald-500/20 text-emerald-400 dark:text-emerald-300': variant === 'success',
          'bg-amber-500/20 text-amber-400 dark:text-amber-300': variant === 'warning',
          'bg-red-500/20 text-red-400 dark:text-red-300': variant === 'danger',
          'border border-stone-700 text-foreground dark:border-stone-600': variant === 'outline',
          'bg-accent text-foreground': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  )
}
