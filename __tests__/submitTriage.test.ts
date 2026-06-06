/**
 * TRIAGE-05 (updated Phase 5): saveTriage maps spo2→oxygenSat, avpu→consciousness,
 *            stores isSimulated:false, aiUsed:true, aiMethod, nurseOverride, confirmedColor.
 *
 * submitTriage was removed in Phase 5 — replaced by classifyTriage + saveTriage.
 * These tests cover the same DB-write field-mapping contract via saveTriage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Hoisted mocks — variables used inside vi.mock() factories must be declared
// with vi.hoisted() so they are available before the module is loaded.
// ---------------------------------------------------------------------------

const { mockPatientCreate, mockTriageLogCreate, mockSession } = vi.hoisted(() => {
  const mockSession = {
    role: 'nurse' as string | undefined,
    name: 'Enf. Demo',
    loggedInAt: new Date().toISOString(),
    save: vi.fn(),
    destroy: vi.fn(),
  }
  return {
    mockPatientCreate: vi.fn(),
    mockTriageLogCreate: vi.fn(),
    mockSession,
  }
})

vi.mock('@/lib/prisma', () => ({
  prisma: {
    patient: { create: mockPatientCreate },
    triageLog: { create: mockTriageLogCreate },
  },
}))

vi.mock('@/lib/session', () => ({
  getSession: vi.fn().mockResolvedValue(mockSession),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// @prisma/client mock — provide TriagePriority enum
vi.mock('@prisma/client', () => ({
  TriagePriority: {
    RED: 'RED',
    ORANGE: 'ORANGE',
    YELLOW: 'YELLOW',
    GREEN: 'GREEN',
    BLUE: 'BLUE',
  },
  Prisma: {
    DbNull: null,
  },
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

import { saveTriage } from '@/app/(nurse)/triage/actions'

const VALID_FORM_DATA = {
  facilityId: 'facility-uuid-1',
  chiefComplaint: 'dor-no-peito',
  discriminators: ['Dor irradiando para o braço/mandíbula', 'Dispneia associada'],
  painScore: 7,
  spo2: 94,
  heartRate: 110,
  respiratoryRate: 22,
  temperature: 37.5,
  avpu: 'alerta' as const,
  freeText: 'Paciente relata dor há 20 minutos',
}

const VALID_AI_RESULT = {
  priority: 'ORANGE' as const,
  confidence: 85,
  reasoning: ['Dor torácica com irradiação', 'Possível síndrome coronariana'],
  disclaimer: 'Atenção: Sugestão gerada por IA.',
}

const VALID_SAVE_INPUT = {
  formData: VALID_FORM_DATA,
  aiResult: VALID_AI_RESULT,
  confirmedColor: 'ORANGE' as const,
  nurseOverride: false,
  aiMethod: 'rule_engine' as const,
}

describe('TRIAGE-05: saveTriage field mapping and DB write contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPatientCreate.mockResolvedValue({ id: 'patient-uuid-1' })
    mockTriageLogCreate.mockResolvedValue({ id: 'log-uuid-1' })
    mockSession.role = 'nurse'
  })

  it('maps spo2 → oxygenSat in the triageLog.create call', async () => {
    await saveTriage(VALID_SAVE_INPUT)
    expect(mockTriageLogCreate).toHaveBeenCalledOnce()
    const callArg = mockTriageLogCreate.mock.calls[0][0]
    expect(callArg.data).toHaveProperty('oxygenSat', VALID_FORM_DATA.spo2)
  })

  it('does NOT write "spo2" as a key to triageLog.create', async () => {
    await saveTriage(VALID_SAVE_INPUT)
    const callArg = mockTriageLogCreate.mock.calls[0][0]
    expect(callArg.data).not.toHaveProperty('spo2')
  })

  it('maps avpu → consciousness in the triageLog.create call', async () => {
    await saveTriage(VALID_SAVE_INPUT)
    const callArg = mockTriageLogCreate.mock.calls[0][0]
    expect(callArg.data).toHaveProperty('consciousness', VALID_FORM_DATA.avpu)
  })

  it('does NOT write "avpu" as a key to triageLog.create', async () => {
    await saveTriage(VALID_SAVE_INPUT)
    const callArg = mockTriageLogCreate.mock.calls[0][0]
    expect(callArg.data).not.toHaveProperty('avpu')
  })

  it('stores isSimulated: false in the triageLog.create call', async () => {
    await saveTriage(VALID_SAVE_INPUT)
    const callArg = mockTriageLogCreate.mock.calls[0][0]
    expect(callArg.data).toHaveProperty('isSimulated', false)
  })

  it('stores aiUsed: true in the triageLog.create call', async () => {
    await saveTriage(VALID_SAVE_INPUT)
    const callArg = mockTriageLogCreate.mock.calls[0][0]
    expect(callArg.data).toHaveProperty('aiUsed', true)
  })

  it('stores aiConfidence as integer 0-100 (not divided by 100)', async () => {
    await saveTriage(VALID_SAVE_INPUT)
    const callArg = mockTriageLogCreate.mock.calls[0][0]
    expect(callArg.data.aiConfidence).toBe(85)
  })

  it('stores aiReasoning as the reasoning array (not null)', async () => {
    await saveTriage(VALID_SAVE_INPUT)
    const callArg = mockTriageLogCreate.mock.calls[0][0]
    expect(callArg.data.aiReasoning).toEqual(VALID_AI_RESULT.reasoning)
  })

  it('returns { success: true } on valid data with authenticated session', async () => {
    const result = await saveTriage(VALID_SAVE_INPUT)
    expect(result).toEqual({ success: true })
  })

  it('redirects to /login when session has no role', async () => {
    const { redirect } = await import('next/navigation')
    mockSession.role = undefined
    vi.mocked(redirect).mockClear()
    await saveTriage(VALID_SAVE_INPUT)
    expect(redirect).toHaveBeenCalledWith('/login')
  })
})
