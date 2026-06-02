'use client'

import { useMemo, useState, useEffect } from 'react'
import { CandidatoFase3, ResultadoFase3 } from '@/lib/parseCSV'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

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
  { key: 'id', label: 'Identificador' },
  { key: 'nombre', label: 'Nombre y Apellidos' },
  { key: 'resultado3a', label: 'Resultado 3A' },
  { key: 'puntuacion3a', label: 'Puntuación 3A', align: 'text-right' },
]

export function DataTableFase3({ data, filters, onSortChange }: Props) {
  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')

  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase().trim()
    return data.filter((c) => {
      if (search && !c.nombre.toLowerCase().includes(search) && !c.id.toLowerCase().includes(search)) {
        return false
      }
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
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          <span className="font-bold text-primary">{filtered.length.toLocaleString('es-ES')}</span>
          {' '}candidatos encontrados
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Mostrando {filtered.length === 0 ? 0 : start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)} de {filtered.length.toLocaleString('es-ES')}
        </span>
      </div>

      <div className="w-full overflow-x-auto" aria-label="Tabla de resultados Fase 3a">
        <table className="w-full min-w-[600px] text-xs table-fixed border-separate border-spacing-0">
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '35%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-border bg-card shadow-[0_1px_0_0_theme(colors.border)]">
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
                <td colSpan={COLUMNS_FASE3.length} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No se encontraron candidatos con los filtros aplicados.
                </td>
              </tr>
            ) : (
              currentRows.map((c, i) => (
                <tr
                  key={`${c.id}-${i}`}
                  className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'} hover:bg-primary/5 transition-colors`}
                >
                  <td className="px-3 py-2.5 font-mono text-muted-foreground text-[11px] whitespace-nowrap">{c.id}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground break-words">{c.nombre}</td>
                  <td className="px-3 py-2.5"><ResultadoBadge resultado={c.resultado3a} /></td>
                  <td className="px-3 py-2.5 font-mono text-right font-bold text-[12px]">
                    {c.puntuacion3a !== null
                      ? <span className="text-foreground">{fmt(c.puntuacion3a)}</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
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
