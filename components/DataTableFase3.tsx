'use client'

import { useMemo, useState, useEffect } from 'react'
import { CandidatoFase3, ResultadoFase3 } from '@/lib/parseCSV'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react'

export interface FiltersFase3 {
  search: string
  resultado: string[]
  scoreMin: number
  scoreMax: number
  sortBy: string
  sortDir: 'asc' | 'desc'
}

interface Props {
  data: CandidatoFase3[]
  filters: FiltersFase3
  onSortChange: (col: string) => void
}

const PAGE_SIZE = 25

const RESULTADO_COLORS: Record<string, string> = {
  'APTO/A': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'NO APTO/A': 'bg-red-50 text-red-700 border-red-200',
  'NO PRESENTADO/A': 'bg-amber-50 text-amber-700 border-amber-200',
  'EXCLUIDO/A (1)': 'bg-gray-100 text-gray-600 border-gray-300',
  'EXCLUIDO/A (2)': 'bg-gray-100 text-gray-600 border-gray-300',
  'RENUNCIA': 'bg-purple-50 text-purple-700 border-purple-200',
  'RENUNCIA (Incumplimiento base 3.1 c))': 'bg-purple-50 text-purple-700 border-purple-200',
}

function ResultadoBadge({ resultado }: { resultado: ResultadoFase3 | null }) {
  if (!resultado) return <span className="text-muted-foreground/40">—</span>
  const color = RESULTADO_COLORS[resultado] ?? 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold border ${color}`}>
      {resultado}
    </span>
  )
}

function fmt(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(2)
}

export const COLUMNS_FASE3 = [
  { key: 'ranking', label: 'Rank.', align: 'text-right' },
  { key: 'id', label: 'Identificador' },
  { key: 'nombre', label: 'Nombre y Apellidos' },
  { key: 'resultado3a', label: 'Resultado 3A' },
  { key: 'puntuacion3a', label: 'Puntuación 3A', align: 'text-right' },
]

export function DataTableFase3({ data, filters, onSortChange }: Props) {
  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [showAll, setShowAll] = useState(false)
  const [localSearch, setLocalSearch] = useState('')
  const [pinnedIds, setPinnedIds] = useState<string[]>([])

  const filtered = useMemo(() => {
    const search = localSearch.toLowerCase().trim()
    return data.filter((c) => {
      if (pinnedIds.includes(c.id)) return true
      if (search && !c.nombre.toLowerCase().includes(search) && !c.id.toLowerCase().includes(search)) return false
      if (filters.resultado.length > 0) {
        const r = c.resultado3a ?? ''
        if (!filters.resultado.includes(r)) return false
      }
      if (c.puntuacion3a !== null) {
        if (c.puntuacion3a < filters.scoreMin || c.puntuacion3a > filters.scoreMax) return false
      } else if (filters.scoreMin > 0 || filters.scoreMax < 50) {
        return false
      }
      return true
    })
  }, [data, filters, pinnedIds, localSearch])

  useEffect(() => {
    setPage(1)
    setPageInput('1')
  }, [filtered])

  const pinnedRows = filtered.filter(c => pinnedIds.includes(c.id))
  const unpinnedRows = filtered.filter(c => !pinnedIds.includes(c.id))
  const totalPages = Math.max(1, Math.ceil(unpinnedRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const unpinnedStart = showAll ? 0 : (safePage - 1) * PAGE_SIZE
  const unpinnedPageRows = showAll ? unpinnedRows : unpinnedRows.slice(unpinnedStart, unpinnedStart + PAGE_SIZE)
  const currentRows = [...pinnedRows, ...unpinnedPageRows]

  const togglePin = (id: string) => {
    setPinnedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const clearPins = () => setPinnedIds([])

  useEffect(() => {
    if (!showAll) setPage((current) => Math.min(current, totalPages))
  }, [totalPages, showAll])

  const paginationItems = useMemo(() => {
    const items: Array<number | 'ellipsis'> = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) items.push(i)
      return items
    }
    items.push(1)
    if (safePage > 3) items.push('ellipsis')
    const from = Math.max(2, safePage - 1)
    const to = Math.min(totalPages - 1, safePage + 1)
    for (let i = from; i <= to; i += 1) items.push(i)
    if (safePage < totalPages - 2) items.push('ellipsis')
    items.push(totalPages)
    return items
  }, [safePage, totalPages])

  function SortIcon({ col }: { col: string }) {
    if (col === 'id') return null
    if (filters.sortBy === col) {
      return filters.sortDir === 'asc'
        ? <ArrowUp className="h-3 w-3 text-primary" />
        : <ArrowDown className="h-3 w-3 text-primary" />
    }
    return <ArrowUpDown className="h-3 w-3 opacity-30" />
  }

  return (
    <div className="bg-card border border-border rounded-sm shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            <span className="font-bold text-primary">{filtered.length.toLocaleString('es-ES')}</span>
            {' '}candidatos
          </span>
          {pinnedIds.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-2 py-1">
              <span>📍 {pinnedIds.length} fijado{pinnedIds.length > 1 ? 's' : ''}</span>
              <button onClick={clearPins} className="ml-1 hover:text-amber-900 font-bold" title="Limpiar fijados">✕</button>
            </span>
          )}
        </div>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                placeholder="Buscar..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-7 pr-6 h-7 w-28 sm:w-40 text-xs rounded-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              {localSearch && (
                <button onClick={() => setLocalSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-2 whitespace-nowrap"
            >
              {showAll ? '📄 25/página' : '📋 Ver todos'}
            </button>
            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap hidden sm:inline">
            {showAll
              ? `Mostrando todos (${filtered.length.toLocaleString('es-ES')})`
              : `Mostrando ${unpinnedRows.length === 0 ? 0 : unpinnedStart + 1}-${Math.min(unpinnedStart + PAGE_SIZE, unpinnedRows.length)} de ${unpinnedRows.length.toLocaleString('es-ES')}`}
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto" aria-label="Tabla de resultados Fase 3a">
        <table className="w-full min-w-[600px] text-xs table-fixed border-separate border-spacing-0">
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '33%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '23%' }} />
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-border bg-card shadow-[0_1px_0_0_theme(colors.border)]">
              <th className="w-7 px-1 py-3 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider text-center" scope="col"></th>
              {COLUMNS_FASE3.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSortChange(col.key)}
                  className={`px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none bg-card ${col.align ?? 'text-left'}`}
                  scope="col"
                >
                  <div className={`flex items-center gap-1 ${col.align === 'text-right' ? 'justify-end' : ''}`}>
                    {col.label}
                    <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS_FASE3.length + 1} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No se encontraron candidatos con los filtros aplicados.
                </td>
              </tr>
            ) : (
              currentRows.map((c, i) => {
                const isPinned = pinnedIds.includes(c.id)
                return (
                <tr
                  key={`${c.id}-${i}`}
                  className={`${isPinned ? 'bg-amber-50/80' : i % 2 === 0 ? 'bg-card' : 'bg-muted/20'} hover:bg-primary/5 transition-colors`}
                >
                  <td className="px-1 py-2.5 w-7 text-center">
                    <button onClick={() => togglePin(c.id)} className="text-xs hover:scale-110 transition-transform" title={isPinned ? 'Desfijar candidato' : 'Fijar candidato'}>
                      {isPinned ? '📍' : '📌'}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-right text-[11px] w-10">
                    <span className="font-bold text-primary">{c.ranking}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px] whitespace-nowrap">{c.id}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground break-words">{c.nombre}</td>
                  <td className="px-3 py-2.5"><ResultadoBadge resultado={c.resultado3a} /></td>
                  <td className="px-3 py-2.5 font-mono text-right font-bold text-[12px]">
                    {c.puntuacion3a !== null
                      ? <span className="text-foreground">{fmt(c.puntuacion3a)}</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {unpinnedRows.length > 0 && !showAll && (
        <div className="px-4 py-3 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Página {safePage} de {totalPages}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2.5 py-1 text-xs rounded border border-border disabled:opacity-40"
            >
              Anterior
            </button>
            {paginationItems.map((item, index) => (
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-1 text-xs text-muted-foreground">…</span>
              ) : (
                <button
                  key={`page-${item}`}
                  onClick={() => { setPage(item); setPageInput(String(item)) }}
                  className={`px-2.5 py-1 text-xs rounded border ${safePage === item ? 'border-primary text-primary bg-primary/10' : 'border-border'}`}
                >
                  {item}
                </button>
              )
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2.5 py-1 text-xs rounded border border-border disabled:opacity-40"
            >
              Siguiente
            </button>
            <form
              className="flex items-center gap-1 ml-2"
              onSubmit={(event) => {
                event.preventDefault()
                const next = Number(pageInput)
                if (!Number.isFinite(next)) return
                const clamped = Math.min(totalPages, Math.max(1, Math.floor(next)))
                setPage(clamped)
                setPageInput(String(clamped))
              }}
            >
              <label htmlFor="fase3-page-input" className="text-xs text-muted-foreground">Ir a</label>
              <input
                id="fase3-page-input"
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                className="w-16 rounded border border-border bg-background px-2 py-1 text-xs"
              />
              <button type="submit" className="px-2 py-1 text-xs rounded border border-border">OK</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
