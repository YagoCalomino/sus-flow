import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient, FacilityType, AgeGroup, TriagePriority } from '@prisma/client'

// Seed script is a standalone CLI — direct PrismaClient instantiation is the ONLY exception
// to the singleton rule. Never import from lib/prisma.ts in seed scripts.
const prisma = new PrismaClient()

// ─── Helpers ────────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const CHIEF_COMPLAINTS = [
  'Dor no peito', 'Dificuldade para respirar', 'Febre alta', 'Dor abdominal',
  'Cefaleia intensa', 'Trauma em membro', 'Vômitos persistentes',
  'Tontura e fraqueza', 'Dor lombar', 'Crise alérgica',
]

const WAIT_RANGES: Record<TriagePriority, [number, number]> = {
  [TriagePriority.RED]:    [0,   2  ],
  [TriagePriority.ORANGE]: [8,   15 ],
  [TriagePriority.YELLOW]: [45,  75 ],
  [TriagePriority.GREEN]:  [100, 140],
  [TriagePriority.BLUE]:   [200, 280],
}

/**
 * Distribute `total` events randomly across `numBuckets` slots.
 * Weights increase linearly toward the most recent bucket so the chart
 * looks plausible (more recent arrivals still in queue).
 */
function distributeToBuckets(total: number, numBuckets: number): number[] {
  const counts = new Array<number>(numBuckets).fill(0)
  // Weight: oldest bucket = 0.5, newest = 2.0 (linear ramp)
  const weights = Array.from({ length: numBuckets }, (_, k) => 0.5 + (k / (numBuckets - 1)) * 1.5)
  const totalWeight = weights.reduce((s, w) => s + w, 0)

  for (let i = 0; i < total; i++) {
    let r = Math.random() * totalWeight
    for (let k = 0; k < numBuckets; k++) {
      r -= weights[k]
      if (r <= 0) { counts[k]++; break }
    }
    // Edge case: floating-point remainder lands in last bucket
    if (r > 0) counts[numBuckets - 1]++
  }
  return counts
}

/**
 * Build a shuffled priority pool from a color→count breakdown.
 * Keys must match TriagePriority (RED, ORANGE, YELLOW, GREEN, BLUE).
 */
function buildPriorityPool(breakdown: Record<string, number>): TriagePriority[] {
  const pool: TriagePriority[] = []
  for (const [color, count] of Object.entries(breakdown)) {
    for (let i = 0; i < count; i++) {
      pool.push(color as TriagePriority)
    }
  }
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool
}

/**
 * Backfill 6h of simulated TriageLogs for one facility.
 * Deletes existing simulated logs first (idempotent).
 * Uses `arrivalAt` spread across 24 × 15-min buckets so the Recharts
 * trend line immediately shows meaningful data on first load (before the
 * cron has run enough ticks to accumulate real history).
 */
async function backfillFacilityHistory(
  facilityId: string,
  breakdown: Record<string, number>,
) {
  const total = Object.values(breakdown).reduce((s, c) => s + c, 0)

  // Clean existing simulated data for this facility (re-seed is idempotent)
  await prisma.triageLog.deleteMany({ where: { facilityId, isSimulated: true } })

  if (total === 0) return

  const NUM_BUCKETS = 24
  const BUCKET_MS   = 15 * 60 * 1000
  const windowStart = Date.now() - NUM_BUCKETS * BUCKET_MS

  const bucketCounts  = distributeToBuckets(total, NUM_BUCKETS)
  const priorityPool  = buildPriorityPool(breakdown)
  let poolIndex = 0

  for (let b = 0; b < NUM_BUCKETS; b++) {
    const count = bucketCounts[b]
    if (count === 0) continue

    const bucketStart = windowStart + b * BUCKET_MS

    for (let i = 0; i < count; i++) {
      const priority   = priorityPool[poolIndex++ % priorityPool.length]
      const arrivalAt  = new Date(bucketStart + Math.random() * BUCKET_MS)
      const [lo, hi]   = WAIT_RANGES[priority]

      const patient = await prisma.patient.create({
        data: {
          displayName: `Paciente #${randInt(1000, 9999)}`,
          ageGroup: AgeGroup.ADULT,
        },
        select: { id: true },
      })

      await prisma.triageLog.create({
        data: {
          patientId:      patient.id,
          facilityId,
          chiefComplaint: CHIEF_COMPLAINTS[randInt(0, CHIEF_COMPLAINTS.length - 1)],
          confirmedColor: priority,
          discriminators: [],
          isSimulated:    true,
          aiUsed:         false,
          waitMinutes:    randInt(lo, hi),
          arrivalAt,
        },
      })
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...')

  // ─── Facilities ───────────────────────────────────────────────────────────
  const upa1 = await prisma.facility.upsert({
    where:  { id: 'facility-upa-marechal-hermes' },
    update: {},
    create: {
      id:       'facility-upa-marechal-hermes',
      name:     'UPA 24h Marechal Hermes',
      type:     FacilityType.UPA,
      city:     'Rio de Janeiro',
      state:    'RJ',
      capacity: 40,
    },
  })

  const upa2 = await prisma.facility.upsert({
    where:  { id: 'facility-upa-campo-grande' },
    update: {},
    create: {
      id:       'facility-upa-campo-grande',
      name:     'UPA 24h Campo Grande',
      type:     FacilityType.UPA,
      city:     'Rio de Janeiro',
      state:    'RJ',
      capacity: 35,
    },
  })

  const clinic = await prisma.facility.upsert({
    where:  { id: 'facility-clinica-penha' },
    update: {},
    create: {
      id:       'facility-clinica-penha',
      name:     'Clínica da Família Penha',
      type:     FacilityType.CLINIC,
      city:     'Rio de Janeiro',
      state:    'RJ',
      capacity: 24,
    },
  })

  console.log(`  ✓ ${upa1.name}`)
  console.log(`  ✓ ${upa2.name}`)
  console.log(`  ✓ ${clinic.name}`)

  // ─── QueueMetrics baselines ───────────────────────────────────────────────
  const upa1Breakdown = { RED: 2, ORANGE: 7, YELLOW: 12, GREEN: 11, BLUE: 2 }
  const upa2Breakdown = { RED: 0, ORANGE: 3, YELLOW: 7,  GREEN: 8,  BLUE: 1 }
  const clinicBreakdown = { RED: 0, ORANGE: 1, YELLOW: 2, GREEN: 3, BLUE: 0 }

  await prisma.queueMetrics.upsert({
    where:  { facilityId: upa1.id },
    update: {},
    create: {
      facilityId:       upa1.id,
      currentLoad:      34,
      loadPercent:      85.0,
      avgWaitMinutes:   52,
      priorityBreakdown: {
        red:    { count: 2,  avgWait: 2   },
        orange: { count: 7,  avgWait: 14  },
        yellow: { count: 12, avgWait: 58  },
        green:  { count: 11, avgWait: 95  },
        blue:   { count: 2,  avgWait: 130 },
      },
    },
  })

  await prisma.queueMetrics.upsert({
    where:  { facilityId: upa2.id },
    update: {},
    create: {
      facilityId:       upa2.id,
      currentLoad:      19,
      loadPercent:      54.3,
      avgWaitMinutes:   28,
      priorityBreakdown: {
        red:    { count: 0, avgWait: null },
        orange: { count: 3, avgWait: 11   },
        yellow: { count: 7, avgWait: 32   },
        green:  { count: 8, avgWait: 48   },
        blue:   { count: 1, avgWait: 65   },
      },
    },
  })

  await prisma.queueMetrics.upsert({
    where:  { facilityId: clinic.id },
    update: {},
    create: {
      facilityId:       clinic.id,
      currentLoad:      6,
      loadPercent:      25.0,
      avgWaitMinutes:   15,
      priorityBreakdown: {
        red:    { count: 0, avgWait: null },
        orange: { count: 1, avgWait: 8    },
        yellow: { count: 2, avgWait: 18   },
        green:  { count: 3, avgWait: 25   },
        blue:   { count: 0, avgWait: null },
      },
    },
  })

  console.log('  ✓ QueueMetrics baselines seeded')

  // ─── Demo patient ─────────────────────────────────────────────────────────
  await prisma.patient.upsert({
    where:  { id: 'patient-demo' },
    update: {},
    create: {
      id:          'patient-demo',
      displayName: 'Paciente Demo',
      ageGroup:    AgeGroup.ADULT,
      ageYears:    35,
      gender:      null,
    },
  })

  console.log('  ✓ Demo patient seeded')

  // ─── 6h TriageLog backfill ────────────────────────────────────────────────
  // Creates simulated arrival records spread across the last 6 hours so the
  // Recharts trend chart shows a meaningful trendline on first load, before
  // the cron has accumulated enough real ticks.
  console.log('  Backfilling 6h of simulated arrivals...')

  await backfillFacilityHistory(upa1.id,   upa1Breakdown)
  console.log(`    ✓ ${upa1.name}: ${Object.values(upa1Breakdown).reduce((s,c)=>s+c,0)} arrivals`)

  await backfillFacilityHistory(upa2.id,   upa2Breakdown)
  console.log(`    ✓ ${upa2.name}: ${Object.values(upa2Breakdown).reduce((s,c)=>s+c,0)} arrivals`)

  await backfillFacilityHistory(clinic.id, clinicBreakdown)
  console.log(`    ✓ ${clinic.name}: ${Object.values(clinicBreakdown).reduce((s,c)=>s+c,0)} arrivals`)

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
