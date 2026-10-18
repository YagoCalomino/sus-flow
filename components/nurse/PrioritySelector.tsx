'use client'

// components/nurse/PrioritySelector.tsx
// 5-button radio-style priority selector for the triage form.
// Each button meets 44px touch target (h-[44px]) and shows level + ptLabel + label.

import { PRIORITY_META, PRIORITY_ORDER } from '@/lib/constants/triage'
import type { PriorityKey } from '@/lib/constants/triage'
import { cn } from '@/lib/utils'

interface PrioritySelectorProps {
  value: PriorityKey | null
  onChange: (key: PriorityKey) => void
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRIORITY_ORDER.map((key) => {
        const meta = PRIORITY_META[key]
        const isSelected = value === key

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={isSelected}
            aria-label={`Prioridade ${meta.level}: ${meta.ptLabel} — ${meta.label}`}
            className={cn(
              'inline-flex flex-col items-center justify-center rounded-md text-xs font-semibold transition-all min-w-[80px] h-[44px] px-2',
              meta.colorClass,
              meta.textClass,
              isSelected ? 'ring-2 ring-offset-2 ring-foreground' : 'opacity-70'
            )}
          >
            <span>{`${meta.level} · ${meta.ptLabel}`}</span>
            <span>{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}
