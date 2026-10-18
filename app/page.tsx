'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useSSEStream } from '@/hooks/useSSEStream'
import { FacilityCard } from '@/components/dashboard/FacilityCard'
import { FacilityDetailModal } from '@/components/dashboard/FacilityDetailModal'
import type { FacilityTrend } from '@/lib/types/dashboard'

function formatTime(d: Date): string {
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function DashboardPage() {
  const { metrics, lastUpdated, error, connecting } = useSSEStream()
  const [trend, setTrend] = useState<FacilityTrend[]>([])
  const lastTrendFetch = useRef<number>(0)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)
  const [selectedFacilityName, setSelectedFacilityName] = useState<string>('')

  // Fetch trend on mount and whenever SSE delivers new metrics (throttled to 30s)
  useEffect(() => {
    async function fetchTrend() {
      const now = Date.now()
      if (now - lastTrendFetch.current < 30_000) return
      lastTrendFetch.current = now
      try {
        const res = await fetch('/api/trend')
        if (res.ok) {
          const data = await res.json() as FacilityTrend[]
          setTrend(data)
        }
      } catch {
        // non-fatal — trend chart will show empty state
      }
    }
    fetchTrend()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics])

  function getTrend(facilityId: string) {
    return trend.find((t) => t.facilityId === facilityId)?.buckets ?? []
  }

  function handleCardClick(id: string, name: string) {
    setSelectedFacilityId(id)
    setSelectedFacilityName(name)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold sm:text-lg leading-tight">
              Painel de Filas SUS
            </h1>
            <p className="text-xs text-muted-foreground">
              Sistema Único de Saúde · Rio de Janeiro ·{' '}
              <span className="text-amber-600 font-medium">Dados Sintéticos</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs shrink-0">
            {connecting && !metrics ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">Conectando...</span>
              </>
            ) : error ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                <span className="text-destructive hidden sm:inline">{error}</span>
                <span className="text-destructive sm:hidden">Offline</span>
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                <span className="text-muted-foreground">
                  <span className="hidden sm:inline">Atualizado às </span>
                  {lastUpdated ? formatTime(lastUpdated) : '—'}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {/* Skeleton loading state */}
        {!metrics && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 rounded-xl bg-muted animate-pulse"
                aria-busy="true"
                aria-label="Carregando dados da unidade"
              />
            ))}
          </div>
        )}

        {/* Error state (no metrics yet) */}
        {error && !metrics && (
          <div className="text-center py-16 space-y-2">
            <WifiOff className="h-8 w-8 text-muted-foreground mx-auto" aria-hidden="true" />
            <p className="text-muted-foreground text-sm">
              Não foi possível conectar ao servidor.
            </p>
            <p className="text-xs text-muted-foreground">
              Os dados aparecerão assim que a conexão for restabelecida.
            </p>
          </div>
        )}

        {/* Facility cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((m, i) => (
              <FacilityCard
                key={m.facilityId}
                metrics={m}
                trend={getTrend(m.facilityId)}
                index={i}
                onClick={() => handleCardClick(m.facilityId, m.facility.name)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Disclaimer footer */}
      <footer className="border-t py-3 text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Dados sintéticos para fins de demonstração — não representa situação real de atendimento
        </p>
        <Link
          href="/login"
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Acesso Restrito · Portal do Enfermeiro(a)
        </Link>
      </footer>

      <FacilityDetailModal
        facilityId={selectedFacilityId}
        facilityName={selectedFacilityName}
        onClose={() => setSelectedFacilityId(null)}
      />
    </div>
  )
}
