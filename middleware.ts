import { NextRequest, NextResponse } from 'next/server'

// SECURITY NOTE: This middleware performs a UX-only redirect — it checks for the
// presence of the 'sus-flow-session' cookie but does NOT cryptographically verify
// its contents. Iron-session decryption requires the Node.js runtime and cannot
// run on the Edge. This guard only prevents unauthenticated users from reaching
// nurse routes without a cookie at all.
//
// CRITICAL: Every route handler and Server Action under (nurse)/ MUST call
// getSession() and explicitly verify session.role === 'nurse' before processing
// any privileged operation. The middleware cookie check is NOT a substitute for
// server-side session verification.
export function middleware(req: NextRequest) {
  const session = req.cookies.get('sus-flow-session')
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/triage', '/triage/:path*'],
}
