import type { Metadata } from 'next'
import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/session'
import { logoutAction } from './login/actions'

export const metadata: Metadata = {
  title: 'Portal do Enfermeiro(a) · SUS-Flow',
}

export default async function NurseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  const nurseName = session.name ?? 'Enf. Demo'

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-card shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">SUS-Flow · Portal do Enfermeiro(a)</span>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Voltar ao Painel Público"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Painel Público</span>
            </Link>
            <span className="text-xs text-amber-600">Dados de demonstração</span>
            <span className="text-sm text-muted-foreground">{nurseName}</span>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </>
  )
}
