import { PriorityBadge } from './PriorityBadge'
import { PRIORITY_ORDER, PRIORITY_META } from '@/lib/constants/triage'
import type { PriorityBreakdownData } from '@/lib/types/dashboard'

interface Props {
  breakdown: PriorityBreakdownData
}

export function PriorityBreakdown({ breakdown }: Props) {
  return (
    <div className="space-y-1.5" aria-label="Distribuição por prioridade">
      {PRIORITY_ORDER.map((priority) => {
        const meta = PRIORITY_META[priority]
        const slot = breakdown[meta.breakdownKey]
        return (
          <div
            key={priority}
            className="flex items-center gap-2"
          >
            <PriorityBadge priority={priority} size="sm" />
            <span className="text-xs text-muted-foreground flex-1 text-right tabular-nums">
              {slot.count} pac.
            </span>
            <span className="text-xs text-muted-foreground w-16 text-right tabular-nums">
              {slot.avgWait != null ? `≈${slot.avgWait}min` : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
