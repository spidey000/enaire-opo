'use client'

import { useMemo } from 'react'
import { Candidato } from '@/lib/parseCSV'
import { Users, CheckCircle2, XCircle, MinusCircle, Trophy } from 'lucide-react'

interface Props {
  data: Candidato[]
}

export function StatsCards({ data }: Props) {
  const stats = useMemo(() => {
    const total = data.length
    const aptos = data.filter((c) => c.estado === 'APTO/A').length
    const noAptos = data.filter((c) => c.estado === 'NO APTO/A').length
    const noPresentados = data.filter((c) => c.estado === 'NO PRESENTADO/A').length
    const conPuntuacion = data.filter((c) => c.totalFase1 !== null)
    const media =
      conPuntuacion.length > 0
        ? conPuntuacion.reduce((a, c) => a + (c.totalFase1 ?? 0), 0) / conPuntuacion.length
        : 0
    return { total, aptos, noAptos, noPresentados, media }
  }, [data])

  const cards = [
    {
      eyebrow: 'TOTAL',
      value: stats.total.toLocaleString('es-ES'),
      label: 'candidatos',
      icon: Users,
      iconColor: 'text-primary',
      valueColor: 'text-foreground',
    },
    {
      eyebrow: 'RESULTADO',
      value: stats.aptos.toLocaleString('es-ES'),
      label: 'APTO/A',
      sub: `${stats.total > 0 ? ((stats.aptos / stats.total) * 100).toFixed(1) : 0}%`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-700',
    },
    {
      eyebrow: 'RESULTADO',
      value: stats.noAptos.toLocaleString('es-ES'),
      label: 'NO APTO/A',
      sub: `${stats.total > 0 ? ((stats.noAptos / stats.total) * 100).toFixed(1) : 0}%`,
      icon: XCircle,
      iconColor: 'text-red-500',
      valueColor: 'text-red-700',
    },
    {
      eyebrow: 'RESULTADO',
      value: stats.noPresentados.toLocaleString('es-ES'),
      label: 'No Presentados',
      sub: `${stats.total > 0 ? ((stats.noPresentados / stats.total) * 100).toFixed(1) : 0}%`,
      icon: MinusCircle,
      iconColor: 'text-amber-500',
      valueColor: 'text-amber-700',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-0 lg:grid-cols-4 border border-border rounded-sm overflow-hidden bg-card shadow-sm">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={`flex flex-col gap-3 p-6 lg:p-8 ${
              idx < cards.length - 1 ? 'border-b lg:border-b-0 lg:border-r border-border' : ''
            } ${idx === 1 ? 'border-r border-border' : ''}`}
          >
            {/* Icon + eyebrow */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {card.eyebrow}
              </span>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>

            {/* Big number — ENAIRE style */}
            <div>
              <span className={`text-4xl font-bold leading-none ${card.valueColor}`}>
                {card.value}
              </span>
              {card.sub && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {card.sub}
                </span>
              )}
            </div>

            {/* Label */}
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        )
      })}
    </div>
  )
}
