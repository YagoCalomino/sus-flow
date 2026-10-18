import type { Metadata } from 'next'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { loginAction } from './actions'

export const metadata: Metadata = {
  title: 'Login · SUS-Flow',
}

export default function LoginPage() {
  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-57px)] bg-background flex items-center justify-center">
      <div className="max-w-sm w-full mx-4">
        <Card>
          <CardHeader className="gap-1">
            <h1 className="text-xl font-semibold">SUS-Flow</h1>
            <p className="text-sm font-medium">Portal do Enfermeiro(a)</p>
            <p className="text-sm text-muted-foreground">Acesso demo — sem senha</p>
          </CardHeader>
          <CardContent>
            <form action={loginAction}>
              <Button type="submit" variant="default" className="w-full">
                Entrar como Enfermeiro(a) — Demo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
