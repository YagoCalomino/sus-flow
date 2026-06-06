'use client'

// components/nurse/TriageForm.tsx
// Phase 5 — Two-state AI flow:
//   Fill state    → "Analisar Triagem com IA" triggers classifyTriage (no DB write)
//   Confirm state → AISuggestionCard + Confirmar / Discordar → saveTriage (DB write)
//
// Security: classifyTriage + saveTriage perform server-side session check as first op.
// Animation: opacity + y only — no height/layout animation (WCAG 2.1).

import { useTransition, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { TriageFormSchemaForClassify, type TriageFormValuesForClassify } from '@/lib/schemas/triage'
import type { AIClassificationResult } from '@/lib/schemas/triage'
import { FLOWCHARTS } from '@/lib/constants/flowcharts'
import { classifyTriage, saveTriage } from '@/app/(nurse)/triage/actions'

import { AISuggestionCard } from '@/components/nurse/AISuggestionCard'
import { PrioritySelector } from '@/components/nurse/PrioritySelector'
import { DiscriminatorSection } from '@/components/nurse/DiscriminatorSection'
import { VitalsGrid } from '@/components/nurse/VitalsGrid'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

import type { PriorityKey } from '@/lib/constants/triage'

// ---------------------------------------------------------------------------
// Input type for RHF (z.input<> — fields with defaults are optional)
// ---------------------------------------------------------------------------
type TriageFormInput = {
  facilityId: string
  chiefComplaint: string
  discriminators?: string[]
  painScore?: number | null
  spo2?: number | null
  heartRate?: number | null
  respiratoryRate?: number | null
  temperature?: number | null
  avpu?: 'alerta' | 'voz' | 'dor' | 'sem-resposta' | null
  freeText?: string
}

// ---------------------------------------------------------------------------
// Animation variants (opacity + y only — WCAG 2.1 compliance)
// ---------------------------------------------------------------------------
const aiCardVariants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' as const } },
}

const overrideVariants = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15, ease: 'easeIn' as const } },
}

// ---------------------------------------------------------------------------
// Default values without confirmedColor
// ---------------------------------------------------------------------------
const DEFAULT_VALUES: TriageFormInput = {
  facilityId: '',
  chiefComplaint: '',
  discriminators: [],
  freeText: '',
  painScore: undefined,
  spo2: undefined,
  heartRate: undefined,
  respiratoryRate: undefined,
  temperature: undefined,
  avpu: undefined,
}

interface TriageFormProps {
  facilities: Array<{ id: string; name: string }>
}

export function TriageForm({ facilities }: TriageFormProps) {
  // Dual transitions: classify (advisory, no DB) and save (DB write)
  const [isClassifying, startClassifyTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)

  // AI result from classifyTriage — null = fill state, non-null = confirmation state
  const [aiResult, setAiResult] = useState<(AIClassificationResult & { method: 'rule_engine' | 'gemini' }) | null>(null)
  // Override flow state
  const [showOverride, setShowOverride] = useState(false)
  const [overridePriority, setOverridePriority] = useState<PriorityKey | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<TriageFormInput>({
    resolver: zodResolver(TriageFormSchemaForClassify),
    defaultValues: DEFAULT_VALUES,
  })

  const watchedComplaint = watch('chiefComplaint')
  const currentFlowchart = FLOWCHARTS.find((f) => f.id === watchedComplaint) ?? null

  // ---------------------------------------------------------------------------
  // resetForm — clears all AI state, resets RHF, increments formKey
  // ---------------------------------------------------------------------------
  function resetForm() {
    setAiResult(null)
    setShowOverride(false)
    setOverridePriority(null)
    reset(DEFAULT_VALUES)
    setFormKey((k) => k + 1)
  }

  // ---------------------------------------------------------------------------
  // handleAnalyze — called on form submit (RHF validates first)
  // ---------------------------------------------------------------------------
  function handleAnalyze(data: TriageFormInput) {
    startClassifyTransition(async () => {
      const r = await classifyTriage(data as TriageFormValuesForClassify)
      if (!r.success) {
        toast.error('Erro na análise da IA', {
          description: 'Não foi possível classificar automaticamente. Selecione a prioridade manualmente.',
          duration: 8000,
        })
        setShowOverride(true)
        return
      }
      setAiResult({ ...r.data, method: r.method })
    })
  }

  // ---------------------------------------------------------------------------
  // handleConfirm — nurse accepts AI suggestion; nurseOverride = false
  // ---------------------------------------------------------------------------
  function handleConfirm() {
    if (!aiResult) return
    startSaveTransition(async () => {
      const r = await saveTriage({
        formData: getValues() as TriageFormValuesForClassify,
        aiResult,
        confirmedColor: aiResult.priority,
        nurseOverride: false,
        aiMethod: aiResult.method,
      })
      if (r.success) {
        toast.success('Triagem registrada com sucesso', {
          description: 'Prioridade sugerida pela IA confirmada.',
          duration: 4000,
        })
        resetForm()
      } else {
        toast.error('Erro ao salvar triagem', {
          description: r.error ?? 'Tente novamente.',
          duration: 6000,
        })
      }
    })
  }

  // ---------------------------------------------------------------------------
  // handleSaveOverride — nurse overrides AI suggestion; nurseOverride = true
  // ---------------------------------------------------------------------------
  function handleSaveOverride() {
    if (!overridePriority) return
    startSaveTransition(async () => {
      // Build a minimal aiResult for the override path.
      // If AI was never reached (error fallback), synthesize a manual-classification aiResult.
      const effectiveAiResult: AIClassificationResult & { method: 'rule_engine' | 'gemini' } = aiResult ?? {
        priority: overridePriority,
        confidence: 0,
        reasoning: ['Classificação manual pela enfermagem (IA indisponível).'],
        disclaimer: 'Classificação realizada manualmente sem suporte de IA.',
        method: 'rule_engine',
      }
      const r = await saveTriage({
        formData: getValues() as TriageFormValuesForClassify,
        aiResult: effectiveAiResult,
        confirmedColor: overridePriority,
        nurseOverride: true,
        aiMethod: effectiveAiResult.method,
      })
      if (r.success) {
        toast.success('Triagem registrada com sucesso', {
          description: 'Prioridade alterada manualmente pela enfermagem.',
          duration: 4000,
        })
        resetForm()
      } else {
        toast.error('Erro ao salvar triagem', {
          description: r.error ?? 'Tente novamente.',
          duration: 6000,
        })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Triagem</CardTitle>
      </CardHeader>
      <CardContent>
        <form key={formKey} onSubmit={handleSubmit(handleAnalyze)} noValidate className="space-y-6">

          {/* Section 1 — Unidade de Saúde */}
          <div>
            <Label htmlFor="facilityId-trigger" className="mb-1.5 block">
              Unidade de Saúde <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="facilityId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || null}
                  onValueChange={(val) => {
                    if (val) field.onChange(val)
                  }}
                >
                  <SelectTrigger id="facilityId-trigger" className="w-full">
                    <SelectValue placeholder="Selecione a unidade">
                      {field.value ? (facilities.find((f) => f.id === field.value)?.name ?? undefined) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.facilityId && (
              <p className="text-xs text-destructive mt-1">{errors.facilityId.message}</p>
            )}
          </div>

          <Separator />

          {/* Section 2 — Queixa Principal */}
          <div>
            <Label htmlFor="chiefComplaint-trigger" className="mb-1.5 block">
              Queixa Principal <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="chiefComplaint"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || null}
                  onValueChange={(val) => {
                    if (val) {
                      field.onChange(val)
                      // Clear discriminators when complaint changes
                      setValue('discriminators', [], { shouldDirty: true, shouldValidate: false })
                    }
                  }}
                >
                  <SelectTrigger id="chiefComplaint-trigger" className="w-full">
                    <SelectValue placeholder="Selecione a queixa">
                      {field.value ? (FLOWCHARTS.find((f) => f.id === field.value)?.name ?? undefined) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FLOWCHARTS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.chiefComplaint && (
              <p className="text-xs text-destructive mt-1">{errors.chiefComplaint.message}</p>
            )}
          </div>

          {/* Section 3 — Discriminadores (animated reveal) */}
          <AnimatePresence mode="wait">
            {currentFlowchart && (
              <motion.div
                key={currentFlowchart.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
              >
                <Separator className="mb-6" />
                <DiscriminatorSection
                  flowchartKey={currentFlowchart.id}
                  discriminators={currentFlowchart.discriminators}
                  selected={watch('discriminators') ?? []}
                  onToggle={(disc) => {
                    const current = watch('discriminators') ?? []
                    setValue(
                      'discriminators',
                      current.includes(disc)
                        ? current.filter((d) => d !== disc)
                        : [...current, disc],
                      { shouldDirty: true }
                    )
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Separator />

          {/* Section 4 — Sinais Vitais */}
          <div>
            <p className="text-base font-semibold mb-3">Sinais Vitais</p>
            <VitalsGrid
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
            />
          </div>

          <Separator />

          {/* Section 5 — Descrição dos Sintomas (free text — Phase 5 copy) */}
          {/* Controller keeps value in RHF React state; uncontrolled register can silently drop the value on getValues() */}
          <div>
            <Label htmlFor="freeText" className="mb-1.5 block">
              Descrição dos Sintomas{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Controller
              name="freeText"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="freeText"
                  rows={3}
                  placeholder="Descreva os sintomas em linguagem natural. Texto livre é analisado pela IA para sugestão de prioridade."
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              )}
            />
            {errors.freeText && (
              <p className="text-xs text-destructive mt-1">{errors.freeText.message}</p>
            )}
          </div>

          <Separator />

          {/* AI Suggestion Card — appears after classification (confirmation state) */}
          <AnimatePresence mode="wait">
            {aiResult && (
              <motion.div
                key="ai-suggestion"
                variants={aiCardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <AISuggestionCard
                  priority={aiResult.priority}
                  confidence={aiResult.confidence}
                  reasoning={aiResult.reasoning}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation state action buttons */}
          {aiResult && (
            <div className="flex flex-col gap-3 md:flex-row">
              <Button
                type="button"
                variant="default"
                className="flex-1"
                disabled={isSaving}
                aria-busy={isSaving}
                onClick={handleConfirm}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Confirmar Sugestão (Salvar)'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={isSaving}
                onClick={() => setShowOverride(true)}
              >
                Discordar / Alterar Manualmente
              </Button>
            </div>
          )}

          {/* Override / Error fallback — PrioritySelector + Salvar Triagem */}
          <AnimatePresence>
            {showOverride && (
              <motion.div
                key="override-selector"
                variants={overrideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-3"
              >
                <PrioritySelector value={overridePriority} onChange={setOverridePriority} />
                <Button
                  type="button"
                  variant="default"
                  className="w-full"
                  disabled={!overridePriority || isSaving}
                  aria-busy={isSaving}
                  onClick={handleSaveOverride}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Triagem'
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fill state submit button — only shown when no AI result yet */}
          {!aiResult && !showOverride && (
            <Button
              type="submit"
              disabled={isClassifying}
              aria-busy={isClassifying}
              className="w-full"
              variant="default"
            >
              {isClassifying ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Analisando...
                </>
              ) : (
                'Analisar Triagem com IA'
              )}
            </Button>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">* Campo obrigatório</p>
      </CardFooter>
    </Card>
  )
}
