import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@web/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'focus-visible:ring-accent inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-accent text-background hover:bg-accent-hover': variant === 'primary',
            'bg-surface text-text-primary border-border hover:bg-surface-hover border':
              variant === 'secondary',
            'text-text-secondary hover:text-text-primary hover:bg-surface-hover':
              variant === 'ghost',
            'bg-error hover:bg-error/90 text-white': variant === 'destructive',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
