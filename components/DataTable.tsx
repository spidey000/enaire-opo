'use client'

import { useMemo, useState, useEffect } from 'react'
import { Candidato } from '@/lib/parseCSV'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
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

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase().trim()
    return data.filter((c) => {
      if (search && !c.nombre.toLowerCase().includes(search) && !c.id.toLowerCase().includes(search)) {
        return false
      }
      if (filters.estado.length > 0 && !filters.estado.includes(c.estado)) return false
      if (c.totalFase1 !== null) {
        if (c.totalFase1 < filters.totalMin || c.totalFase1 > filters.totalMax) return false
      } else if (filters.totalMin > 0 || filters.totalMax < 150) {
        return false
      }
      return true
    })
  }, [data, filters])

  useEffect(() => {
    setPage(1)
    setPageInput('1')
  }, [filtered])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const currentRows = filtered.slice(start, start + PAGE_SIZE)

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

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
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          <span className="font-bold text-primary">{filtered.length.toLocaleString('es-ES')}</span>
          {' '}candidatos encontrados
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Mostrando {filtered.length === 0 ? 0 : start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)} de {filtered.length.toLocaleString('es-ES')}
        </span>
      </div>

      <div className="w-full overflow-x-auto" aria-label="Tabla de resultados paginada">
        <table className="w-full min-w-[920px] text-xs table-fixed border-separate border-spacing-0">
          <colgroup>
            {displayedCols.map((col, index) => (
              <col key={`col-${col.key}`} style={{ width: `${(colUnits[index] / totalUnits) * 100}%` }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-border bg-card shadow-[0_1px_0_0_theme(colors.border)]">
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
                <td colSpan={Math.max(1, displayedCols.length)} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No se encontraron candidatos con los filtros aplicados.
                </td>
              </tr>
            ) : (
              currentRows.map((c, i) => (
                <tr
                  key={`${c.id}-${i}`}
                  className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'} hover:bg-primary/5 transition-colors`}
                >
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
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
