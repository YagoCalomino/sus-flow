import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const facilityCount = await prisma.facility.count()
  return NextResponse.json({ status: 'ok', facilityCount })
}
