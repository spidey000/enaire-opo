'use client'

import { type LucideIcon } from 'lucide-react'

export interface StatCardDef {
  eyebrow: string
  value: string
  label: string
  sub?: string
  icon: LucideIcon
  iconColor: string
  valueColor: string
}

interface Props {
  cards: StatCardDef[]
}

export function StatsCards({ cards }: Props) {
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

            {/* Big number */}
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
