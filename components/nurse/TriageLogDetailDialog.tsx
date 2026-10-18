'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PriorityBadge } from '@/components/nurse/PriorityBadge'
import type { TriageLogRow } from '@/components/nurse/TriageLogTable'

function VitalRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null) return null
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TriageLogDetailDialog({ log }: { log: TriageLogRow }) {
  const hasVitals =
    log.heartRate != null ||
    log.oxygenSat != null ||
    log.temperature != null ||
    log.respiratoryRate != null ||
    log.painScore != null ||
    log.consciousness != null

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          Ver Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes da Triagem</DialogTitle>
          <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Patient + Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Paciente</p>
              <p>{log.patient.displayName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Unidade</p>
              <p>{log.facility.name}</p>
            </div>
          </div>

          {/* Complaint + Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Queixa Principal</p>
              <p>{log.chiefComplaint}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Prioridade</p>
              <PriorityBadge priority={log.confirmedColor} />
            </div>
          </div>

          {/* Discriminators */}
          {log.discriminators.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Discriminadores</p>
              <ul className="list-disc list-inside space-y-0.5 text-sm">
                {log.discriminators.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Vitals */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Sinais Vitais</p>
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
              {hasVitals ? (
                <>
                  <VitalRow label="Frequência Cardíaca" value={log.heartRate != null ? `${log.heartRate} bpm` : null} />
                  <VitalRow label="SpO₂" value={log.oxygenSat != null ? `${log.oxygenSat}%` : null} />
                  <VitalRow label="Temperatura" value={log.temperature != null ? `${log.temperature}°C` : null} />
                  <VitalRow label="Freq. Respiratória" value={log.respiratoryRate != null ? `${log.respiratoryRate} rpm` : null} />
                  <VitalRow label="Dor" value={log.painScore != null ? `${log.painScore}/10` : null} />
                  <VitalRow label="AVPU (Consciência)" value={log.consciousness} />
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum sinal vital registrado</p>
              )}
            </div>
          </div>

          {/* Free text — always shown; fallback when nurse left it blank */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Descrição dos Sintomas</p>
            <p className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">
              {log.freeText || 'Nenhuma descrição fornecida.'}
            </p>
          </div>

          <Separator />

          {/* AI Classification section */}
          <section aria-labelledby="ai-section-heading">
            <h3 id="ai-section-heading" className="text-sm font-semibold mb-2">Classificação IA</h3>
            {!log.aiUsed ? (
              <p className="text-sm text-muted-foreground">Classificação manual (sem IA)</p>
            ) : (() => {
              const reasoning = Array.isArray(log.aiReasoning) ? (log.aiReasoning as string[]) : null
              return log.nurseOverride ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sugerido pela IA:</span>
                    <span className="opacity-70">
                      {log.aiSuggestedColor && <PriorityBadge priority={log.aiSuggestedColor} />}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confiança:</span>
                    <span className="tabular-nums">{log.aiConfidence}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Alterado pela enfermagem:</span>
                    <PriorityBadge priority={log.confirmedColor} />
                  </div>
                  {reasoning && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Justificativa da IA:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-sm">
                        {reasoning.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sugerido pela IA:</span>
                    {log.aiSuggestedColor && <PriorityBadge priority={log.aiSuggestedColor} />}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confiança:</span>
                    <span className="tabular-nums">{log.aiConfidence}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confirmado pela enfermagem:</span>
                    <PriorityBadge priority={log.confirmedColor} />
                  </div>
                  {reasoning && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Justificativa:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-sm">
                        {reasoning.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })()}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
