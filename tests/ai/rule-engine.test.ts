import { describe, it, expect } from 'vitest'
import { runManchesterRuleEngine } from '@/lib/ai/classifier'
import type { TriageFormValuesForClassify } from '@/lib/schemas/triage'

// Base "empty" submission — no vitals, no discriminators
const emptySubmission: TriageFormValuesForClassify = {
  facilityId: 'facility-1',
  chiefComplaint: 'dor-no-peito',
  discriminators: [],
  painScore: null,
  spo2: null,
  heartRate: null,
  respiratoryRate: null,
  temperature: null,
  avpu: null,
  freeText: '',
}

describe('runManchesterRuleEngine', () => {
  it('returns RED with confidence >= 0.95 for AVPU sem-resposta', () => {
    const result = runManchesterRuleEngine({
      ...emptySubmission,
      avpu: 'sem-resposta',
    })
    expect(result.result.priority).toBe('RED')
    expect(result.confidence).toBeGreaterThanOrEqual(0.95)
  })

  it('returns RED for spo2 = 80', () => {
    const result = runManchesterRuleEngine({
      ...emptySubmission,
      spo2: 80,
    })
    expect(result.result.priority).toBe('RED')
  })

  it('returns RED for heartRate = 200', () => {
    const result = runManchesterRuleEngine({
      ...emptySubmission,
      heartRate: 200,
    })
    expect(result.result.priority).toBe('RED')
  })

  it('returns RED for respiratoryRate = 5', () => {
    const result = runManchesterRuleEngine({
      ...emptySubmission,
      respiratoryRate: 5,
    })
    expect(result.result.priority).toBe('RED')
  })

  it('returns ORANGE (not RED) with confidence ~0.85 for spo2 = 88 (no RED flag)', () => {
    const result = runManchesterRuleEngine({
      ...emptySubmission,
      spo2: 88,
    })
    // spo2 88 is in ORANGE range (85-91), should be ORANGE but NOT RED
    expect(result.result.priority).toBe('ORANGE')
    expect(result.result.priority).not.toBe('RED')
    expect(result.confidence).toBeGreaterThanOrEqual(0.80)
    expect(result.confidence).toBeLessThanOrEqual(0.95)
  })

  it('returns ORANGE for dor-no-peito with Dor irradiando para o braço/mandíbula', () => {
    const result = runManchesterRuleEngine({
      ...emptySubmission,
      chiefComplaint: 'dor-no-peito',
      discriminators: ['Dor irradiando para o braço/mandíbula'],
    })
    expect(result.result.priority).toBe('ORANGE')
  })

  it('reasoning is a non-empty string[] with between 1 and 5 entries', () => {
    const result = runManchesterRuleEngine({
      ...emptySubmission,
      avpu: 'sem-resposta',
    })
    expect(Array.isArray(result.result.reasoning)).toBe(true)
    expect(result.result.reasoning.length).toBeGreaterThanOrEqual(1)
    expect(result.result.reasoning.length).toBeLessThanOrEqual(5)
    result.result.reasoning.forEach((r) => expect(typeof r).toBe('string'))
  })

  it('returns BLUE with confidence <= 0.3 for empty submission', () => {
    const result = runManchesterRuleEngine(emptySubmission)
    expect(result.result.priority).toBe('BLUE')
    expect(result.confidence).toBeLessThanOrEqual(0.3)
  })

  it('confidence is always within 0.0–1.0 inclusive', () => {
    const cases: TriageFormValuesForClassify[] = [
      emptySubmission,
      { ...emptySubmission, avpu: 'sem-resposta' },
      { ...emptySubmission, spo2: 88 },
      { ...emptySubmission, discriminators: ['Dor irradiando para o braço/mandíbula'] },
      { ...emptySubmission, heartRate: 120, painScore: 8 },
    ]
    cases.forEach((c) => {
      const result = runManchesterRuleEngine(c)
      expect(result.confidence).toBeGreaterThanOrEqual(0.0)
      expect(result.confidence).toBeLessThanOrEqual(1.0)
    })
  })
})
