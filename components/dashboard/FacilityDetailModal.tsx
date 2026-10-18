'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import type { FacilityAnalytics } from '@/lib/types/dashboard'

export interface FacilityDetailModalProps {
  facilityId: string | null
  facilityName: string
  onClose: () => void
}

const PRIORITY_META = [
  { key: 'RED',    hex: '#ef4444', level: 1, label: 'Vermelho' },
  { key: 'ORANGE', hex: '#f97316', level: 2, label: 'Laranja'  },
  { key: 'YELLOW', hex: '#eab308', level: 3, label: 'Amarelo'  },
  { key: 'GREEN',  hex: '#22c55e', level: 4, label: 'Verde'    },
  { key: 'BLUE',   hex: '#3b82f6', level: 5, label: 'Azul'     },
] as const

type PriorityKey = typeof PRIORITY_META[number]['key']

interface TooltipPayloadItem {
  dataKey: string
  value: number
  payload: Record<string, number>
}

interface CustomTooltipProps {
  active?: boolean
  label?: string
  payload?: TooltipPayloadItem[]
}

function CustomTooltip({ active, label, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const total = payload[0]?.payload?.total ?? 0

  return (
    <div
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 11,
      }}
    >
      <p style={{ marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {PRIORITY_META.map((meta) => {
        const entry = payload.find((p) => p.dataKey === meta.key)
        const value = entry?.value ?? 0
        return (
          <div key={meta.key} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                background: meta.hex,
                flexShrink: 0,
              }}
            />
            <span>
              {meta.level} — {meta.label}: {value}
            </span>
          </div>
        )
      })}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4, fontWeight: 600 }}>
        Total: {total}
      </div>
    </div>
  )
}

interface CustomLegendProps {
  payload?: Array<{ value: string; color: string }>
}

function CustomLegend(_props: CustomLegendProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', fontSize: 11 }}>
      {PRIORITY_META.map((meta) => (
        <span key={meta.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: meta.hex,
              flexShrink: 0,
            }}
          />
          {meta.level} — {meta.label}
        </span>
      ))}
    </div>
  )
}

export function FacilityDetailModal({ facilityId, facilityName, onClose }: FacilityDetailModalProps) {
  const [analytics, setAnalytics] = useState<FacilityAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!facilityId) return

    const controller = new AbortController()

    setLoading(true)
    setAnalytics(null)
    setFetchError(null)

    fetch(`/api/facility/${facilityId}/analytics`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: FacilityAnalytics = await res.json()
        setAnalytics(data)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setFetchError('Não foi possível carregar os dados. Tente novamente.')
      })
      .finally(() => {
        setLoading(false)
      })

    return () => controller.abort()
  }, [facilityId])

  const open = facilityId !== null

  const capacityClass =
    analytics && analytics.kpis.capacityPressure < 60
      ? 'bg-green-100 text-green-800'
      : analytics && analytics.kpis.capacityPressure <= 85
      ? 'bg-amber-100 text-amber-800'
      : 'bg-red-100 text-red-800'

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        aria-labelledby="facility-detail-title"
      >
        <DialogHeader>
          <DialogTitle id="facility-detail-title">{facilityName}</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={facilityId ?? 'empty'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
          >
            {loading && (
              <div className="space-y-4">
                <div
                  className="h-[220px] rounded-lg bg-muted animate-pulse"
                  aria-busy="true"
                  aria-label="Carregando gráfico"
                />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-20 rounded-lg bg-muted animate-pulse" />
                  <div className="h-20 rounded-lg bg-muted animate-pulse" />
                  <div className="h-20 rounded-lg bg-muted animate-pulse" />
                </div>
              </div>
            )}

            {fetchError !== null && !loading && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm">{fetchError}</p>
              </div>
            )}

            {analytics !== null && !loading && (
              <>
                {/* Chart section */}
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Chegadas por Prioridade (últimas 6h)
                </p>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics.buckets}
                      margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
                      stackOffset="none"
                    >
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={24}
                        domain={[0, (dataMax: number) => Math.max(dataMax, 5)]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />
                      {PRIORITY_META.map((meta) => (
                        <Area
                          key={meta.key}
                          type="monotone"
                          dataKey={meta.key as PriorityKey}
                          stackId="1"
                          stroke={meta.hex}
                          fill={meta.hex}
                          fillOpacity={0.6}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* KPI tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {/* KPI 1 — Hora de Pico */}
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Hora de Pico</p>
                      <p className="text-2xl font-bold tabular-nums">{analytics.kpis.peakHour}</p>
                      <p className="text-xs text-muted-foreground">{analytics.kpis.peakCount} chegadas</p>
                    </CardContent>
                  </Card>

                  {/* KPI 2 — Média Móvel de Espera */}
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Média Móvel de Espera</p>
                      <p className="text-2xl font-bold tabular-nums">{analytics.kpis.movingAvgWait}min</p>
                      <p className="text-xs text-muted-foreground">Média 3 janelas (15min)</p>
                    </CardContent>
                  </Card>

                  {/* KPI 3 — Pressão de Capacidade */}
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Pressão de Capacidade</p>
                      <span
                        className={`text-2xl font-bold tabular-nums px-2 py-0.5 rounded ${capacityClass}`}
                      >
                        {analytics.kpis.capacityPressure}%
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">Carga atual / capacidade</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
