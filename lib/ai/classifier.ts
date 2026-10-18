/**
 * lib/ai/classifier.ts
 *
 * Pure synchronous Manchester Triage System rule engine.
 * No imports from the 'ai' package — this runs on any JS environment.
 *
 * Exported:
 *   runManchesterRuleEngine(data) — computes priority + confidence + reasoning without DB or AI model
 */

import { PRIORITY_META } from '@/lib/constants/triage'
import type { PriorityKey } from '@/lib/constants/triage'
import type { TriageFormValuesForClassify } from '@/lib/schemas/triage'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RuleEngineResult = {
  priority: PriorityKey
  confidence: number // 0.0 – 1.0
  reasoning: string[] // pt-BR bullets, max 5
  disclaimer: string
}

type InternalRuleResult = {
  result: RuleEngineResult
  confidence: number
}

// ---------------------------------------------------------------------------
// Disclaimer
// ---------------------------------------------------------------------------

const DISCLAIMER =
  'Atenção: Sugestão gerada por IA. A decisão final e responsabilidade clínica são exclusivas do enfermeiro(a).'

// ---------------------------------------------------------------------------
// Discriminator weight table
// [ASSUMED] — Priority-to-weight mapping derived from Manchester Triage System
// clinical knowledge. All 15 flowcharts from lib/constants/flowcharts.ts are covered.
// Values should be reviewed against official MTS clinical references.
// ---------------------------------------------------------------------------

type DiscriminatorWeight = {
  priority: PriorityKey
  weight: number
}

const DISCRIMINATOR_WEIGHTS: Record<string, DiscriminatorWeight> = {
  // ---- dor-no-peito (Chest Pain) ----
  'Dor irradiando para o braço/mandíbula':    { priority: 'ORANGE', weight: 0.80 },
  'Dispneia associada':                        { priority: 'ORANGE', weight: 0.60 },
  'Diaforese':                                 { priority: 'ORANGE', weight: 0.55 },
  'Dor com início súbito':                     { priority: 'YELLOW', weight: 0.45 },
  'Histórico cardíaco prévio':                 { priority: 'YELLOW', weight: 0.35 },
  'Dor em repouso':                            { priority: 'YELLOW', weight: 0.40 },

  // ---- cefaleia (Headache) ----
  'Início súbito "em trovoada"':               { priority: 'RED',    weight: 0.95 },
  'Febre + rigidez de nuca':                   { priority: 'RED',    weight: 0.90 },
  'Alteração do nível de consciência':         { priority: 'ORANGE', weight: 0.75 },
  'Dor progressivamente pior':                 { priority: 'YELLOW', weight: 0.45 },
  'Cefaleia com vômito em jato':               { priority: 'ORANGE', weight: 0.65 },
  'Trauma craniano recente':                   { priority: 'ORANGE', weight: 0.60 },

  // ---- dificuldade-respiratoria (Respiratory Distress) ----
  'SpO2 < 92%':                                { priority: 'ORANGE', weight: 0.80 },
  'Uso de musculatura acessória':              { priority: 'ORANGE', weight: 0.70 },
  'Estridor':                                  { priority: 'RED',    weight: 0.90 },
  'Cianose':                                   { priority: 'RED',    weight: 0.85 },
  'Incapaz de falar frases completas':         { priority: 'ORANGE', weight: 0.65 },
  'Histórico de asma/DPOC':                    { priority: 'YELLOW', weight: 0.35 },

  // ---- dor-abdominal (Abdominal Pain) ----
  'Dor de início súbito e intensidade máxima': { priority: 'ORANGE', weight: 0.75 },
  'Rigidez abdominal (abdômen em tábua)':      { priority: 'RED',    weight: 0.90 },
  'Sinais de choque (hipotensão, taquicardia)':{ priority: 'RED',    weight: 0.90 },
  'Dor irradiando para ombro/dorso':           { priority: 'ORANGE', weight: 0.65 },
  'Sangramento gastrointestinal associado':    { priority: 'ORANGE', weight: 0.70 },
  'Histórico de cirurgia abdominal prévia':    { priority: 'YELLOW', weight: 0.35 },
  'Dor progressiva nas últimas 24h':           { priority: 'YELLOW', weight: 0.40 },

  // ---- trauma-em-membro (Limb Trauma) ----
  'Deformidade visível ou crepitação':         { priority: 'ORANGE', weight: 0.70 },
  'Comprometimento vascular (pulso ausente, palidez)': { priority: 'RED', weight: 0.90 },
  'Comprometimento neurológico distal':        { priority: 'ORANGE', weight: 0.75 },
  'Trauma de alta energia (queda de altura, acidente de trânsito)': { priority: 'ORANGE', weight: 0.65 },
  'Ferimento aberto com exposição óssea':      { priority: 'ORANGE', weight: 0.75 },
  'Incapacidade funcional completa do membro': { priority: 'YELLOW', weight: 0.50 },

  // ---- febre-alta (High Fever) ----
  'Temperatura ≥ 39,5°C':                      { priority: 'YELLOW', weight: 0.55 },
  'Rigidez de nuca':                           { priority: 'RED',    weight: 0.90 },
  'Petéquias ou rash hemorrágico':             { priority: 'RED',    weight: 0.90 },
  'Alteração do estado mental':                { priority: 'ORANGE', weight: 0.80 },
  'Imunossupressão conhecida':                 { priority: 'ORANGE', weight: 0.60 },
  'Febre com duração superior a 5 dias':       { priority: 'YELLOW', weight: 0.40 },
  'Sinais de sepse (taquicardia + hipotensão)':{ priority: 'RED',    weight: 0.90 },

  // ---- dor-lombar (Low Back Pain) ----
  'Déficit neurológico em membros inferiores': { priority: 'ORANGE', weight: 0.75 },
  'Perda de controle vesical ou intestinal':   { priority: 'ORANGE', weight: 0.70 },
  'Dor irradiando para membro inferior (ciatalgia)': { priority: 'YELLOW', weight: 0.45 },
  'Trauma recente na coluna':                  { priority: 'ORANGE', weight: 0.60 },
  'Dor noturna intensa que não melhora em repouso': { priority: 'YELLOW', weight: 0.50 },
  'Febre associada à dor':                     { priority: 'ORANGE', weight: 0.55 },

  // ---- alteracao-da-consciencia (Altered Consciousness) ----
  'Glasgow < 9 (resposta apenas à dor ou sem resposta)': { priority: 'RED', weight: 0.95 },
  'Convulsões associadas':                     { priority: 'RED',    weight: 0.85 },
  'Assimetria pupilar':                        { priority: 'RED',    weight: 0.90 },
  'Trauma cranioencefálico recente':           { priority: 'ORANGE', weight: 0.70 },
  'Início súbito':                             { priority: 'ORANGE', weight: 0.60 },
  'Uso de drogas ou álcool':                   { priority: 'YELLOW', weight: 0.45 },
  'Histórico de diabetes (suspeita de hipoglicemia)': { priority: 'YELLOW', weight: 0.40 },

  // ---- vomitos-nauseas (Vomiting / Nausea) ----
  'Vômitos com sangue (hematêmese)':           { priority: 'ORANGE', weight: 0.80 },
  'Sinais de desidratação grave':              { priority: 'ORANGE', weight: 0.70 },
  'Vômitos em jato sem náusea prévia':         { priority: 'ORANGE', weight: 0.65 },
  'Dor abdominal intensa associada':           { priority: 'YELLOW', weight: 0.50 },
  // Note: 'Alteração do nível de consciência' already mapped above (cefaleia) with same values
  'Vômitos persistentes por mais de 24h':      { priority: 'YELLOW', weight: 0.40 },

  // ---- crise-alergica (Allergic Crisis) ----
  'Dificuldade respiratória ou estridor':      { priority: 'RED',    weight: 0.90 },
  'Edema de lábios, língua ou glote':          { priority: 'RED',    weight: 0.90 },
  'Hipotensão ou síncope':                     { priority: 'RED',    weight: 0.85 },
  'Urticária generalizada':                    { priority: 'ORANGE', weight: 0.55 },
  'Contato recente com alérgeno conhecido':    { priority: 'YELLOW', weight: 0.40 },
  'Histórico de anafilaxia prévia':            { priority: 'ORANGE', weight: 0.60 },

  // ---- crise-convulsiva (Seizure) ----
  'Primeira crise convulsiva da vida':         { priority: 'ORANGE', weight: 0.70 },
  'Crise com duração superior a 5 minutos (estado epiléptico)': { priority: 'RED', weight: 0.90 },
  'Pós-ictal prolongado (> 30 min)':           { priority: 'ORANGE', weight: 0.65 },
  'Febre associada em adulto':                 { priority: 'YELLOW', weight: 0.45 },
  'Trauma craniano após a queda':              { priority: 'ORANGE', weight: 0.60 },
  'Epiléptico com mudança no padrão das crises': { priority: 'YELLOW', weight: 0.40 },

  // ---- dor-garganta-ouvido (Throat/Ear Pain) ----
  'Dificuldade para engolir ou abrir a boca (trismo)': { priority: 'ORANGE', weight: 0.70 },
  'Estridor ou dificuldade respiratória':      { priority: 'RED',    weight: 0.85 },
  'Febre alta associada':                      { priority: 'YELLOW', weight: 0.45 },
  'Edema uvular ou periamigdaliano':           { priority: 'ORANGE', weight: 0.65 },
  'Otalgia intensa com perda auditiva súbita': { priority: 'YELLOW', weight: 0.50 },
  'Secreção purulenta no ouvido':              { priority: 'GREEN',  weight: 0.40 },

  // ---- lesao-em-pele (Skin Lesion) ----
  'Área de queimadura > 10% da superfície corporal': { priority: 'ORANGE', weight: 0.75 },
  'Queimadura em face, mãos, genitais ou articulações': { priority: 'ORANGE', weight: 0.70 },
  'Sinais de infecção (calor, pus, celulite expansiva)': { priority: 'YELLOW', weight: 0.50 },
  'Lesão com comprometimento de estruturas profundas': { priority: 'ORANGE', weight: 0.65 },
  'Rash hemorrágico ou petéquias':             { priority: 'RED',    weight: 0.85 },
  'Mordedura humana ou animal':                { priority: 'YELLOW', weight: 0.45 },

  // ---- intoxicacao-overdose (Intoxication / Overdose) ----
  'Depressão respiratória (FR < 12 rpm)':      { priority: 'RED',    weight: 0.90 },
  'Convulsões':                                { priority: 'RED',    weight: 0.85 },
  'Hipotensão ou bradicardia':                 { priority: 'RED',    weight: 0.85 },
  'Substância com antídoto específico disponível': { priority: 'ORANGE', weight: 0.65 },
  'Ingestão há menos de 1 hora (potencial de lavagem gástrica)': { priority: 'ORANGE', weight: 0.60 },
  'Intenção suicida':                          { priority: 'ORANGE', weight: 0.70 },

  // ---- dor-no-olho (Eye Pain) ----
  'Perda súbita de visão':                     { priority: 'RED',    weight: 0.90 },
  'Trauma ocular (corpo estranho, perfuração)':{ priority: 'ORANGE', weight: 0.75 },
  'Olho vermelho com halo ao redor de luzes (suspeita de glaucoma)': { priority: 'ORANGE', weight: 0.70 },
  'Dor intensa com náusea e vômito':           { priority: 'ORANGE', weight: 0.65 },
  'Queimadura química ou exposição a agente cáustico': { priority: 'RED', weight: 0.85 },
  'Diplopia (visão dupla) de início agudo':    { priority: 'ORANGE', weight: 0.65 },
}

// ---------------------------------------------------------------------------
// Priority ordering (RED = highest = 0, BLUE = lowest = 4)
// ---------------------------------------------------------------------------

const PRIORITY_RANK: Record<PriorityKey, number> = {
  RED: 0,
  ORANGE: 1,
  YELLOW: 2,
  GREEN: 3,
  BLUE: 4,
}

function higherPriority(a: PriorityKey, b: PriorityKey): PriorityKey {
  return PRIORITY_RANK[a] <= PRIORITY_RANK[b] ? a : b
}

// ---------------------------------------------------------------------------
// Vital sign evaluation
// ---------------------------------------------------------------------------

type VitalFlag = {
  priority: PriorityKey
  label: string
}

function evaluateVitals(data: TriageFormValuesForClassify): VitalFlag[] {
  const flags: VitalFlag[] = []

  // Consciousness (AVPU)
  if (data.avpu === 'sem-resposta') {
    flags.push({ priority: 'RED', label: 'Sem resposta (AVPU U)' })
  } else if (data.avpu === 'dor') {
    flags.push({ priority: 'ORANGE', label: 'Responde à dor (AVPU P)' })
  } else if (data.avpu === 'voz') {
    flags.push({ priority: 'YELLOW', label: 'Responde à voz (AVPU V)' })
  }

  // SpO2
  if (data.spo2 != null) {
    if (data.spo2 < 85) {
      flags.push({ priority: 'RED', label: `SpO2 crítica: ${data.spo2}%` })
    } else if (data.spo2 <= 91) {
      flags.push({ priority: 'ORANGE', label: `SpO2 baixa: ${data.spo2}%` })
    } else if (data.spo2 <= 94) {
      flags.push({ priority: 'YELLOW', label: `SpO2 limítrofe: ${data.spo2}%` })
    }
  }

  // Heart Rate
  if (data.heartRate != null) {
    if (data.heartRate < 40 || data.heartRate > 180) {
      flags.push({ priority: 'RED', label: `FC crítica: ${data.heartRate} bpm` })
    } else if (
      (data.heartRate >= 40 && data.heartRate <= 49) ||
      (data.heartRate >= 150 && data.heartRate <= 180)
    ) {
      flags.push({ priority: 'ORANGE', label: `FC alterada: ${data.heartRate} bpm` })
    } else if (data.heartRate >= 100 && data.heartRate < 150) {
      flags.push({ priority: 'YELLOW', label: `Taquicardia leve: ${data.heartRate} bpm` })
    }
  }

  // Respiratory Rate
  if (data.respiratoryRate != null) {
    if (data.respiratoryRate < 8 || data.respiratoryRate > 35) {
      flags.push({ priority: 'RED', label: `FR crítica: ${data.respiratoryRate} rpm` })
    } else if (
      (data.respiratoryRate >= 8 && data.respiratoryRate <= 9) ||
      (data.respiratoryRate >= 30 && data.respiratoryRate <= 35)
    ) {
      flags.push({ priority: 'ORANGE', label: `FR alterada: ${data.respiratoryRate} rpm` })
    }
  }

  // Temperature
  if (data.temperature != null) {
    if (data.temperature > 40) {
      flags.push({ priority: 'ORANGE', label: `Febre alta: ${data.temperature}°C` })
    } else if (data.temperature >= 38.5) {
      flags.push({ priority: 'YELLOW', label: `Febre: ${data.temperature}°C` })
    }
  }

  // Pain Score
  if (data.painScore != null && data.painScore >= 7) {
    flags.push({ priority: 'YELLOW', label: `Dor intensa: ${data.painScore}/10` })
  }

  return flags
}

// ---------------------------------------------------------------------------
// Reasoning bullet builder
// ---------------------------------------------------------------------------

function buildRuleEngineReasoning(
  vitalFlags: VitalFlag[],
  topDiscriminators: string[],
  priority: PriorityKey
): string[] {
  const bullets: string[] = []

  if (vitalFlags.length > 0) {
    const flagLabels = vitalFlags.map((f) => f.label).join(', ')
    bullets.push(`Sinais vitais críticos: ${flagLabels}`)
  }

  topDiscriminators.slice(0, 3).forEach((d) => {
    bullets.push(`Discriminador selecionado: ${d}`)
  })

  const ptLabel = PRIORITY_META[priority].ptLabel
  bullets.push(`Prioridade ${ptLabel} conforme Protocolo de Manchester`)

  return bullets.slice(0, 5)
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

export function runManchesterRuleEngine(
  data: TriageFormValuesForClassify
): InternalRuleResult {
  // Step 1: Evaluate vital signs
  const vitalFlags = evaluateVitals(data)

  // Step 2: Check for RED vital flag short-circuit
  const redFlag = vitalFlags.find((f) => f.priority === 'RED')
  if (redFlag) {
    const reasoning = buildRuleEngineReasoning(
      vitalFlags.filter((f) => f.priority === 'RED'),
      [],
      'RED'
    )
    return {
      result: {
        priority: 'RED',
        confidence: 0.95,
        reasoning,
        disclaimer: DISCLAIMER,
      },
      confidence: 0.95,
    }
  }

  // Step 3: Evaluate discriminators
  const selectedWeights = data.discriminators
    .map((d) => {
      const entry = DISCRIMINATOR_WEIGHTS[d]
      if (entry) return entry
      // Default: unmapped discriminator = YELLOW weight 0.5
      return { priority: 'YELLOW' as PriorityKey, weight: 0.5 }
    })
    .filter(Boolean)

  // Determine top priority from ORANGE vital flags
  const orangeFlag = vitalFlags.find((f) => f.priority === 'ORANGE')
  const yellowFlag = vitalFlags.find((f) => f.priority === 'YELLOW')

  let vitalPriority: PriorityKey | null = null
  if (orangeFlag) vitalPriority = 'ORANGE'
  else if (yellowFlag) vitalPriority = 'YELLOW'

  // Compute vitalBonus
  const vitalBonus = vitalPriority === 'ORANGE' ? 0.85 : vitalPriority === 'YELLOW' ? 0.75 : 0

  // Step 4: No discriminators + no vital flags → BLUE fallback
  if (selectedWeights.length === 0 && vitalPriority === null) {
    return {
      result: {
        priority: 'BLUE',
        confidence: 0.3,
        reasoning: [
          'Nenhum sinal vital alterado identificado',
          `Prioridade ${PRIORITY_META['BLUE'].ptLabel} conforme Protocolo de Manchester`,
        ],
        disclaimer: DISCLAIMER,
      },
      confidence: 0.3,
    }
  }

  // Step 5: Compute priority from discriminators + vital flags
  let priority: PriorityKey = vitalPriority ?? 'GREEN'

  for (const w of selectedWeights) {
    priority = higherPriority(priority, w.priority)
  }

  // Sort discriminators by weight descending for reasoning
  const sortedByWeight = data.discriminators
    .map((d) => ({
      label: d,
      entry: DISCRIMINATOR_WEIGHTS[d] ?? { priority: 'YELLOW' as PriorityKey, weight: 0.5 },
    }))
    .sort((a, b) => b.entry.weight - a.entry.weight)

  // Step 6: Compute confidence
  let confidence: number

  if (selectedWeights.length === 0) {
    // Only vital flags (non-RED) present
    confidence = vitalBonus
  } else {
    const avgWeight =
      selectedWeights.reduce((sum, w) => sum + w.weight, 0) / selectedWeights.length
    const rawConfidence = avgWeight * 0.8 + vitalBonus * 0.2

    if (selectedWeights.length === 1 && vitalPriority === null) {
      // Single discriminator with no vitals → cap at 0.65
      confidence = Math.min(rawConfidence, 0.65)
    } else {
      confidence = rawConfidence
    }
  }

  // Clamp to [0, 1]
  confidence = Math.max(0, Math.min(1, confidence))

  const reasoning = buildRuleEngineReasoning(
    vitalFlags,
    sortedByWeight.map((s) => s.label),
    priority
  )

  return {
    result: {
      priority,
      confidence,
      reasoning,
      disclaimer: DISCLAIMER,
    },
    confidence,
  }
}
