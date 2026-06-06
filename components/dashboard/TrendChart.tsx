'use client'

import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TrendBucket } from '@/lib/types/dashboard'

interface Props {
  data: TrendBucket[]
}

function formatBucketTime(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

export function TrendChart({ data }: Props) {
  const hasData = data.some((b) => b.count > 0)
  if (!hasData) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        Aguardando dados de simulação...
      </p>
    )
  }

  const chartData = data.map((b) => ({
    time: formatBucketTime(b.bucket),
    count: b.count,
  }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-28"
      role="img"
      aria-label="Gráfico de chegadas de pacientes nas últimas 6 horas"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            domain={[0, (dataMax: number) => Math.max(dataMax, 5)]}
            width={24}
          />
          <Tooltip
            formatter={(value) => [`${value}`, 'Chegadas']}
            labelFormatter={(label) => `Horário: ${label}`}
            contentStyle={{ fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--foreground)"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
