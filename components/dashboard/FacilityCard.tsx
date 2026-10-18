'use client'

import { motion } from 'framer-motion'
import { MapPin, Clock, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CapacityGauge } from './CapacityGauge'
import { PriorityBreakdown } from './PriorityBreakdown'
import { TrendChart } from './TrendChart'
import type { QueueMetricsPayload, TrendBucket } from '@/lib/types/dashboard'

interface Props {
  metrics: QueueMetricsPayload
  trend: TrendBucket[]
  index: number
  onClick: () => void
}

export function FacilityCard({ metrics, trend, index, onClick }: Props) {
  const { facility, currentLoad, avgWaitMinutes, loadPercent, priorityBreakdown } = metrics
  const typeLabel = facility.type === 'UPA' ? 'UPA 24h' : 'Clínica'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1, ease: 'easeOut' }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Ver detalhes de ${facility.name}`}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      >
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight truncate">
                {facility.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{typeLabel} · {facility.capacity} leitos</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold tabular-nums leading-none transition-opacity duration-300">
                {currentLoad}
              </p>
              <p className="text-xs text-muted-foreground">pacientes</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <CapacityGauge
            loadPercent={loadPercent}
            currentLoad={currentLoad}
            capacity={facility.capacity}
          />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              Espera média geral: {avgWaitMinutes}min
            </p>
            <PriorityBreakdown breakdown={priorityBreakdown} />
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Activity className="h-3 w-3" aria-hidden="true" />
              Chegadas (últimas 6h)
            </p>
            <TrendChart data={trend} />
          </div>

          <p className="text-xs text-primary/70 text-right mt-2 select-none">Ver detalhes →</p>
        </CardContent>
      </Card>
      </button>
    </motion.div>
  )
}
