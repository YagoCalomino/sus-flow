import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  FACILITY_MULTIPLIERS,
  getTimeOfDayMultiplier,
  generateArrivals,
} from '@/lib/simulation/generate'

export const dynamic = 'force-dynamic'

const BASE_ARRIVALS = 10

export async function GET(req: Request) {
  // Verify CRON_SECRET first — reject immediately if absent or wrong
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const window60m  = new Date(now.getTime() - 60 * 60 * 1000)

    // Cleanup stale records before generating new data
    await prisma.triageLog.deleteMany({
      where: { isSimulated: true, createdAt: { lt: cutoff48h } },
    })
    await prisma.$executeRaw`
      DELETE FROM "Patient"
      WHERE "createdAt" < ${cutoff48h}
        AND id NOT IN (SELECT DISTINCT "patientId" FROM "TriageLog")
    `

    const timeMultiplier = getTimeOfDayMultiplier()
    const facilities = await prisma.facility.findMany({ where: { isActive: true } })
    let totalCreated = 0

    for (const facility of facilities) {
      const facilityMultiplier = FACILITY_MULTIPLIERS[facility.id] ?? 1.0
      const count = Math.max(1, Math.round(BASE_ARRIVALS * facilityMultiplier * timeMultiplier))
      const arrivals = generateArrivals(count)

      // Insert Patients first (FK), then TriageLogs.
      // createMany does not return IDs in PostgreSQL — individual creates used here.
      // Parallel inserts instead of a serial for-loop.
      const patientIds = await Promise.all(
        arrivals.map((a) =>
          prisma.patient
            .create({
              data: { displayName: a.patientName, ageGroup: a.ageGroup },
              select: { id: true },
            })
            .then((p) => p.id)
        )
      )

      await prisma.triageLog.createMany({
        data: arrivals.map((a, i) => ({
          patientId:      patientIds[i],
          facilityId:     facility.id,
          chiefComplaint: a.chiefComplaint,
          confirmedColor: a.priority,
          discriminators: [],
          isSimulated:    true,
          aiUsed:         false,
          waitMinutes:    a.waitMinutes,
          arrivalAt:      a.arrivalAt,
        })),
      })

      totalCreated += count

      // Recompute QueueMetrics from the sliding 60-min window
      const recentLogs = await prisma.triageLog.findMany({
        where: { facilityId: facility.id, isSimulated: true, arrivalAt: { gte: window60m } },
        select: { confirmedColor: true, waitMinutes: true },
      })

      const currentLoad    = recentLogs.length
      const safeCapacity   = Math.max(facility.capacity, 1)
      const loadPercent    = parseFloat(Math.min((currentLoad / safeCapacity) * 100, 999).toFixed(1))
      const waitValues     = recentLogs.map((l) => l.waitMinutes ?? 0)
      const avgWaitMinutes = waitValues.length
        ? parseFloat((waitValues.reduce((s, v) => s + v, 0) / waitValues.length).toFixed(1))
        : 0

      const colorKey: Record<string, string> = {
        RED: 'red', ORANGE: 'orange', YELLOW: 'yellow', GREEN: 'green', BLUE: 'blue',
      }
      const breakdown: Record<string, { count: number; avgWait: number | null }> = {
        red: { count: 0, avgWait: null }, orange: { count: 0, avgWait: null },
        yellow: { count: 0, avgWait: null }, green: { count: 0, avgWait: null },
        blue: { count: 0, avgWait: null },
      }
      const waitByColor: Record<string, number[]> = { red: [], orange: [], yellow: [], green: [], blue: [] }

      for (const log of recentLogs) {
        const key = colorKey[log.confirmedColor]
        if (!key) continue
        breakdown[key].count++
        waitByColor[key].push(log.waitMinutes ?? 0)
      }
      for (const key of Object.keys(breakdown)) {
        const vals = waitByColor[key]
        breakdown[key].avgWait = vals.length
          ? parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1))
          : null
      }

      await prisma.queueMetrics.upsert({
        where:  { facilityId: facility.id },
        update: { currentLoad, loadPercent, avgWaitMinutes, priorityBreakdown: breakdown, computedAt: now },
        create: { facilityId: facility.id, currentLoad, loadPercent, avgWaitMinutes, priorityBreakdown: breakdown },
      })
    }

    return NextResponse.json({
      success: true,
      tickAt:  now.toISOString(),
      events:  { created: totalCreated, facilitiesUpdated: facilities.length },
    })
  } catch (err) {
    // Return 200 so Vercel cron does not treat app errors as infrastructure
    // failures and trigger automatic retries (which would compound the problem).
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}
