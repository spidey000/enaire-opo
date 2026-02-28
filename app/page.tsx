'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Candidato } from '@/lib/parseCSV'
import { StatsCards } from '@/components/StatsCards'
import { ChartsPanel } from '@/components/ChartsPanel'
import { FilterSidebar, Filters, DEFAULT_FILTERS } from '@/components/FilterSidebar'
import { DataTable, DEFAULT_VISIBLE_COLUMNS, ColumnVisibility } from '@/components/DataTable'
import { BarChart3, Table2, Loader2, FileSpreadsheet } from 'lucide-react'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

type Tab = 'tabla' | 'graficas'
type Phase = 'fase1' | 'fase2' | 'fase3'

const PHASE_NOTES: Record<Exclude<Phase, 'fase1'>, { title: string; bullets: string[] }> = {
  fase2: {
    title: 'Fase 2 – Pruebas digitales (eliminatoria)',
    bullets: [
      'Incluye dos pruebas obligatorias: FEAST (First European Air Traffic Controller Selection Test) y PDEA (Prueba Digital en Entorno ATC).',
      'Las pruebas se realizan en la misma jornada, en español y/o inglés, y en soporte informático.',
      'Antes de comenzar, la persona aspirante debe aceptar electrónicamente la confidencialidad de las pruebas.',
      'La puntuación máxima de la fase es de 100 puntos; además de superar todos los test, se exige al menos 50 puntos totales para superar la fase.',
      'Solo se admiten reclamaciones sobre incidencias técnicas comunicadas durante la realización de las pruebas digitales.',
      'El listado provisional incluirá Aptos/No Aptos y puntuaciones provisionales de quienes resulten Aptos.',
      'El plazo de alegaciones es de 3 días hábiles desde las 00:00 del día siguiente a la publicación; tras resolverlas, se publicarán resultados definitivos.',
      'El ranking para pasar a Fase 3 se calcula con la suma de Fases 1 y 2, tomando como corte la puntuación total de la persona candidata número 596.',
    ],
  },
  fase3: {
    title: 'Fase 3 – Evaluación oral de inglés, conductual y clínica de personalidad',
    bullets: [
      'Consta de tres pruebas eliminatorias en la misma jornada: A) evaluación oral de inglés, B) evaluación conductual y adaptación al entorno profesional, C) evaluación clínica de la personalidad.',
      'Prueba A (inglés): entrevista para medir comprensión, expresión, fluidez y comunicación; exige al menos nivel C1 (MCER). Máximo 50 puntos y mínimo 25 para superar.',
      'Prueba B (conductual): evalúa adecuación al perfil competencial del controlador/a según marco estratégico de ENAIRE. Máximo 120 puntos y mínimo 60.',
      'Prueba C (clínica): determina aptitud psicológica con resultado Apto/No Apto.',
      'Tras definitivos de la prueba A, se publican los resultados provisionales de B y C para quienes hayan superado la prueba A.',
    ],
  },
}

export default function Home() {
  const { data, error, isLoading } = useSWR<Candidato[]>('/api/candidatos', fetcher)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(DEFAULT_VISIBLE_COLUMNS)
  const [tab, setTab] = useState<Tab>('tabla')
  const [phase, setPhase] = useState<Phase>('fase1')

  const phaseLabels: Record<Phase, string> = {
    fase1: 'FASE 1',
    fase2: 'FASE 2',
    fase3: 'FASE 3',
  }

  const displayData = Array.isArray(data) ? data : []
  const isPhaseWithData = phase === 'fase1'
  const phaseData = isPhaseWithData ? displayData : []

  const sortedPhaseData = useMemo(() => {
    if (!phaseData || !Array.isArray(phaseData)) return []
    return [...phaseData].sort((a, b) => {
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
  }, [phaseData, filters.sortBy, filters.sortDir])

  const handleSortChange = (col: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: col,
      sortDir: prev.sortBy === col && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleToggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      const hasAnyVisible = Object.values(next).some(Boolean)
      return hasAnyVisible ? next : prev
    })
  }

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="bg-primary sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-0 flex items-stretch gap-8">
          <div className="flex items-center gap-2.5 py-3 pr-8 border-r border-white/20">
            <FileSpreadsheet className="h-5 w-5 text-white shrink-0" />
            <span className="text-white font-bold text-sm tracking-wide uppercase leading-none">ENAIRE</span>
          </div>

          <nav className="hidden md:flex items-stretch gap-0">
            {(Object.keys(phaseLabels) as Phase[]).map((phaseId) => (
              <button
                key={phaseId}
                onClick={() => setPhase(phaseId)}
                className={`flex items-center px-4 py-3 text-sm cursor-pointer transition-colors border-b-2 ${
                  phase === phaseId
                    ? 'text-white bg-white/10 border-white/90'
                    : 'text-white/90 hover:text-white hover:bg-white/10 border-transparent'
                }`}
              >
                {phaseLabels[phaseId]}
              </button>
            ))}
            <a
              href="#informacion"
              className="flex items-center px-4 py-3 text-sm text-white/90 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border-b-2 border-transparent"
            >
              Información
            </a>
          </nav>

          <div className="ml-auto flex items-center">
            <span className="text-xs text-white/80 font-medium">{phaseData.length.toLocaleString('es-ES')} registros</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-10 space-y-10">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando datos del listado provisional...</p>
          </div>
        )}

        {error && (
          <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            No se pudieron cargar los datos desde public/data/resultados-fase1.csv.
          </div>
        )}

        {!isLoading && (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">RESULTADOS</p>
              <h1 className="text-3xl font-bold text-foreground text-balance leading-tight">Listado Provisional {phaseLabels[phase]}</h1>
              <div className="mt-2 h-0.5 w-10 bg-primary" />
            </div>

            {!isPhaseWithData && (
              <div className="space-y-4">
                <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                  No hay datos disponibles todavía para {phaseLabels[phase]}.
                </div>
                <section className="rounded-lg border border-border bg-card p-5">
                  <h2 className="text-base font-semibold mb-3">{PHASE_NOTES[phase].title}</h2>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {PHASE_NOTES[phase].bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </section>
              </div>
            )}

            <StatsCards data={phaseData} />

            <div className="border-b border-border">
              <div className="flex items-stretch gap-0">
                {[
                  { id: 'tabla' as Tab, label: 'Tabla de Datos', icon: Table2 },
                  { id: 'graficas' as Tab, label: 'Estadísticas y Gráficas', icon: BarChart3 },
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

            {tab === 'tabla' && (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-60 shrink-0">
                  <FilterSidebar
                    filters={filters}
                    onChange={setFilters}
                    onReset={handleResetFilters}
                    visibleColumns={visibleColumns}
                    onToggleColumn={handleToggleColumn}
                  />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <DataTable
                    data={sortedPhaseData}
                    filters={filters}
                    onSortChange={handleSortChange}
                    visibleColumns={visibleColumns}
                  />
                </div>
              </div>
            )}

            {tab === 'graficas' && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">ANÁLISIS</p>
                  <h2 className="text-xl font-bold text-foreground">Estadísticas del proceso</h2>
                  <div className="mt-2 h-0.5 w-8 bg-primary" />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtrar:</span>
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
                      ? phaseData.filter((c) => filters.estado.includes(c.estado))
                      : phaseData
                  }
                />
              </div>
            )}
          </>
        )}
      </main>

      <footer id="informacion" className="border-t border-border mt-16 py-6 px-6 bg-card scroll-mt-20">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Listado Provisional de Resultados — Fase 1. Solo consulta. Datos sujetos a modificación.</p>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Datos cargados desde CSV</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
