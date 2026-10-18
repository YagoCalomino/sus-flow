'use server'

import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function loginAction() {
  const session = await getSession()
  session.role = 'nurse'
  session.name = 'Enf. Demo'
  session.loggedInAt = new Date().toISOString()
  await session.save()
  redirect('/triage')
}

export async function logoutAction() {
  const session = await getSession()
  await session.destroy()
  redirect('/login')
}
