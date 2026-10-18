import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock iron-session getSession before importing actions
vi.mock('@/lib/session', () => ({
  getSession: vi.fn(),
}))

// Mock the 'ai' package generateText
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    generateText: vi.fn(),
  }
})

// Mock the google provider
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'mock-google-model'),
}))

// Mock next/navigation (redirect)
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    patient: {
      create: vi.fn().mockResolvedValue({ id: 'patient-123' }),
    },
    triageLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-123' }),
    },
  },
}))

import { getSession } from '@/lib/session'
import { generateText } from 'ai'
import { classifyTriage } from '@/app/(nurse)/triage/actions'

// Base valid form data (all required fields present)
const validFormData = {
  facilityId: 'facility-1',
  chiefComplaint: 'dor-no-peito',
  discriminators: ['Dor irradiando para o braço/mandíbula'],
  painScore: null,
  spo2: null,
  heartRate: null,
  respiratoryRate: null,
  temperature: null,
  avpu: null,
  freeText: '',
}

const mockGetSession = getSession as ReturnType<typeof vi.fn>
const mockGenerateText = generateText as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  // Default: valid nurse session
  mockGetSession.mockResolvedValue({ role: 'nurse', name: 'Enfermeira Teste' })
  // Default: GOOGLE_GENERATIVE_AI_API_KEY present
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key-123'
})

describe('classifyTriage', () => {
  it('returns success:false when session.role is not nurse', async () => {
    mockGetSession.mockResolvedValue({ role: undefined })

    let result
    try {
      result = await classifyTriage(validFormData)
    } catch (e: unknown) {
      // redirect() throws in our mock — treat as auth failure
      if (e instanceof Error && e.message.startsWith('REDIRECT:')) {
        result = { success: false, error: 'unauthorized' }
      } else {
        throw e
      }
    }

    expect(result?.success).toBe(false)
  })

  it('returns success:false with error ai_not_configured when GOOGLE_GENERATIVE_AI_API_KEY is unset', async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY

    const result = await classifyTriage(validFormData)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('ai_not_configured')
    }
  })

  it('returns method rule_engine without calling generateText for high-confidence structured input', async () => {
    // AVPU sem-resposta → rule engine confidence = 0.95 (>= 0.80) + no freeText
    const highConfidenceInput = {
      ...validFormData,
      discriminators: [],
      avpu: 'sem-resposta',
      freeText: '',
    }

    const result = await classifyTriage(highConfidenceInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.method).toBe('rule_engine')
    }
    // generateText should NOT have been called
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('invokes generateText and returns method claude when freeText is present', async () => {
    const mockAIOutput = {
      priority: 'ORANGE',
      confidence: 85,
      reasoning: ['Dor torácica com irradiação', 'Possível síndrome coronariana'],
      disclaimer: 'Atenção: Sugestão gerada por IA.',
    }

    mockGenerateText.mockResolvedValue({ output: mockAIOutput })

    const inputWithFreeText = {
      ...validFormData,
      freeText: 'Paciente refere dor intensa no peito há 30 minutos',
    }

    const result = await classifyTriage(inputWithFreeText)

    expect(mockGenerateText).toHaveBeenCalled()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.method).toBe('gemini')
      expect(result.data.priority).toBe('ORANGE')
    }
  })
})
