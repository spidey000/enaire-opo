'use client'

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Candidato } from '@/lib/parseCSV'
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { Filters } from './FilterSidebar'

interface Props {
  data: Candidato[]
  filters: Filters
  onSortChange: (col: string) => void
}

const BATCH = 50

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === 'APTO/A')
    return (
      <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        APTO/A
      </span>
    )
  if (estado === 'NO APTO/A')
    return (
      <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
        NO APTO/A
      </span>
    )
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

export function DataTable({ data, filters, onSortChange }: Props) {
  const [visibleCount, setVisibleCount] = useState(BATCH)
  const sentinelRef = useRef<HTMLTableRowElement>(null)

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase().trim()
    return data.filter((c) => {
      if (search && !c.nombre.toLowerCase().includes(search) && !c.id.toLowerCase().includes(search))
        return false
      if (filters.estado.length > 0 && !filters.estado.includes(c.estado)) return false
      if (c.totalFase1 !== null) {
        if (c.totalFase1 < filters.totalMin || c.totalFase1 > filters.totalMax) return false
      } else {
        if (filters.totalMin > 0 || filters.totalMax < 150) return false
      }
      return true
    })
  }, [data, filters])

  // Reset visible count whenever filters change
  useEffect(() => {
    setVisibleCount(BATCH)
  }, [filtered])

  const slice = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const loadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + BATCH, filtered.length))
  }, [filtered.length])

  // IntersectionObserver sentinel
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  const cols: { key: string; label: string; align?: string }[] = [
    { key: 'ranking', label: 'Rank.' },
    { key: 'id', label: 'Identificador' },
    { key: 'nombre', label: 'Nombre y Apellidos' },
    { key: 'conocimientosGenerales', label: 'Con. Gen.', align: 'text-right' },
    { key: 'ingles', label: 'Inglés', align: 'text-right' },
    { key: 'aptitudes', label: 'Aptitudes', align: 'text-right' },
    { key: 'totalFase1', label: 'Total F1', align: 'text-right' },
    { key: 'estado', label: 'Estado' },
    { key: 'rankingConocimientos', label: 'Rk. Con.', align: 'text-right' },
    { key: 'rankingIngles', label: 'Rk. Ing.', align: 'text-right' },
    { key: 'rankingAptitud', label: 'Rk. Apt.', align: 'text-right' },
  ]

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
      {/* Info bar */}
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          <span className="font-bold text-primary">{filtered.length.toLocaleString('es-ES')}</span>
          {' '}candidatos encontrados
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Mostrando {Math.min(visibleCount, filtered.length).toLocaleString('es-ES')} de {filtered.length.toLocaleString('es-ES')}
        </span>
      </div>

      {/* Scrollable table wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-card shadow-[0_1px_0_0_theme(colors.border)]">
              {cols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSortChange(col.key)}
                  className={`px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none ${col.align ?? 'text-left'}`}
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
            {slice.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No se encontraron candidatos con los filtros aplicados.
                </td>
              </tr>
            ) : (
              <>
                {slice.map((c, i) => (
                  <tr
                    key={`${c.id}-${i}`}
                    className="hover:bg-primary/5 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-mono text-right text-[11px] w-10">
                      {c.ranking !== null
                        ? <span className="font-bold text-primary">{c.ranking}</span>
                        : <span className="text-muted-foreground/40">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px] whitespace-nowrap">
                      {c.id}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-foreground min-w-[200px] max-w-[280px] truncate">
                      {c.nombre}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-right text-[11px]">
                      {c.conocimientosGenerales !== null
                        ? <span className="text-primary font-semibold">{fmt(c.conocimientosGenerales)}</span>
                        : <span className="text-muted-foreground/40">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 font-mono text-right text-[11px]">
                      {c.ingles !== null
                        ? <span className="text-indigo-600 font-semibold">{fmt(c.ingles)}</span>
                        : <span className="text-muted-foreground/40">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 font-mono text-right text-[11px]">
                      {c.aptitudes !== null
                        ? <span className="text-emerald-700 font-semibold">{fmt(c.aptitudes)}</span>
                        : <span className="text-muted-foreground/40">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 font-mono text-right font-bold text-[12px]">
                      {c.totalFase1 !== null
                        ? <span className="text-foreground">{fmt(c.totalFase1)}</span>
                        : <span className="text-muted-foreground/40">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <EstadoBadge estado={c.estado} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-right text-[11px]">
                      {c.rankingConocimientos !== null
                        ? <span className="text-primary">{c.rankingConocimientos}</span>
                        : <span className="text-muted-foreground/40">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 font-mono text-right text-[11px]">
                      {c.rankingIngles !== null
                        ? <span className="text-indigo-600">{c.rankingIngles}</span>
                        : <span className="text-muted-foreground/40">—</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 font-mono text-right text-[11px]">
                      {c.rankingAptitud !== null
                        ? <span className="text-emerald-700">{c.rankingAptitud}</span>
                        : <span className="text-muted-foreground/40">—</span>
                      }
                    </td>
                  </tr>
                ))}

                {/* Sentinel row — triggers loading more when it enters the viewport */}
                {hasMore && (
                  <tr ref={sentinelRef}>
                    <td colSpan={11} className="py-6 text-center">
                      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        Cargando más resultados...
                      </span>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      {!hasMore && filtered.length > 0 && (
        <div className="px-4 py-3 border-t border-border bg-muted/20 text-center text-xs text-muted-foreground">
          Todos los resultados cargados &mdash; {filtered.length.toLocaleString('es-ES')} candidatos
        </div>
      )}
    </div>
  )
}
