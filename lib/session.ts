import { getIronSession, type SessionOptions, type IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  role?: 'nurse'
  name?: string
  loggedInAt?: string
}

export const sessionOptions: SessionOptions = {
  cookieName: 'sus-flow-session',
  // Password is resolved lazily at runtime; build-time static analysis won't have it
  get password() {
    const secret = process.env.IRON_SESSION_SECRET
    if (!secret) {
      throw new Error('IRON_SESSION_SECRET environment variable is required')
    }
    return secret
  },
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400 - 60, // 24h minus 60s buffer (iron-session convention)
    httpOnly: true,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
