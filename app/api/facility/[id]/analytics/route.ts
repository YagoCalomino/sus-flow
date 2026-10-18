export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { PriorityBucket, AnalyticsKPIs, FacilityAnalytics } from '@/lib/types/dashboard'

type PriorityKey = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE'

const COLOR_MAP: Record<string, PriorityKey> = {
  red: 'RED',
  orange: 'ORANGE',
  yellow: 'YELLOW',
  green: 'GREEN',
  blue: 'BLUE',
}

function snapTo15Min(date: Date): string {
  const d = new Date(date)
  d.setSeconds(0, 0)
  d.setMinutes(Math.floor(d.getMinutes() / 15) * 15)
  return d.toISOString()
}

function toHHMM(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Build 24-bucket timeline (6h × 15-min slots)
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000)
    const windowStart = new Date(since)
    windowStart.setSeconds(0, 0)
    windowStart.setMinutes(Math.floor(windowStart.getMinutes() / 15) * 15)

    const allBuckets: string[] = []
    for (let i = 0; i < 24; i++) {
      allBuckets.push(new Date(windowStart.getTime() + i * 15 * 60 * 1000).toISOString())
    }

    // Run all three queries in parallel
    const [logs, facility, metrics] = await Promise.all([
      prisma.triageLog.findMany({
        where: { facilityId: id, arrivalAt: { gte: since } },
        select: { arrivalAt: true, confirmedColor: true, waitMinutes: true },
      }),
      prisma.facility.findUnique({
        where: { id },
        select: { name: true, type: true, capacity: true },
      }),
      prisma.queueMetrics.findFirst({
        where: { facilityId: id },
        select: { currentLoad: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    // Build per-priority bucket map
    type BucketEntry = {
      RED: number
      ORANGE: number
      YELLOW: number
      GREEN: number
      BLUE: number
      waitSamples: number[]
    }
    const bucketMap: Record<string, BucketEntry> = {}

    for (const log of logs) {
      const bucketKey = snapTo15Min(new Date(log.arrivalAt))

      if (!bucketMap[bucketKey]) {
        bucketMap[bucketKey] = { RED: 0, ORANGE: 0, YELLOW: 0, GREEN: 0, BLUE: 0, waitSamples: [] }
      }

      // Increment priority counter if confirmedColor is recognized
      if (log.confirmedColor) {
        const priorityKey = COLOR_MAP[log.confirmedColor.toLowerCase()]
        if (priorityKey) {
          bucketMap[bucketKey][priorityKey]++
        }
      }

      // Collect wait samples
      if (log.waitMinutes !== null && log.waitMinutes !== undefined) {
        bucketMap[bucketKey].waitSamples.push(log.waitMinutes)
      }
    }

    // Build 24 PriorityBucket objects
    const buckets: PriorityBucket[] = allBuckets.map((iso) => {
      const entry = bucketMap[iso]
      const RED = entry?.RED ?? 0
      const ORANGE = entry?.ORANGE ?? 0
      const YELLOW = entry?.YELLOW ?? 0
      const GREEN = entry?.GREEN ?? 0
      const BLUE = entry?.BLUE ?? 0
      return {
        bucket: iso,
        time: toHHMM(iso),
        RED,
        ORANGE,
        YELLOW,
        GREEN,
        BLUE,
        total: RED + ORANGE + YELLOW + GREEN + BLUE,
      }
    })

    // Compute KPIs
    // Peak bucket: highest total (tie-break: first occurrence)
    const peakBucket = buckets.reduce((best, b) => (b.total > best.total ? b : best), buckets[0])
    const peakHour = peakBucket.time
    const peakCount = peakBucket.total

    // Per-bucket avg wait
    const perBucketAvg: (number | null)[] = allBuckets.map((iso) => {
      const samples = bucketMap[iso]?.waitSamples ?? []
      if (samples.length === 0) return null
      return samples.reduce((a, b) => a + b, 0) / samples.length
    })

    // Rolling 3-bucket average
    const rollingAvgs: number[] = []
    for (let i = 0; i <= 21; i++) {
      const window = [perBucketAvg[i], perBucketAvg[i + 1], perBucketAvg[i + 2]].filter(
        (v): v is number => v !== null && v !== undefined
      )
      if (window.length > 0) {
        rollingAvgs.push(window.reduce((a, b) => a + b, 0) / window.length)
      }
    }

    const movingAvgWait =
      rollingAvgs.length > 0
        ? Math.round((rollingAvgs.reduce((a, b) => a + b, 0) / rollingAvgs.length) * 10) / 10
        : 0

    // Capacity pressure
    const capacityPressure =
      metrics?.currentLoad !== undefined && metrics.currentLoad !== null && facility.capacity > 0
        ? Math.round((metrics.currentLoad / facility.capacity) * 1000) / 10
        : 0

    const kpis: AnalyticsKPIs = {
      peakHour,
      peakCount,
      movingAvgWait,
      capacityPressure,
    }

    const response: FacilityAnalytics = {
      facilityId: id,
      facilityName: facility.name,
      facilityType: (facility.type === 'UPA' || facility.type === 'CLINIC') ? facility.type : 'UPA',
      buckets,
      kpis,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[analytics] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
