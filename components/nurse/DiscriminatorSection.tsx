'use client'

// components/nurse/DiscriminatorSection.tsx
// Animated discriminator checkboxes revealed when a chief complaint is selected.
//
// Animation design:
//   - DiscriminatorSection owns AnimatePresence internally.
//   - The parent TriageForm renders this component with key={selectedComplaintId}.
//   - Changing the key causes AnimatePresence to unmount the old motion.div (exit animation)
//     and mount the new one (enter animation), all within this component.
//   - Animation uses ONLY opacity + y (transform: translateY). No height animation —
//     WCAG 2.1 requires animations use only transform and opacity to avoid layout shifts.

import { AnimatePresence, motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

import type { Variants } from 'framer-motion'

const discriminatorVariants: Variants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: [0.55, 0.06, 0.68, 0.19] } },
}

interface DiscriminatorSectionProps {
  /** The unique key for the current flowchart — used to trigger AnimatePresence exit+enter */
  flowchartKey: string
  discriminators: string[]
  selected: string[]
  onToggle: (disc: string) => void
}

export function DiscriminatorSection({
  flowchartKey,
  discriminators,
  selected,
  onToggle,
}: DiscriminatorSectionProps) {
  return (
    <div>
      {/* Heading is always visible when this section is rendered */}
      <p className="text-base font-semibold mb-3">Discriminadores</p>

      <AnimatePresence mode="wait">
        {discriminators.length > 0 && (
          <motion.div
            key={flowchartKey}
            variants={discriminatorVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {discriminators.map((disc, i) => (
                <div key={disc} className="flex items-center gap-2">
                  <Checkbox
                    id={`disc-${i}`}
                    checked={selected.includes(disc)}
                    onCheckedChange={() => {
                      onToggle(disc)
                    }}
                  />
                  <Label
                    htmlFor={`disc-${i}`}
                    className="text-sm cursor-pointer"
                  >
                    {disc}
                  </Label>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
