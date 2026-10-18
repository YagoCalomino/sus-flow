// components/nurse/AISuggestionCard.tsx
// Pure display component — no state, no async.
// "use client" NOT required (no hooks or event handlers).

import { PriorityBadge } from '@/components/nurse/PriorityBadge'
import { Separator } from '@/components/ui/separator'
import type { PriorityKey } from '@/lib/constants/triage'

interface AISuggestionCardProps {
  priority: PriorityKey
  confidence?: number      // accepted but not displayed — intentionally hidden to preserve medical trust
  reasoning: string[]      // 3–5 bullet strings, already in pt-BR
}

export function AISuggestionCard({ priority, reasoning }: AISuggestionCardProps) {
  return (
    <div
      className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3"
      role="region"
      aria-label="Sugestão de classificação da IA"
    >
      <p className="text-sm font-semibold">Sugestão da IA</p>

      <div className="flex items-center gap-2">
        <PriorityBadge priority={priority} />
      </div>

      <div>
        <p className="text-sm font-semibold mb-1">Justificativa</p>
        <ul className="list-disc list-inside space-y-0.5">
          {reasoning.map((item, i) => (
            <li key={i} className="text-sm">{item}</li>
          ))}
        </ul>
      </div>

      <Separator />

      <p className="text-xs text-amber-700" role="note">
        Atenção: Sugestão gerada por IA. A decisão final e responsabilidade clínica são exclusivas do enfermeiro(a).
      </p>
    </div>
  )
}
