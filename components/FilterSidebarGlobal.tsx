'use client'

import { SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { GLOBAL_COLUMNS, type GlobalColumnVisibility } from './DataTableGlobal'
import type { FiltersGlobal } from './DataTableGlobal'

interface Props {
  filters: FiltersGlobal
  onChange: (f: FiltersGlobal) => void
  onReset: () => void
  visibleColumns: GlobalColumnVisibility
  onToggleColumn: (key: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const SORT_OPTIONS = [
  { value: 'rankingGlobal', label: 'Ranking Global' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'puntuacionGlobal', label: 'Total Global' },
  { value: 'totalFase1', label: 'Total F1' },
  { value: 'puntuacionFase2', label: 'Punt. F2' },
  { value: 'puntuacionFase3a', label: 'Punt. 3A' },
  { value: 'evolF1aF2', label: 'Δ F1→F2' },
  { value: 'evolF2aF3a', label: 'Δ F2→3A' },
  { value: 'evolF1aF3a', label: 'Δ F1→3A' },
]

export function FilterSidebarGlobal({ filters, onChange, onReset, visibleColumns, onToggleColumn, collapsed, onToggleCollapse }: Props) {
  const update = (partial: Partial<FiltersGlobal>) => onChange({ ...filters, ...partial })

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

      {/* Score range */}
      <div className="space-y-2.5">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Puntuación Global
        </Label>
        <div className="px-0.5">
          <Slider
            min={0}
            max={300}
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

      {/* Column visibility */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Columnas
        </Label>
        <div className="flex flex-col gap-1.5">
          {GLOBAL_COLUMNS.map((col) => {
            const enabled = visibleColumns[col.key]
            return (
              <button
                key={col.key}
                onClick={() => onToggleColumn(col.key)}
                className={`rounded-sm border px-3 py-2 text-xs font-medium transition-all text-left flex items-center justify-between ${
                  enabled
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <span>{col.label}</span>
                <span className="text-[10px] uppercase tracking-wide">{enabled ? 'On' : 'Off'}</span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
