// components/nurse/TriageLogTable.tsx
// Triage log table — shows real nurse-submitted records (isSimulated=false).
// PriorityBadge from components/nurse/PriorityBadge (WCAG-compliant nurse version).
// Server-render safe — detail dialog is a Client Component leaf.

import { PriorityBadge } from '@/components/nurse/PriorityBadge'
import { TriageLogDetailDialog } from '@/components/nurse/TriageLogDetailDialog'
import { Badge } from '@/components/ui/badge'
import type { PriorityKey } from '@/lib/constants/triage'

export interface TriageLogRow {
  id: string
  createdAt: Date
  patient: { displayName: string }
  facility: { name: string }
  chiefComplaint: string
  confirmedColor: PriorityKey
  discriminators: string[]
  freeText: string | null
  painScore: number | null
  heartRate: number | null
  oxygenSat: number | null
  temperature: number | null
  respiratoryRate: number | null
  consciousness: string | null
  nurseOverride: boolean
  aiSuggestedColor: PriorityKey | null
  aiConfidence: number | null
  aiReasoning: string[] | null
  aiUsed: boolean
  aiMethod: 'rule_engine' | 'gemini' | null
}

interface TriageLogTableProps {
  logs: TriageLogRow[]
}

/** Format a Date as "HH:mm — dd/MM" using pt-BR locale */
function formatHorario(date: Date): string {
  return date.toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

export function TriageLogTable({ logs }: TriageLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-base font-semibold mb-2">Nenhum registro ainda</h2>
        <p className="text-sm text-muted-foreground">
          As triagens registradas manualmente aparecerão aqui.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table — hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Registros recentes de triagem manual</caption>
          <thead>
            <tr className="border-b border-border">
              {['Horário', 'Paciente', 'Unidade', 'Queixa Principal', 'Prioridade', 'Discriminadores', 'Ações'].map(
                (col) => (
                  <th
                    key={col}
                    scope="col"
                    className="text-xs text-muted-foreground font-semibold uppercase tracking-wide px-3 py-2 text-left whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {formatHorario(log.createdAt)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {log.patient.displayName}
                </td>
                <td className="px-3 py-2 max-w-[140px] truncate" title={log.facility.name}>
                  {log.facility.name}
                </td>
                <td className="px-3 py-2 max-w-[160px] truncate" title={log.chiefComplaint}>
                  {log.chiefComplaint}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    <PriorityBadge priority={log.confirmedColor} />
                    {log.nurseOverride && (
                      <Badge variant="outline" className="text-xs text-muted-foreground h-5 px-1.5" aria-label="Prioridade alterada pela enfermagem">
                        Alterado
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {log.discriminators.length} selecionados
                  </span>
                </td>
                <td className="px-3 py-2">
                  <TriageLogDetailDialog log={log} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — hidden on desktop */}
      <div className="block md:hidden space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-lg border border-border bg-card p-3 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{formatHorario(log.createdAt)}</span>
              <div className="flex items-center gap-1 flex-wrap">
                <PriorityBadge priority={log.confirmedColor} />
                {log.nurseOverride && (
                  <Badge variant="outline" className="text-xs text-muted-foreground h-5 px-1.5" aria-label="Prioridade alterada pela enfermagem">
                    Alterado
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm font-medium">{log.chiefComplaint}</p>
            <p className="text-xs text-muted-foreground">{log.patient.displayName}</p>
            <div className="pt-0.5">
              <TriageLogDetailDialog log={log} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
