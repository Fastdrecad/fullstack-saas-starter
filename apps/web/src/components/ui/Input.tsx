import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@web/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'bg-surface text-text-primary placeholder:text-text-muted focus-visible:ring-accent flex h-10 w-full rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-error' : 'border-border',
            className,
          )}
          {...props}
        />
        {error ? <p className="text-error mt-1 text-xs">{error}</p> : null}
      </div>
    )
  },
)
Input.displayName = 'Input'
