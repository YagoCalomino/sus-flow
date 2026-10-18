// components/nurse/PriorityBadge.tsx
// WCAG 1.4.1 — never color alone: shows level number + ptLabel + label text + color background
// This is the NURSE version. Do NOT modify components/dashboard/PriorityBadge.tsx.

import { PRIORITY_META } from '@/lib/constants/triage'
import type { PriorityKey } from '@/lib/constants/triage'

interface PriorityBadgeProps {
  priority: PriorityKey
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const meta = PRIORITY_META[priority]

  // Null guard: if priority is not a known key (e.g. stale DB data), render a
  // safe fallback rather than crashing on meta.colorClass access below.
  if (!meta) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${meta.colorClass} ${meta.textClass}`}
      aria-label={`Prioridade ${meta.level}: ${meta.ptLabel} — ${meta.label}`}
    >
      <span>{meta.level}</span>
      <span aria-hidden="true">·</span>
      <span>{meta.ptLabel}</span>
      <span aria-hidden="true">—</span>
      <span>{meta.label}</span>
    </span>
  )
}
