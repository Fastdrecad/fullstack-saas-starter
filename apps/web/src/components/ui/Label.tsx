import { type LabelHTMLAttributes } from 'react'
import { cn } from '@web/lib/utils'

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export const Label = ({ className, ...props }: LabelProps) => {
  return <label className={cn('text-text-primary text-sm font-medium', className)} {...props} />
}
