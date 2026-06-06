import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { FacilityTrend } from '@/lib/types/dashboard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000)

  // Build the full 24-bucket timeline (15-min slots over 6h)
  const windowStart = new Date(since)
  windowStart.setSeconds(0, 0)
  windowStart.setMinutes(Math.floor(windowStart.getMinutes() / 15) * 15)
  const allBuckets: string[] = []
  for (let i = 0; i < 24; i++) {
    allBuckets.push(new Date(windowStart.getTime() + i * 15 * 60 * 1000).toISOString())
  }

  const [logs, facilities] = await Promise.all([
    prisma.triageLog.findMany({
      where: { arrivalAt: { gte: since } },
      select: { facilityId: true, arrivalAt: true },
      orderBy: { arrivalAt: 'asc' },
    }),
    prisma.facility.findMany({
      where: { isActive: true },
      select: { id: true },
    }),
  ])

  // Seed count map with all active facilities (so every facility gets a complete series)
  const countMap: Record<string, Record<string, number>> = {}
  for (const fac of facilities) {
    countMap[fac.id] = {}
  }

  // Bin each log into its 15-min bucket
  for (const log of logs) {
    const d = new Date(log.arrivalAt)
    d.setSeconds(0, 0)
    d.setMinutes(Math.floor(d.getMinutes() / 15) * 15)
    const bucket = d.toISOString()
    if (!countMap[log.facilityId]) countMap[log.facilityId] = {}
    countMap[log.facilityId][bucket] = (countMap[log.facilityId][bucket] ?? 0) + 1
  }

  // Zero-fill all 24 buckets for every facility
  const result: FacilityTrend[] = Object.entries(countMap).map(([facilityId, counts]) => ({
    facilityId,
    buckets: allBuckets.map((b) => ({ bucket: b, count: counts[b] ?? 0 })),
  }))

  return NextResponse.json(result)
}
