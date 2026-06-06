/**
 * TRIAGE-01: FLOWCHARTS has exactly 15 entries, each with id, name,
 *            and discriminators array of 4-8 strings.
 */

import { describe, it, expect } from 'vitest'
import { FLOWCHARTS } from '@/lib/constants/flowcharts'

describe('TRIAGE-01: FLOWCHARTS constant', () => {
  it('has exactly 15 entries', () => {
    expect(FLOWCHARTS).toHaveLength(15)
  })

  it('every entry has a non-empty string id', () => {
    for (const flowchart of FLOWCHARTS) {
      expect(typeof flowchart.id).toBe('string')
      expect(flowchart.id.length).toBeGreaterThan(0)
    }
  })

  it('every entry has a non-empty string name', () => {
    for (const flowchart of FLOWCHARTS) {
      expect(typeof flowchart.name).toBe('string')
      expect(flowchart.name.length).toBeGreaterThan(0)
    }
  })

  it('every entry has a discriminators array with 4 to 8 strings', () => {
    for (const flowchart of FLOWCHARTS) {
      expect(Array.isArray(flowchart.discriminators)).toBe(true)
      expect(flowchart.discriminators.length).toBeGreaterThanOrEqual(4)
      expect(flowchart.discriminators.length).toBeLessThanOrEqual(8)
      for (const disc of flowchart.discriminators) {
        expect(typeof disc).toBe('string')
        expect(disc.length).toBeGreaterThan(0)
      }
    }
  })

  it('ids are unique across all entries', () => {
    const ids = FLOWCHARTS.map((f) => f.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(FLOWCHARTS.length)
  })

  it('contains the 15 expected flowchart ids', () => {
    const expectedIds = [
      'dor-no-peito',
      'cefaleia',
      'dificuldade-respiratoria',
      'dor-abdominal',
      'trauma-em-membro',
      'febre-alta',
      'dor-lombar',
      'alteracao-da-consciencia',
      'vomitos-nauseas',
      'crise-alergica',
      'crise-convulsiva',
      'dor-garganta-ouvido',
      'lesao-em-pele',
      'intoxicacao-overdose',
      'dor-no-olho',
    ]
    const actualIds = FLOWCHARTS.map((f) => f.id)
    for (const id of expectedIds) {
      expect(actualIds).toContain(id)
    }
  })
})
