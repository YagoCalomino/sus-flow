import { TriagePriority, AgeGroup } from '@prisma/client'

export const FACILITY_MULTIPLIERS: Record<string, number> = {
  'facility-upa-marechal-hermes': 1.5,
  'facility-upa-campo-grande':    1.0,
  'facility-clinica-penha':       0.4,
}

const CHIEF_COMPLAINTS = [
  'Dor no peito', 'Dificuldade para respirar', 'Febre alta', 'Dor abdominal',
  'Cefaleia intensa', 'Trauma em membro', 'Vômitos persistentes',
  'Tontura e fraqueza', 'Dor lombar', 'Crise alérgica',
]

const PRIORITY_WEIGHTS: { priority: TriagePriority; weight: number }[] = [
  { priority: TriagePriority.RED,    weight: 5  },
  { priority: TriagePriority.ORANGE, weight: 15 },
  { priority: TriagePriority.YELLOW, weight: 30 },
  { priority: TriagePriority.GREEN,  weight: 40 },
  { priority: TriagePriority.BLUE,   weight: 10 },
]

const WAIT_RANGES: Record<TriagePriority, [number, number]> = {
  [TriagePriority.RED]:    [0,   2  ],
  [TriagePriority.ORANGE]: [8,   15 ],
  [TriagePriority.YELLOW]: [45,  75 ],
  [TriagePriority.GREEN]:  [100, 140],
  [TriagePriority.BLUE]:   [200, 280],
}

/**
 * Returns a time-of-day multiplier based on BRT (UTC-3) hour.
 * 5-band multiplier table:
 *
 * Band       | BRT hours | Multiplier
 * -----------|-----------|----------
 * Morning peak  | 6–9h   | 1.4
 * Mid-morning   | 10–12h | 1.1
 * Afternoon dip | 13–15h | 0.8
 * Evening surge | 16–20h | 1.3
 * Night         | 21–5h  | 0.6
 */
export function getTimeOfDayMultiplier(): number {
  const brtHour = (new Date().getUTCHours() - 3 + 24) % 24
  if (brtHour >= 6  && brtHour < 10) return 1.4
  if (brtHour >= 10 && brtHour < 13) return 1.1
  if (brtHour >= 13 && brtHour < 16) return 0.8
  if (brtHour >= 16 && brtHour < 21) return 1.3
  return 0.6
}

export function selectPriority(): TriagePriority {
  const total = PRIORITY_WEIGHTS.reduce((s, w) => s + w.weight, 0)
  let rand = Math.random() * total
  for (const { priority, weight } of PRIORITY_WEIGHTS) {
    rand -= weight
    if (rand <= 0) return priority
  }
  return TriagePriority.GREEN
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export interface SimulatedArrival {
  patientName: string
  ageGroup: AgeGroup
  chiefComplaint: string
  priority: TriagePriority
  waitMinutes: number
  arrivalAt: Date
}

export function generateArrivals(count: number): SimulatedArrival[] {
  return Array.from({ length: count }, () => {
    const priority = selectPriority()
    const [minWait, maxWait] = WAIT_RANGES[priority]
    const minutesAgo = randInt(1, 59)
    return {
      patientName:    `Paciente #${randInt(1000, 9999)}`,
      ageGroup:       AgeGroup.ADULT,
      chiefComplaint: CHIEF_COMPLAINTS[randInt(0, CHIEF_COMPLAINTS.length - 1)],
      priority,
      waitMinutes:    randInt(minWait, maxWait),
      arrivalAt:      new Date(Date.now() - minutesAgo * 60 * 1000),
    }
  })
}
