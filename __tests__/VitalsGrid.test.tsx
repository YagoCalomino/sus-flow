/**
 * TRIAGE-03: VitalsGrid renders 6 inputs:
 *   painScore, spo2, heartRate, respiratoryRate, temperature, avpu (as Select)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VitalsGrid } from '@/components/nurse/VitalsGrid'
import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { TriageFormInput } from '@/lib/schemas/triage'

// Minimal RHF mock — VitalsGrid uses register(), errors, setValue(), watch()
function makeRegister(): UseFormRegister<TriageFormInput> {
  return ((name: string) => ({
    name,
    ref: vi.fn(),
    onChange: vi.fn(),
    onBlur: vi.fn(),
  })) as unknown as UseFormRegister<TriageFormInput>
}

function makeWatch(values: Partial<TriageFormInput> = {}): UseFormWatch<TriageFormInput> {
  return ((name?: string) => {
    if (!name) return values
    return (values as Record<string, unknown>)[name]
  }) as unknown as UseFormWatch<TriageFormInput>
}

const noErrors: FieldErrors<TriageFormInput> = {}
const noSetValue: UseFormSetValue<TriageFormInput> = vi.fn() as unknown as UseFormSetValue<TriageFormInput>

describe('TRIAGE-03: VitalsGrid renders all 6 vital fields', () => {
  it('renders the painScore input (label: "Dor")', () => {
    render(
      <VitalsGrid
        register={makeRegister()}
        errors={noErrors}
        setValue={noSetValue}
        watch={makeWatch()}
      />
    )
    expect(screen.getByLabelText(/Dor/i)).toBeDefined()
  })

  it('renders the spo2 input (label: "SpO2")', () => {
    render(
      <VitalsGrid
        register={makeRegister()}
        errors={noErrors}
        setValue={noSetValue}
        watch={makeWatch()}
      />
    )
    expect(screen.getByLabelText(/SpO2/i)).toBeDefined()
  })

  it('renders the heartRate input (label: "Frequência Cardíaca")', () => {
    render(
      <VitalsGrid
        register={makeRegister()}
        errors={noErrors}
        setValue={noSetValue}
        watch={makeWatch()}
      />
    )
    expect(screen.getByLabelText(/Frequência Cardíaca/i)).toBeDefined()
  })

  it('renders the respiratoryRate input (label: "Frequência Respiratória")', () => {
    render(
      <VitalsGrid
        register={makeRegister()}
        errors={noErrors}
        setValue={noSetValue}
        watch={makeWatch()}
      />
    )
    expect(screen.getByLabelText(/Frequência Respiratória/i)).toBeDefined()
  })

  it('renders the temperature input (label: "Temperatura")', () => {
    render(
      <VitalsGrid
        register={makeRegister()}
        errors={noErrors}
        setValue={noSetValue}
        watch={makeWatch()}
      />
    )
    expect(screen.getByLabelText(/Temperatura/i)).toBeDefined()
  })

  it('renders the AVPU select (label: "Nível de Consciência (AVPU)")', () => {
    render(
      <VitalsGrid
        register={makeRegister()}
        errors={noErrors}
        setValue={noSetValue}
        watch={makeWatch()}
      />
    )
    expect(screen.getByText(/Nível de Consciência \(AVPU\)/i)).toBeDefined()
  })

  it('renders exactly 5 number-type inputs (excludes avpu which is a Select)', () => {
    render(
      <VitalsGrid
        register={makeRegister()}
        errors={noErrors}
        setValue={noSetValue}
        watch={makeWatch()}
      />
    )
    const numberInputs = screen
      .getAllByRole('spinbutton') // type="number" inputs have spinbutton role
    expect(numberInputs).toHaveLength(5)
  })

  it('AVPU is rendered as a combobox (Select), not a plain number input', () => {
    render(
      <VitalsGrid
        register={makeRegister()}
        errors={noErrors}
        setValue={noSetValue}
        watch={makeWatch()}
      />
    )
    const comboboxes = screen.getAllByRole('combobox')
    expect(comboboxes.length).toBeGreaterThanOrEqual(1)
  })
})
