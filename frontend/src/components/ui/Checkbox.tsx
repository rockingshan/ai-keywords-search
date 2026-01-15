import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            'h-5 w-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            checked
              ? 'bg-primary border-primary'
              : 'border-input hover:border-primary/50',
            className
          )}
          onClick={() => onCheckedChange?.(!checked)}
        >
          {checked && <Check className="h-4 w-4 text-primary-foreground" />}
        </div>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
