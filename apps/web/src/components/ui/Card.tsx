import { type HTMLAttributes } from 'react'
import { cn } from '@web/lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement>

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <div className={cn('border-border bg-surface rounded-xl border p-6', className)} {...props} />
  )
}
