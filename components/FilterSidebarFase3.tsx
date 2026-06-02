'use client'

import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import type { FiltersFase3 } from './DataTableFase3'

interface Props {
  filters: FiltersFase3
  onChange: (f: FiltersFase3) => void
  onReset: () => void
}

const RESULTADOS = [
  { value: 'APTO/A', color: 'border-emerald-500 bg-emerald-50 text-emerald-800', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'NO APTO/A', color: 'border-red-400 bg-red-50 text-red-800', activeColor: 'bg-red-600 text-white border-red-600' },
  { value: 'NO PRESENTADO/A', color: 'border-amber-400 bg-amber-50 text-amber-800', activeColor: 'bg-amber-500 text-white border-amber-500' },
  { value: 'EXCLUIDO/A (1)', color: 'border-gray-300 bg-gray-100 text-gray-700', activeColor: 'bg-gray-600 text-white border-gray-600' },
  { value: 'EXCLUIDO/A (2)', color: 'border-gray-300 bg-gray-100 text-gray-700', activeColor: 'bg-gray-600 text-white border-gray-600' },
  { value: 'RENUNCIA', color: 'border-purple-300 bg-purple-50 text-purple-700', activeColor: 'bg-purple-600 text-white border-purple-600' },
  { value: 'RENUNCIA (Incumplimiento base 3.1 c))', color: 'border-purple-300 bg-purple-50 text-purple-700', activeColor: 'bg-purple-600 text-white border-purple-600' },
]

const SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'puntuacion3a', label: 'Puntuación 3A' },
  { value: 'id', label: 'Identificador' },
  { value: 'resultado3a', label: 'Resultado 3A' },
]

export const DEFAULT_FILTERS_FASE3: FiltersFase3 = {
  search: '',
  resultado: [],
  scoreMin: 0,
  scoreMax: 50,
  sortBy: 'nombre',
  sortDir: 'asc',
}

export function FilterSidebarFase3({ filters, onChange, onReset }: Props) {
  const update = (partial: Partial<FiltersFase3>) => onChange({ ...filters, ...partial })

  const toggleResultado = (e: string) => {
    const next = filters.resultado.includes(e)
      ? filters.resultado.filter((x) => x !== e)
      : [...filters.resultado, e]
    update({ resultado: next })
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
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Buscar candidato
        </label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Nombre o identificador..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full h-8 pl-8 rounded-sm border border-border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
      </div>

      {/* Resultado */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Resultado
        </label>
        <div className="flex flex-col gap-1.5">
          {RESULTADOS.map(({ value, color, activeColor }) => {
            const active = filters.resultado.includes(value)
            return (
              <button
                key={value}
                onClick={() => toggleResultado(value)}
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

      {/* Score range slider */}
      <div className="space-y-2.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Puntuación 3A
        </label>
        <div className="px-0.5">
          <Slider
            min={0}
            max={50}
            step={1}
            value={[filters.scoreMin, filters.scoreMax]}
            onValueChange={([min, max]) => update({ scoreMin: min, scoreMax: max })}
            className="mb-2.5"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono tabular-nums">
            <span className="bg-muted border border-border rounded px-1.5 py-0.5">{filters.scoreMin}</span>
            <span className="bg-muted border border-border rounded px-1.5 py-0.5">{filters.scoreMax}</span>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Ordenar por
        </label>
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
