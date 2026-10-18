export const PRIORITY_META = {
  RED: {
    level: 1,
    label: 'Imediato',
    ptLabel: 'Vermelho',
    colorClass: 'bg-red-600',
    textClass: 'text-white',
    breakdownKey: 'red' as const,
  },
  ORANGE: {
    level: 2,
    label: 'Muito Urgente',
    ptLabel: 'Laranja',
    colorClass: 'bg-orange-700',
    textClass: 'text-white',
    breakdownKey: 'orange' as const,
  },
  YELLOW: {
    level: 3,
    label: 'Urgente',
    ptLabel: 'Amarelo',
    colorClass: 'bg-yellow-400',
    textClass: 'text-gray-900',
    breakdownKey: 'yellow' as const,
  },
  GREEN: {
    level: 4,
    label: 'Pouco Urgente',
    ptLabel: 'Verde',
    colorClass: 'bg-green-700',
    textClass: 'text-white',
    breakdownKey: 'green' as const,
  },
  BLUE: {
    level: 5,
    label: 'Não Urgente',
    ptLabel: 'Azul',
    colorClass: 'bg-blue-700',
    textClass: 'text-white',
    breakdownKey: 'blue' as const,
  },
} as const

export type PriorityKey = keyof typeof PRIORITY_META

export const PRIORITY_ORDER: PriorityKey[] = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE']
