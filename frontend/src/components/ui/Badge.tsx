import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'secondary'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        {
          'bg-primary/20 text-primary': variant === 'default',
          'bg-green-500/20 text-green-400': variant === 'success',
          'bg-yellow-500/20 text-yellow-400': variant === 'warning',
          'bg-red-500/20 text-red-400': variant === 'danger',
          'border border-gray-700 text-foreground': variant === 'outline',
          'bg-accent text-foreground': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  )
}
