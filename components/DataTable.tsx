'use client'

import { useMemo, useState, useEffect } from 'react'
import { Candidato } from '@/lib/parseCSV'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react'
import type { Filters } from './FilterSidebar'

export interface TableColumn {
  key: string
  label: string
  align?: string
  defaultVisible?: boolean
}

export type ColumnVisibility = Record<string, boolean>

interface Props {
  data: Candidato[]
  filters: Filters
  onSortChange: (col: string) => void
  visibleColumns: ColumnVisibility
}

const PAGE_SIZE = 25

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === 'APTO/A') {
    return (
      <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        APTO/A
      </span>
    )
  }
  if (estado === 'NO APTO/A') {
    return (
      <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
        NO APTO/A
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      NO PRES.
    </span>
  )
}

function fmt(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(2)
}

export const TABLE_COLUMNS: TableColumn[] = [
  { key: 'ranking', label: 'Rank.', align: 'text-right', defaultVisible: true },
  { key: 'id', label: 'Identificador', defaultVisible: false },
  { key: 'nombre', label: 'Nombre y Apellidos', defaultVisible: true },
  { key: 'conocimientosGenerales', label: 'Con. Gen.', align: 'text-right', defaultVisible: false },
  { key: 'ingles', label: 'Inglés', align: 'text-right', defaultVisible: false },
  { key: 'aptitudes', label: 'Aptitudes', align: 'text-right', defaultVisible: false },
  { key: 'totalFase1', label: 'Total F1', align: 'text-right', defaultVisible: true },
  { key: 'estado', label: 'Estado', defaultVisible: false },
  { key: 'rankingConocimientos', label: 'Rk. Con.', align: 'text-right', defaultVisible: true },
  { key: 'rankingIngles', label: 'Rk. Ing.', align: 'text-right', defaultVisible: true },
  { key: 'rankingAptitud', label: 'Rk. Apt.', align: 'text-right', defaultVisible: true },
]

export const DEFAULT_VISIBLE_COLUMNS: ColumnVisibility = Object.fromEntries(
  TABLE_COLUMNS.map((col) => [col.key, col.defaultVisible !== false])
) as ColumnVisibility

export function DataTable({ data, filters, onSortChange, visibleColumns }: Props) {
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
      if (filters.estado.length > 0 && !filters.estado.includes(c.estado)) return false
      if (c.totalFase1 !== null) {
        if (c.totalFase1 < filters.totalMin || c.totalFase1 > filters.totalMax) return false
      } else if (filters.totalMin > 0 || filters.totalMax < 150) {
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

  const togglePin = (id: string) => {
    setPinnedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const clearPins = () => setPinnedIds([])

  const displayedCols = TABLE_COLUMNS.filter((col) => visibleColumns[col.key])

  const colUnits = displayedCols.map((col) => (col.key === 'nombre' ? 3 : 1))
  const totalUnits = colUnits.reduce((sum, units) => sum + units, 0)

  function SortIcon({ col }: { col: string }) {
    if (col === 'id' || col === 'estado') return null
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
              <span>★ {pinnedIds.length} fijado{pinnedIds.length > 1 ? 's' : ''}</span>
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

      <div className="w-full overflow-x-auto" aria-label="Tabla de resultados paginada">
        <table className="w-full min-w-[600px] lg:min-w-[920px] text-xs table-fixed border-separate border-spacing-0">
          <colgroup>
            {displayedCols.map((col, index) => (
              <col key={`col-${col.key}`} style={{ width: `${(colUnits[index] / totalUnits) * 100}%` }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-border bg-card shadow-[0_1px_0_0_theme(colors.border)]">
              <th className="w-7 px-1 py-3 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider text-center" scope="col"></th>
              {displayedCols.map((col) => (
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
                <td colSpan={Math.max(1, displayedCols.length + 1)} className="px-4 py-16 text-center text-sm text-muted-foreground">
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
                      {isPinned ? '★' : '☆'}
                    </button>
                  </td>
                  {displayedCols.map((col) => {
                    switch (col.key) {
                      case 'ranking':
                        return (
                          <td key={`${c.id}-${i}-ranking`} className="px-3 py-2.5 font-mono text-right text-[11px] w-10">
                            {c.ranking !== null
                              ? <span className="font-bold text-primary">{c.ranking}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        )
                      case 'id':
                        return <td key={`${c.id}-${i}-id`} className="px-3 py-2.5 font-mono text-muted-foreground text-[11px] whitespace-nowrap">{c.id}</td>
                      case 'nombre':
                        return <td key={`${c.id}-${i}-nombre`} className="px-3 py-2.5 font-medium text-foreground break-words">{c.nombre}</td>
                      case 'conocimientosGenerales':
                        return (
                          <td key={`${c.id}-${i}-con`} className="px-3 py-2.5 font-mono text-right text-[11px]">
                            {c.conocimientosGenerales !== null
                              ? <span className="text-primary font-semibold">{fmt(c.conocimientosGenerales)}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        )
                      case 'ingles':
                        return (
                          <td key={`${c.id}-${i}-ing`} className="px-3 py-2.5 font-mono text-right text-[11px]">
                            {c.ingles !== null
                              ? <span className="text-indigo-600 font-semibold">{fmt(c.ingles)}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        )
                      case 'aptitudes':
                        return (
                          <td key={`${c.id}-${i}-apt`} className="px-3 py-2.5 font-mono text-right text-[11px]">
                            {c.aptitudes !== null
                              ? <span className="text-emerald-700 font-semibold">{fmt(c.aptitudes)}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        )
                      case 'totalFase1':
                        return (
                          <td key={`${c.id}-${i}-total`} className="px-3 py-2.5 font-mono text-right font-bold text-[12px]">
                            {c.totalFase1 !== null
                              ? <span className="text-foreground">{fmt(c.totalFase1)}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        )
                      case 'estado':
                        return <td key={`${c.id}-${i}-estado`} className="px-3 py-2.5 whitespace-nowrap"><EstadoBadge estado={c.estado} /></td>
                      case 'rankingConocimientos':
                        return (
                          <td key={`${c.id}-${i}-rkcon`} className="px-3 py-2.5 font-mono text-right text-[11px]">
                            {c.rankingConocimientos !== null
                              ? <span className="text-primary">{c.rankingConocimientos}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        )
                      case 'rankingIngles':
                        return (
                          <td key={`${c.id}-${i}-rking`} className="px-3 py-2.5 font-mono text-right text-[11px]">
                            {c.rankingIngles !== null
                              ? <span className="text-indigo-600">{c.rankingIngles}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        )
                      case 'rankingAptitud':
                        return (
                          <td key={`${c.id}-${i}-rkapt`} className="px-3 py-2.5 font-mono text-right text-[11px]">
                            {c.rankingAptitud !== null
                              ? <span className="text-emerald-700">{c.rankingAptitud}</span>
                              : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        )
                      default:
                        return null
                    }
                  })}
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
                  onClick={() => {
                    setPage(item)
                    setPageInput(String(item))
                  }}
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
              <label htmlFor="tabla-page-input" className="text-xs text-muted-foreground">Ir a</label>
              <input
                id="tabla-page-input"
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
