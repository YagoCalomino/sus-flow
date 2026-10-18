/**
 * AUTH-01: loginAction sets session fields (role='nurse', name='Enf. Demo', loggedInAt ISO string)
 *          and calls session.save()
 * AUTH-02: sessionOptions has cookieName='sus-flow-session', maxAge=86340, httpOnly=true
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// AUTH-02 — sessionOptions contract
// ---------------------------------------------------------------------------
describe('AUTH-02: sessionOptions cookie configuration', () => {
  it('has cookieName equal to sus-flow-session', async () => {
    // Provide the required env var so the getter does not throw
    process.env.IRON_SESSION_SECRET = 'test-secret-32-characters-long!!'
    const { sessionOptions } = await import('@/lib/session')
    expect(sessionOptions.cookieName).toBe('sus-flow-session')
  })

  it('has maxAge of 86340 (86400 minus 60-second buffer)', async () => {
    process.env.IRON_SESSION_SECRET = 'test-secret-32-characters-long!!'
    const { sessionOptions } = await import('@/lib/session')
    expect(sessionOptions.cookieOptions?.maxAge).toBe(86400 - 60)
  })

  it('has httpOnly set to true', async () => {
    process.env.IRON_SESSION_SECRET = 'test-secret-32-characters-long!!'
    const { sessionOptions } = await import('@/lib/session')
    expect(sessionOptions.cookieOptions?.httpOnly).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AUTH-01 — loginAction sets session fields and calls session.save()
// ---------------------------------------------------------------------------

// We need to mock: iron-session (getIronSession), next/headers (cookies),
// and next/navigation (redirect) so the Server Action can run in unit tests.

const mockSave = vi.fn()
const mockSession = {
  role: undefined as string | undefined,
  name: undefined as string | undefined,
  loggedInAt: undefined as string | undefined,
  save: mockSave,
  destroy: vi.fn(),
}

vi.mock('iron-session', () => ({
  getIronSession: vi.fn().mockResolvedValue(mockSession),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({}),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('AUTH-01: loginAction session field assignment', () => {
  beforeEach(() => {
    // Reset session fields before each test
    mockSession.role = undefined
    mockSession.name = undefined
    mockSession.loggedInAt = undefined
    mockSave.mockClear()
  })

  it('sets role to "nurse"', async () => {
    const { loginAction } = await import('@/app/(nurse)/login/actions')
    await loginAction()
    expect(mockSession.role).toBe('nurse')
  })

  it('sets name to "Enf. Demo"', async () => {
    const { loginAction } = await import('@/app/(nurse)/login/actions')
    await loginAction()
    expect(mockSession.name).toBe('Enf. Demo')
  })

  it('sets loggedInAt to a valid ISO 8601 string', async () => {
    const before = new Date().toISOString()
    const { loginAction } = await import('@/app/(nurse)/login/actions')
    await loginAction()
    const after = new Date().toISOString()
    expect(mockSession.loggedInAt).toBeDefined()
    // Must be parseable as a date and within the test window
    const parsed = new Date(mockSession.loggedInAt as string)
    expect(isNaN(parsed.getTime())).toBe(false)
    expect(mockSession.loggedInAt! >= before).toBe(true)
    expect(mockSession.loggedInAt! <= after).toBe(true)
  })

  it('calls session.save() exactly once', async () => {
    const { loginAction } = await import('@/app/(nurse)/login/actions')
    await loginAction()
    expect(mockSave).toHaveBeenCalledTimes(1)
  })
})
