'use client'

import { SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import type { FiltersFase3C } from './DataTableFase3c'

interface Props {
  filters: FiltersFase3C
  onChange: (f: FiltersFase3C) => void
  onReset: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const RESULTADOS = [
  { value: 'APTO/A', color: 'border-emerald-500 bg-emerald-50 text-emerald-800', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'NO APTO/A', color: 'border-red-400 bg-red-50 text-red-800', activeColor: 'bg-red-600 text-white border-red-600' },
]

const SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'id', label: 'Identificador' },
  { value: 'resultado3c', label: 'Resultado 3C' },
]

export const DEFAULT_FILTERS_FASE3C: FiltersFase3C = {
  search: '',
  resultado: [],
  sortBy: 'nombre',
  sortDir: 'asc',
}

export function FilterSidebarFase3c({ filters, onChange, onReset, collapsed, onToggleCollapse }: Props) {
  const update = (partial: Partial<FiltersFase3C>) => onChange({ ...filters, ...partial })

  const toggleResultado = (e: string) => {
    const next = filters.resultado.includes(e)
      ? filters.resultado.filter((x) => x !== e)
      : [...filters.resultado, e]
    update({ resultado: next })
  }

  if (collapsed) {
    return (
      <aside className="flex flex-col items-center gap-4 bg-card border border-border rounded-sm py-5 h-fit sticky top-[57px] shadow-sm w-12">
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-8 h-8 rounded-sm hover:bg-muted transition-colors"
          title="Abrir filtros"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
      </aside>
    )
  }

  return (
    <aside className="flex flex-col gap-5 bg-card border border-border rounded-sm p-5 h-fit sticky top-[57px] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button onClick={onToggleCollapse} className="hover:bg-muted rounded-sm p-0.5 -ml-1 transition-colors" title="Cerrar filtros">
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
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
