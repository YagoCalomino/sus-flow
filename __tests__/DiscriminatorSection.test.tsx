/**
 * TRIAGE-02: DiscriminatorSection renders checkboxes for provided discriminators;
 *            clears on key change (AnimatePresence exit + enter via parent key prop).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// framer-motion's AnimatePresence and motion need to be mocked in jsdom
// because jsdom does not support CSS animations / layout measurements.
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

import { DiscriminatorSection } from '@/components/nurse/DiscriminatorSection'
import React from 'react'

const SAMPLE_DISCRIMINATORS = [
  'Dor irradiando para o braço/mandíbula',
  'Dispneia associada',
  'Diaforese',
  'Dor com início súbito',
]

describe('TRIAGE-02: DiscriminatorSection component', () => {
  it('renders a checkbox for each provided discriminator', () => {
    render(
      <DiscriminatorSection
        flowchartKey="dor-no-peito"
        discriminators={SAMPLE_DISCRIMINATORS}
        selected={[]}
        onToggle={vi.fn()}
      />
    )
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(SAMPLE_DISCRIMINATORS.length)
  })

  it('renders the label text for each discriminator', () => {
    render(
      <DiscriminatorSection
        flowchartKey="dor-no-peito"
        discriminators={SAMPLE_DISCRIMINATORS}
        selected={[]}
        onToggle={vi.fn()}
      />
    )
    for (const disc of SAMPLE_DISCRIMINATORS) {
      expect(screen.getByText(disc)).toBeDefined()
    }
  })

  it('marks the correct checkboxes as checked based on selected prop', () => {
    const selected = [SAMPLE_DISCRIMINATORS[0], SAMPLE_DISCRIMINATORS[2]]
    render(
      <DiscriminatorSection
        flowchartKey="dor-no-peito"
        discriminators={SAMPLE_DISCRIMINATORS}
        selected={selected}
        onToggle={vi.fn()}
      />
    )
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(checkboxes[0]).toBeChecked()
    expect(checkboxes[1]).not.toBeChecked()
    expect(checkboxes[2]).toBeChecked()
    expect(checkboxes[3]).not.toBeChecked()
  })

  it('calls onToggle with the discriminator string when a checkbox is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <DiscriminatorSection
        flowchartKey="dor-no-peito"
        discriminators={SAMPLE_DISCRIMINATORS}
        selected={[]}
        onToggle={onToggle}
      />
    )
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])
    expect(onToggle).toHaveBeenCalledWith(SAMPLE_DISCRIMINATORS[1])
  })

  it('renders new discriminators when flowchartKey and discriminators change (simulates key-based remount)', () => {
    const CEFALEIA_DISCRIMINATORS = [
      'Início súbito "em trovoada"',
      'Febre + rigidez de nuca',
      'Alteração do nível de consciência',
    ]

    // First render: dor-no-peito
    const { rerender } = render(
      <DiscriminatorSection
        flowchartKey="dor-no-peito"
        discriminators={SAMPLE_DISCRIMINATORS}
        selected={[SAMPLE_DISCRIMINATORS[0]]}
        onToggle={vi.fn()}
      />
    )

    // Verify initial discriminators are present
    expect(screen.getByText(SAMPLE_DISCRIMINATORS[0])).toBeDefined()

    // Re-render with new flowchart — simulates parent changing the key
    rerender(
      <DiscriminatorSection
        flowchartKey="cefaleia"
        discriminators={CEFALEIA_DISCRIMINATORS}
        selected={[]}
        onToggle={vi.fn()}
      />
    )

    // New discriminators are shown and none are checked (selected=[])
    for (const disc of CEFALEIA_DISCRIMINATORS) {
      expect(screen.getByText(disc)).toBeDefined()
    }
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    for (const cb of checkboxes) {
      expect(cb).not.toBeChecked()
    }
  })

  it('renders nothing inside AnimatePresence when discriminators array is empty', () => {
    render(
      <DiscriminatorSection
        flowchartKey="empty"
        discriminators={[]}
        selected={[]}
        onToggle={vi.fn()}
      />
    )
    const checkboxes = screen.queryAllByRole('checkbox')
    expect(checkboxes).toHaveLength(0)
  })
})
