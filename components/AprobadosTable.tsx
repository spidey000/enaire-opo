'use client'

import { useMemo, useState, useEffect } from 'react'
import { Candidato } from '@/lib/parseCSV'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Filters } from './FilterSidebar'

interface Props {
  data: Candidato[]
  filters: Filters
  onSortChange: (col: string) => void
}

const PAGE_SIZE = 20

export function AprobadosTable({ data, filters, onSortChange }: Props) {
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
      return c.estado === 'APTO/A'
    })
  }, [data, filters])

  useEffect(() => {
    setPage(1)
    setPageInput('1')
  }, [filters, data])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const currentRows = filtered.slice(start, start + PAGE_SIZE)

  const paginationItems: Array<number | 'ellipsis'> = useMemo(() => {
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

  const cols: { key: string; label: string; align?: string }[] = [
    { key: 'ranking', label: 'Rank.', align: 'text-right' },
    { key: 'id', label: 'Identificador' },
    { key: 'nombre', label: 'Nombre y Apellidos' },
    { key: 'rankingConocimientos', label: 'Rank conocimientos', align: 'text-right' },
    { key: 'rankingIngles', label: 'Rank inglés', align: 'text-right' },
    { key: 'rankingAptitud', label: 'Rank aptitudes', align: 'text-right' },
  ]

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
    <div className="bg-card border border-border rounded-sm shadow-sm overflow-hidden w-full">
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Visualización simplificada de <span className="font-bold text-emerald-600">aprobados</span>
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {filtered.length.toLocaleString('es-ES')} candidatos APTO/A
        </span>
      </div>

      <div className="w-full overflow-hidden">
        <table className="w-full text-xs table-fixed">
          <colgroup>
            <col style={{ width: '14.29%' }} />
            <col style={{ width: '14.29%' }} />
            <col style={{ width: '28.58%' }} />
            <col style={{ width: '14.29%' }} />
            <col style={{ width: '14.29%' }} />
            <col style={{ width: '14.29%' }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border shadow-[0_1px_0_0_theme(colors.border)]">
              {cols.map((col) => (
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
            {currentRows.map((c, i) => (
              <tr key={`${c.id}-${i}`} className="hover:bg-primary/5 transition-colors">
                <td className="px-3 py-2.5 font-mono text-right font-semibold text-primary">{c.ranking ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">{c.id}</td>
                <td className="px-3 py-2.5 font-medium text-foreground break-words">{c.nombre}</td>
                <td className="px-3 py-2.5 font-mono text-right">{c.rankingConocimientos ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-right">{c.rankingIngles ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-right">{c.rankingAptitud ?? '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No hay candidatos APTO/A con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Mostrando {start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)} de {filtered.length}
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
              <label htmlFor="aprobados-page-input" className="text-xs text-muted-foreground">Ir a</label>
              <input
                id="aprobados-page-input"
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
