import { cn } from '@/lib/utils'

interface Props {
  loadPercent: number
  currentLoad: number
  capacity: number
}

export function CapacityGauge({ loadPercent, currentLoad, capacity }: Props) {
  const clamped = Math.min(100, Math.max(0, loadPercent))

  const barColor =
    clamped >= 90 ? 'bg-red-500' :
    clamped >= 75 ? 'bg-amber-500' :
    'bg-green-500'

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{currentLoad} / {capacity} pacientes</span>
        <span className={cn(
          'font-medium',
          clamped >= 90 ? 'text-red-600' :
          clamped >= 75 ? 'text-amber-600' :
          'text-green-600',
        )}>
          {clamped.toFixed(0)}% ocupado
        </span>
      </div>
      <div
        className="h-2.5 w-full rounded-full bg-secondary overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Capacidade da unidade: ${clamped.toFixed(0)}%`}
      >
        <div
          className={cn('h-full w-full rounded-full origin-left transition-transform duration-500', barColor)}
          style={{ transform: `scaleX(${clamped / 100})` }}
          title={`Capacidade: ${clamped.toFixed(0)}% ocupado`}
        />
      </div>
    </div>
  )
}
