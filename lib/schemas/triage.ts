import { z } from 'zod'

export const TriageFormSchema = z.object({
  facilityId:      z.string().min(1, 'Selecione a unidade de saúde'),
  chiefComplaint:  z.string().min(1, 'Selecione a queixa principal'),
  discriminators:  z.array(z.string()).default([]),
  painScore:       z.number().int().min(0).max(10).optional().nullable(),
  spo2:            z.number().int().min(70).max(100).optional().nullable(),
  heartRate:       z.number().int().min(20).max(300).optional().nullable(),
  respiratoryRate: z.number().int().min(1).max(60).optional().nullable(),
  temperature:     z.number().min(30).max(45).optional().nullable(),
  avpu:            z.enum(['alerta', 'voz', 'dor', 'sem-resposta']).optional().nullable(),
  freeText:        z.string().max(2000).optional().default(''),
  confirmedColor:  z.enum(['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'], {
    required_error: 'Selecione a prioridade',
  }).optional(),
})

export type TriageFormValues = z.infer<typeof TriageFormSchema>
/** Input type: fields with defaults are optional; used by RHF + zodResolver */
export type TriageFormInput = z.input<typeof TriageFormSchema>

/**
 * Schema for classifyTriage — identical to TriageFormSchema but WITHOUT confirmedColor.
 * Nurses no longer select a priority during form fill; the AI owns the first classification.
 * confirmedColor is injected at save time via saveTriage.
 */
export const TriageFormSchemaForClassify = z.object({
  facilityId:      z.string().min(1, 'Selecione a unidade de saúde'),
  chiefComplaint:  z.string().min(1, 'Selecione a queixa principal'),
  discriminators:  z.array(z.string()).default([]),
  painScore:       z.number().int().min(0).max(10).optional().nullable(),
  spo2:            z.number().int().min(70).max(100).optional().nullable(),
  heartRate:       z.number().int().min(20).max(300).optional().nullable(),
  respiratoryRate: z.number().int().min(1).max(60).optional().nullable(),
  temperature:     z.number().min(30).max(45).optional().nullable(),
  avpu:            z.enum(['alerta', 'voz', 'dor', 'sem-resposta']).optional().nullable(),
  freeText:        z.string().max(2000).optional().default(''),
})

export type TriageFormValuesForClassify = z.infer<typeof TriageFormSchemaForClassify>

/**
 * AIClassificationSchema — Zod schema for structured Claude output and rule engine results.
 * Used with Output.object({ schema: AIClassificationSchema }) in classifyTriage.
 * confidence is stored as integer 0-100 — display directly as {confidence}%.
 */
export const AIClassificationSchema = z.object({
  priority:   z.enum(['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE']),
  confidence: z.number().int().min(0).max(100),
  reasoning:  z.array(z.string()).min(1).max(5),
  disclaimer: z.string(),
})

export type AIClassificationResult = z.infer<typeof AIClassificationSchema>
