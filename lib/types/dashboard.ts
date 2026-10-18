export interface PrioritySlot {
  count: number
  avgWait: number | null
}

export interface PriorityBreakdownData {
  red: PrioritySlot
  orange: PrioritySlot
  yellow: PrioritySlot
  green: PrioritySlot
  blue: PrioritySlot
}

export interface FacilityPayload {
  id: string
  name: string
  type: 'UPA' | 'CLINIC'
  capacity: number
}

export interface QueueMetricsPayload {
  id: string
  facilityId: string
  currentLoad: number
  loadPercent: number
  avgWaitMinutes: number
  priorityBreakdown: PriorityBreakdownData
  computedAt: string
  updatedAt: string
  facility: FacilityPayload
}

export interface TrendBucket {
  bucket: string
  count: number
}

export interface FacilityTrend {
  facilityId: string
  buckets: TrendBucket[]
}

export interface PriorityBucket {
  bucket: string
  time: string
  RED: number
  ORANGE: number
  YELLOW: number
  GREEN: number
  BLUE: number
  total: number
}

export interface AnalyticsKPIs {
  peakHour: string
  peakCount: number
  movingAvgWait: number
  capacityPressure: number
}

export interface FacilityAnalytics {
  facilityId: string
  facilityName: string
  facilityType: 'UPA' | 'CLINIC'
  buckets: PriorityBucket[]
  kpis: AnalyticsKPIs
}
