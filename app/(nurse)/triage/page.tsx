// app/(nurse)/triage/page.tsx
// Server Component — fetches facilities + recent real triage logs, renders form + table.
// Route protection is handled by Next.js middleware (middleware.ts).
// This page double-checks session for an explicit auth guard (defense-in-depth).

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { TriageForm } from '@/components/nurse/TriageForm'
import { TriageLogTable } from '@/components/nurse/TriageLogTable'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Portal do Enfermeiro(a) · SUS-Flow',
}

export default async function TriagePage() {
  // Defense-in-depth: verify session even though middleware already guards this route
  const session = await getSession()
  if (!session.role || session.role !== 'nurse') {
    redirect('/login')
  }

  // Fetch 1: active facilities for the form dropdown (alphabetical)
  const facilities = await prisma.facility.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // Fetch 2: 20 most recent real nurse-submitted triage logs
  const rawLogs = await prisma.triageLog.findMany({
    where: { isSimulated: false },
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id:              true,
      createdAt:       true,
      chiefComplaint:  true,
      confirmedColor:  true,
      discriminators:  true,
      freeText:        true,
      painScore:       true,
      heartRate:       true,
      oxygenSat:       true,
      temperature:     true,
      respiratoryRate: true,
      consciousness:   true,
      nurseOverride:   true,
      aiSuggestedColor: true,
      aiConfidence:    true,
      aiReasoning:     true,
      aiUsed:          true,
      aiMethod:        true,
      facility: { select: { name: true } },
      patient:  { select: { displayName: true } },
    },
  })

  // Cast Prisma.JsonValue aiReasoning → string[] | null; narrow aiMethod to union
  const logs = rawLogs.map((r) => ({
    ...r,
    confirmedColor: r.confirmedColor as import('@/lib/constants/triage').PriorityKey,
    aiSuggestedColor: r.aiSuggestedColor as import('@/lib/constants/triage').PriorityKey | null,
    aiReasoning: Array.isArray(r.aiReasoning) ? (r.aiReasoning as string[]) : null,
    aiMethod: r.aiMethod as 'rule_engine' | 'gemini' | null,
  }))

  return (
    <div className="space-y-8">
      {/* Section A — Triage Form */}
      <TriageForm facilities={facilities} />

      {/* Section B — Recent Triage Log */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Recentes</CardTitle>
          <CardDescription>
            Últimos 20 registros — apenas triagens manuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TriageLogTable logs={logs} />
        </CardContent>
      </Card>
    </div>
  )
}
