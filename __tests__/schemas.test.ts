/**
 * TRIAGE-04: TriageFormSchema:
 *   - freeText z.string().max(2000)
 *   - respiratoryRate min(1)
 *   - confirmedColor is required (required_error: 'Selecione a prioridade')
 */

import { describe, it, expect } from 'vitest'
import { TriageFormSchema } from '@/lib/schemas/triage'

// Minimal valid payload to use as baseline for isolated field tests
const validBase = {
  facilityId: 'facility-1',
  chiefComplaint: 'dor-no-peito',
  discriminators: [],
  confirmedColor: 'RED' as const,
}

describe('TRIAGE-04: TriageFormSchema field constraints', () => {
  describe('freeText field', () => {
    it('accepts freeText up to 2000 characters', () => {
      const result = TriageFormSchema.safeParse({
        ...validBase,
        freeText: 'a'.repeat(2000),
      })
      expect(result.success).toBe(true)
    })

    it('rejects freeText exceeding 2000 characters', () => {
      const result = TriageFormSchema.safeParse({
        ...validBase,
        freeText: 'a'.repeat(2001),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'))
        expect(paths).toContain('freeText')
      }
    })

    it('accepts missing freeText (optional with default "")', () => {
      const result = TriageFormSchema.safeParse({ ...validBase })
      expect(result.success).toBe(true)
    })
  })

  describe('respiratoryRate field', () => {
    it('accepts respiratoryRate of 1 (minimum valid value)', () => {
      const result = TriageFormSchema.safeParse({
        ...validBase,
        respiratoryRate: 1,
      })
      expect(result.success).toBe(true)
    })

    it('rejects respiratoryRate of 0 (below minimum of 1)', () => {
      const result = TriageFormSchema.safeParse({
        ...validBase,
        respiratoryRate: 0,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'))
        expect(paths).toContain('respiratoryRate')
      }
    })

    it('accepts null respiratoryRate (optional nullable)', () => {
      const result = TriageFormSchema.safeParse({
        ...validBase,
        respiratoryRate: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('confirmedColor field', () => {
    it('is required — rejects when confirmedColor is absent', () => {
      const { confirmedColor: _omit, ...withoutColor } = validBase as Record<string, unknown>
      const result = TriageFormSchema.safeParse(withoutColor)
      expect(result.success).toBe(false)
    })

    it('fails with required_error message when confirmedColor is missing', () => {
      const { confirmedColor: _omit, ...withoutColor } = validBase as Record<string, unknown>
      const result = TriageFormSchema.safeParse(withoutColor)
      expect(result.success).toBe(false)
      if (!result.success) {
        const colorIssue = result.error.issues.find(
          (i) => i.path.includes('confirmedColor')
        )
        expect(colorIssue).toBeDefined()
        // The required_error is 'Selecione a prioridade'
        expect(colorIssue?.message).toBe('Selecione a prioridade')
      }
    })

    it('accepts all five valid priority values', () => {
      for (const color of ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'] as const) {
        const result = TriageFormSchema.safeParse({
          ...validBase,
          confirmedColor: color,
        })
        expect(result.success).toBe(true)
      }
    })

    it('rejects an invalid confirmedColor value', () => {
      const result = TriageFormSchema.safeParse({
        ...validBase,
        confirmedColor: 'PURPLE',
      })
      expect(result.success).toBe(false)
    })
  })
})
