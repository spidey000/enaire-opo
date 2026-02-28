'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Candidato } from '@/lib/parseCSV'
import { StatsCards } from '@/components/StatsCards'
import { ChartsPanel } from '@/components/ChartsPanel'
import { FilterSidebar, Filters, DEFAULT_FILTERS } from '@/components/FilterSidebar'
import { DataTable } from '@/components/DataTable'
import { BarChart3, Table2, Loader2, FileSpreadsheet, CheckCheck } from 'lucide-react'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

type Tab = 'tabla' | 'graficas' | 'aprobados'

export default function Home() {
  const { data, error, isLoading } = useSWR<Candidato[]>('/api/candidatos', fetcher)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [tab, setTab] = useState<Tab>('tabla')

  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    return [...data].sort((a, b) => {
      const key = filters.sortBy as keyof Candidato
      const av = a[key]
      const bv = b[key]
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      let cmp = 0
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv
      } else {
        cmp = String(av).localeCompare(String(bv), 'es')
      }
      return filters.sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, filters.sortBy, filters.sortDir])

  const aptosData = useMemo(
    () => sortedData.filter((c) => c.estado === 'APTO/A'),
    [sortedData]
  )

  const handleSortChange = (col: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: col,
      sortDir: prev.sortBy === col && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }))
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">

      {/* Top navigation bar — ENAIRE style cyan-blue */}
      <header className="bg-primary sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-0 flex items-stretch gap-8">
          {/* Brand */}
          <div className="flex items-center gap-2.5 py-3 pr-8 border-r border-white/20">
            <FileSpreadsheet className="h-5 w-5 text-white shrink-0" />
            <span className="text-white font-bold text-sm tracking-wide uppercase leading-none">
              ENAIRE
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-stretch gap-0">
            <button
              onClick={() => setTab('tabla')}
              className="flex items-center px-4 py-3 text-sm text-white/90 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border-b-2 border-transparent"
            >
              Resultados
            </button>
            <button
              onClick={() => setTab('graficas')}
              className="flex items-center px-4 py-3 text-sm text-white/90 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border-b-2 border-transparent"
            >
              Estadísticas
            </button>
            <a
              href="#informacion"
              className="flex items-center px-4 py-3 text-sm text-white/90 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border-b-2 border-transparent"
            >
              Información
            </a>
          </nav>

          {/* Right side badge */}
          <div className="ml-auto flex items-center">
            {Array.isArray(data) && (
              <span className="text-xs text-white/80 font-medium">
                {data.length.toLocaleString('es-ES')} registros
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-10 space-y-10">

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando datos del listado provisional...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Error al cargar los datos. Por favor, recarga la página.
          </div>
        )}

        {Array.isArray(data) && !isLoading && (
          <>
            {/* Page heading — ENAIRE style */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                RESULTADOS
              </p>
              <h1 className="text-3xl font-bold text-foreground text-balance leading-tight">
                Listado Provisional Fase 1
              </h1>
              {/* Cyan underline accent */}
              <div className="mt-2 h-0.5 w-10 bg-primary" />
            </div>

            {/* Stats row */}
            <StatsCards data={data} />

            {/* Tab bar */}
            <div className="border-b border-border">
              <div className="flex items-stretch gap-0">
                {[
                  { id: 'tabla' as Tab, label: 'Tabla de Datos', icon: Table2 },
                  { id: 'graficas' as Tab, label: 'Estadísticas y Gráficas', icon: BarChart3 },
                  { id: 'aprobados' as Tab, label: 'Solo Aprobados', icon: CheckCheck },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                      tab === id
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Tab */}
            {tab === 'tabla' && (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-60 shrink-0">
                  <FilterSidebar
                    filters={filters}
                    onChange={setFilters}
                    onReset={() => setFilters(DEFAULT_FILTERS)}
                  />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <DataTable
                    data={sortedData}
                    filters={filters}
                    onSortChange={handleSortChange}
                  />
                </div>
              </div>
            )}

            {/* Charts Tab */}
            {tab === 'graficas' && (
              <div className="space-y-6">
                {/* Section heading */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    ANÁLISIS
                  </p>
                  <h2 className="text-xl font-bold text-foreground">Estadísticas del proceso</h2>
                  <div className="mt-2 h-0.5 w-8 bg-primary" />
                </div>

                {/* Estado filter pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Filtrar:
                  </span>
                  {[
                    { label: 'APTO/A', active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50' },
                    { label: 'NO APTO/A', active: 'bg-red-600 text-white border-red-600', inactive: 'bg-white text-red-700 border-red-300 hover:bg-red-50' },
                    { label: 'NO PRESENTADO/A', active: 'bg-amber-500 text-white border-amber-500', inactive: 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50' },
                  ].map(({ label, active, inactive }) => (
                    <button
                      key={label}
                      onClick={() => {
                        const next = filters.estado.includes(label)
                          ? filters.estado.filter((x) => x !== label)
                          : [...filters.estado, label]
                        setFilters((f) => ({ ...f, estado: next }))
                      }}
                      className={`rounded-sm border px-3 py-1 text-xs font-medium transition-all ${
                        filters.estado.includes(label) ? active : inactive
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  {filters.estado.length > 0 && (
                    <button
                      onClick={() => setFilters((f) => ({ ...f, estado: [] }))}
                      className="text-xs text-primary underline underline-offset-2"
                    >
                      Ver todos
                    </button>
                  )}
                </div>

                <ChartsPanel
                  data={
                    filters.estado.length > 0
                      ? (Array.isArray(data) ? data : []).filter((c) => filters.estado.includes(c.estado))
                      : (Array.isArray(data) ? data : [])
                  }
                />
              </div>
            )}

            {tab === 'aprobados' && (
              <div className="bg-card border border-border rounded-sm shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Visualización simplificada de <span className="font-bold text-emerald-600">aprobados</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {aptosData.length.toLocaleString('es-ES')} candidatos APTO/A
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                  <table className="w-full min-w-[820px] text-xs">
                    <thead className="sticky top-0 z-20 bg-card">
                      <tr className="border-b border-border shadow-[0_1px_0_0_theme(colors.border)]">
                        <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-right">Rank.</th>
                        <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-left">Identificador</th>
                        <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-left">Nombre y apellidos</th>
                        <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-right">Rank conocimientos</th>
                        <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-right">Rank inglés</th>
                        <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-right">Rank aptitudes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {aptosData.map((c, i) => (
                        <tr key={`${c.id}-${i}`} className="hover:bg-primary/5 transition-colors">
                          <td className="px-3 py-2.5 font-mono text-right font-semibold text-primary">{c.ranking ?? '—'}</td>
                          <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">{c.id}</td>
                          <td className="px-3 py-2.5 font-medium text-foreground min-w-[260px]">{c.nombre}</td>
                          <td className="px-3 py-2.5 font-mono text-right">{c.rankingConocimientos ?? '—'}</td>
                          <td className="px-3 py-2.5 font-mono text-right">{c.rankingIngles ?? '—'}</td>
                          <td className="px-3 py-2.5 font-mono text-right">{c.rankingAptitud ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer id="informacion" className="border-t border-border mt-16 py-6 px-6 bg-card scroll-mt-20">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Listado Provisional de Resultados — Fase 1. Solo consulta. Datos sujetos a modificación.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Datos cargados desde CSV</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
