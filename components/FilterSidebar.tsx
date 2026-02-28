'use client'

import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

export interface Filters {
  search: string
  estado: string[]
  totalMin: number
  totalMax: number
  sortBy: string
  sortDir: 'asc' | 'desc'
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  onReset: () => void
}

const ESTADOS = [
  { value: 'APTO/A', color: 'border-emerald-500 bg-emerald-50 text-emerald-800', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'NO APTO/A', color: 'border-red-400 bg-red-50 text-red-800', activeColor: 'bg-red-600 text-white border-red-600' },
  { value: 'NO PRESENTADO/A', color: 'border-amber-400 bg-amber-50 text-amber-800', activeColor: 'bg-amber-500 text-white border-amber-500' },
]

const SORT_OPTIONS = [
  { value: 'ranking', label: 'Ranking General' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'totalFase1', label: 'Puntuación Total' },
  { value: 'conocimientosGenerales', label: 'Con. Generales' },
  { value: 'ingles', label: 'Inglés' },
  { value: 'aptitudes', label: 'Aptitudes' },
  { value: 'rankingConocimientos', label: 'Rank. Conocimientos' },
  { value: 'rankingIngles', label: 'Rank. Inglés' },
  { value: 'rankingAptitud', label: 'Rank. Aptitud' },
]

export const DEFAULT_FILTERS: Filters = {
  search: '',
  estado: [],
  totalMin: 0,
  totalMax: 150,
  sortBy: 'ranking',
  sortDir: 'asc',
}

export function FilterSidebar({ filters, onChange, onReset }: Props) {
  const update = (partial: Partial<Filters>) => onChange({ ...filters, ...partial })

  const toggleEstado = (e: string) => {
    const next = filters.estado.includes(e)
      ? filters.estado.filter((x) => x !== e)
      : [...filters.estado, e]
    update({ estado: next })
  }

  return (
    <aside className="flex flex-col gap-5 bg-card border border-border rounded-sm p-5 h-fit sticky top-[57px] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Filtros</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Reiniciar
        </button>
      </div>

      {/* Search */}
      <div className="space-y-1.5">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Buscar candidato
        </Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Nombre o identificador..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="pl-8 h-8 text-sm bg-background border-border rounded-sm focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Estado */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Estado
        </Label>
        <div className="flex flex-col gap-1.5">
          {ESTADOS.map(({ value, color, activeColor }) => {
            const active = filters.estado.includes(value)
            return (
              <button
                key={value}
                onClick={() => toggleEstado(value)}
                className={`rounded-sm border px-3 py-2 text-xs font-medium transition-all text-left ${
                  active ? activeColor : `${color} hover:opacity-80`
                }`}
              >
                {value}
              </button>
            )
          })}
        </div>
      </div>

      {/* Score range */}
      <div className="space-y-2.5">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Puntuación Total
        </Label>
        <div className="px-0.5">
          <Slider
            min={0}
            max={150}
            step={1}
            value={[filters.totalMin, filters.totalMax]}
            onValueChange={([min, max]) => update({ totalMin: min, totalMax: max })}
            className="mb-2.5"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono tabular-nums">
            <span className="bg-muted border border-border rounded px-1.5 py-0.5">{filters.totalMin}</span>
            <span className="bg-muted border border-border rounded px-1.5 py-0.5">{filters.totalMax}</span>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Ordenar por
        </Label>
        <select
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value })}
          className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {(['asc', 'desc'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => update({ sortDir: dir })}
              className={`flex-1 rounded-sm border py-1.5 text-xs font-medium transition-all ${
                filters.sortDir === dir
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground'
              }`}
            >
              {dir === 'asc' ? 'Ascendente' : 'Descendente'}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
