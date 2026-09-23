import * as React from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
          // Variants
          variant === 'primary' &&
            'bg-accent hover:bg-accent-hover text-white rounded-[10px] shadow-none',
          variant === 'secondary' &&
            'bg-surface-2 hover:bg-surface-2/80 text-text border border-border rounded-lg',
          variant === 'ghost' &&
            'bg-transparent hover:bg-surface-2 text-text-muted hover:text-text rounded-lg',
          variant === 'danger' &&
            'bg-danger/20 hover:bg-danger/30 text-danger border border-danger/40 rounded-lg',
          variant === 'icon' &&
            'bg-transparent hover:bg-surface-2 text-text-muted hover:text-text rounded-lg p-0',
          // Sizes
          size === 'default' && 'h-10 px-4 text-[13px] leading-[18px]',
          size === 'sm' && 'h-8 px-3 text-[12px] leading-[16px]',
          size === 'lg' && 'h-11 px-5 text-[14px]',
          size === 'icon' && 'h-9 w-9',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
