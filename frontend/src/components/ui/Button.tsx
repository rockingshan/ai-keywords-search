import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover-lift',
          {
            'bg-gradient-warm text-primary-foreground hover:opacity-90 glow-orange-sm':
              variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80':
              variant === 'secondary',
            'border-2 border-primary text-primary hover:bg-primary/10':
              variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground':
              variant === 'ghost',
          },
          {
            'h-9 px-4 text-sm': size === 'sm',
            'h-11 px-6': size === 'md',
            'h-14 px-8 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
