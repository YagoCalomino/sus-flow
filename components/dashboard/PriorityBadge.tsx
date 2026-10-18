import { cn } from '@/lib/utils'
import { PRIORITY_META, type PriorityKey } from '@/lib/constants/triage'

interface Props {
  priority: PriorityKey
  size?: 'sm' | 'md'
}

export function PriorityBadge({ priority, size = 'md' }: Props) {
  const meta = PRIORITY_META[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-semibold leading-none',
        meta.colorClass,
        meta.textClass,
        size === 'sm' ? 'px-1.5 py-1 text-xs' : 'px-2.5 py-1.5 text-sm',
      )}
      aria-label={`Prioridade ${meta.level}: ${meta.label}`}
    >
      <span aria-hidden="true">{meta.level}</span>
      <span>{meta.ptLabel}</span>
    </span>
  )
}
