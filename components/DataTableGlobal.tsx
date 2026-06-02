'use client'

import { useMemo, useState, useEffect } from 'react'
import { CandidatoGlobal } from '@/lib/parseCSV'
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  data: CandidatoGlobal[]
}

const PAGE_SIZE = 25

function fmt(v: number | null): string {
  if (v === null) return '—'
  return v.toFixed(2)
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground/40">—</span>
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold" title="Mejoró">
        <TrendingUp className="h-3 w-3" />
        +{delta}
      </span>
    )
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-600 font-semibold" title="Empeoró">
        <TrendingDown className="h-3 w-3" />
        {delta}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground" title="Sin cambios">
      <Minus className="h-3 w-3" />
      0
    </span>
  )
}

const COLUMNS = [
  { key: 'rankingGlobal', label: 'Rank.', align: 'text-right' },
  { key: 'nombre', label: 'Nombre y Apellidos' },
  { key: 'totalFase1', label: 'Total F1', align: 'text-right' },
  { key: 'puntuacionFase2', label: 'Punt. F2', align: 'text-right' },
  { key: 'evolF1aF2', label: 'Δ F1→F2', align: 'text-right' },
  { key: 'puntuacionFase3a', label: 'Punt. 3A', align: 'text-right' },
  { key: 'evolF2aF3a', label: 'Δ F2→3A', align: 'text-right' },
  { key: 'evolF1aF3a', label: 'Δ F1→3A', align: 'text-right' },
  { key: 'puntuacionGlobal', label: 'Total Global', align: 'text-right' },
]

export function DataTableGlobal({ data }: Props) {
  const [page, setPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [showAll, setShowAll] = useState(false)
  const [sortBy, setSortBy] = useState('rankingGlobal')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = (a as any)[sortBy]
      const bv = (b as any)[sortBy]
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      let cmp = 0
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv
      } else {
        cmp = String(av).localeCompare(String(bv), 'es')
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortBy, sortDir])

  useEffect(() => {
    setPage(1)
    setPageInput('1')
  }, [sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = showAll ? 0 : (safePage - 1) * PAGE_SIZE
  const currentRows = showAll ? sortedData : sortedData.slice(start, start + PAGE_SIZE)

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

  function handleSort(col: string) {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir(col === 'rankingGlobal' ? 'asc' : 'desc')
    }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortBy === col) {
      return sortDir === 'asc'
        ? <ArrowUp className="h-3 w-3 text-primary" />
        : <ArrowDown className="h-3 w-3 text-primary" />
    }
    return <ArrowUpDown className="h-3 w-3 opacity-30" />
  }

  return (
    <div className="bg-card border border-border rounded-sm shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          <span className="font-bold text-primary">{sortedData.length.toLocaleString('es-ES')}</span>
          {' '}candidatos en ranking global
        </span>
        <span className="flex items-center gap-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
          >
            {showAll ? '📄 25/página' : '📋 Ver todos'}
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {showAll
              ? `Mostrando todos (${sortedData.length.toLocaleString('es-ES')})`
              : `Mostrando ${sortedData.length === 0 ? 0 : start + 1}-${Math.min(start + PAGE_SIZE, sortedData.length)} de ${sortedData.length.toLocaleString('es-ES')}`}
          </span>
        </span>
      </div>

      <div className="w-full overflow-x-auto" aria-label="Tabla de ranking global">
        <table className="w-full min-w-[800px] text-xs table-fixed border-separate border-spacing-0">
          <colgroup>
            <col style={{ width: '7%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-border bg-card shadow-[0_1px_0_0_theme(colors.border)]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
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
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No hay datos para el ranking global.
                </td>
              </tr>
            ) : (
              currentRows.map((c, i) => (
                <tr
                  key={`global-${c.id}`}
                  className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'} hover:bg-primary/5 transition-colors`}
                >
                  <td className="px-3 py-2.5 font-mono text-right text-[11px] w-10">
                    <span className="font-bold text-primary">{c.rankingGlobal}</span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground break-words">{c.nombre}</td>
                  <td className="px-3 py-2.5 font-mono text-right text-[11px]">
                    {c.totalFase1 !== null
                      ? <span className="text-primary font-semibold">{fmt(c.totalFase1)}</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-right text-[11px]">
                    {c.puntuacionFase2 !== null
                      ? <span className="text-foreground font-semibold">{fmt(c.puntuacionFase2)}</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[11px]">
                    <DeltaBadge delta={c.evolF1aF2} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-right text-[11px]">
                    {c.puntuacionFase3a !== null
                      ? <span className="text-indigo-600 font-semibold">{fmt(c.puntuacionFase3a)}</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[11px]">
                    <DeltaBadge delta={c.evolF2aF3a} />
                  </td>
                  <td className="px-3 py-2.5 text-right text-[11px]">
                    <DeltaBadge delta={c.evolF1aF3a} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-right font-bold text-[12px]">
                    {c.puntuacionGlobal !== null
                      ? <span className="text-foreground">{fmt(c.puntuacionGlobal)}</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sortedData.length > 0 && !showAll && (
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
              <label htmlFor="global-page-input" className="text-xs text-muted-foreground">Ir a</label>
              <input
                id="global-page-input"
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
