/**
 * AUTH-03: middleware redirects to /login when sus-flow-session cookie is absent;
 *          passes through (NextResponse.next()) when cookie is present.
 */

import { describe, it, expect } from 'vitest'
import { middleware, config } from '@/middleware'
import { NextRequest } from 'next/server'

function makeRequest(url: string, cookieHeader?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (cookieHeader) {
    headers['cookie'] = cookieHeader
  }
  return new NextRequest(url, { headers })
}

describe('AUTH-03: middleware route protection', () => {
  it('redirects to /login when sus-flow-session cookie is absent', () => {
    const req = makeRequest('http://localhost:3000/triage')
    const response = middleware(req)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toMatch(/\/login$/)
  })

  it('returns NextResponse.next() (status 200) when sus-flow-session cookie is present', () => {
    const req = makeRequest(
      'http://localhost:3000/triage',
      'sus-flow-session=some-encrypted-value'
    )
    const response = middleware(req)
    // NextResponse.next() returns a response without a redirect location
    expect(response.headers.get('location')).toBeNull()
  })

  it('also redirects to /login for nested triage paths without cookie', () => {
    const req = makeRequest('http://localhost:3000/triage/new')
    const response = middleware(req)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toMatch(/\/login$/)
  })

  it('config.matcher includes /triage and /triage/:path*', () => {
    expect(config.matcher).toContain('/triage')
    expect(config.matcher).toContain('/triage/:path*')
  })
})
