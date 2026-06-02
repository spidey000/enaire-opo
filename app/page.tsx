'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Candidato, CandidatoFase2, CandidatoFase3 } from '@/lib/parseCSV'
import { StatsCards, type StatCardDef } from '@/components/StatsCards'
import { ChartsPanel } from '@/components/ChartsPanel'
import { ChartsPanelFase2 } from '@/components/ChartsPanelFase2'
import { ChartsPanelFase3a } from '@/components/ChartsPanelFase3a'
import { FilterSidebar, Filters, DEFAULT_FILTERS } from '@/components/FilterSidebar'
import { FilterSidebarFase2, DEFAULT_FILTERS_FASE2 } from '@/components/FilterSidebarFase2'
import { FilterSidebarFase3, DEFAULT_FILTERS_FASE3 } from '@/components/FilterSidebarFase3'
import { DataTable, DEFAULT_VISIBLE_COLUMNS, ColumnVisibility } from '@/components/DataTable'
import { DataTableFase2, FiltersFase2 } from '@/components/DataTableFase2'
import { DataTableFase3, FiltersFase3 } from '@/components/DataTableFase3'
import { FasePendiente } from '@/components/FasePendiente'
import { BarChart3, Table2, Loader2, FileSpreadsheet, CheckCircle2, XCircle, Users, MinusCircle } from 'lucide-react'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

type Tab = 'tabla' | 'graficas'

// Main phases in the top navigation
type Phase = 'fase1' | 'fase2' | 'fase3a' | 'fase3b' | 'fase3c'

const PHASE_NOTES: Record<string, { title: string; bullets: string[] }> = {
  fase2: {
    title: 'Fase 2 – Pruebas digitales (eliminatoria) — Listado Definitivo',
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
  fase3a: {
    title: 'Fase 3A – Evaluación oral de inglés',
    bullets: [
      'Entrevista para medir comprensión, expresión, fluidez y comunicación en inglés; exige al menos nivel C1 (MCER).',
      'Máximo 50 puntos y mínimo 25 para superar. Datos disponibles: listado provisional.',
      'Las pruebas B y C están pendientes de publicación.',
    ],
  },
  fase3b: {
    title: 'Fase 3B – Evaluación conductual',
    bullets: [
      'Evalúa la adecuación al perfil competencial del controlador/a según el marco estratégico de ENAIRE.',
      'Máximo 120 puntos y mínimo 60 para superar.',
      'Aún no se han publicado los resultados.',
    ],
  },
  fase3c: {
    title: 'Fase 3C – Evaluación clínica de la personalidad',
    bullets: [
      'Determina la aptitud psicológica con resultado Apto/No Apto.',
      'Aún no se han publicado los resultados.',
    ],
  },
}

// Group phases for main navigation
const MAIN_PHASES = ['fase1', 'fase2', 'fase3a'] as const
const FASE3_SUB_TABS = ['fase3a', 'fase3b', 'fase3c'] as const

const MAIN_PHASE_LABELS: Record<string, string> = {
  fase1: 'FASE 1',
  fase2: 'FASE 2',
  fase3a: 'FASE 3',
}

export default function Home() {
  const { data: fase1Data, error: fase1Error, isLoading: fase1Loading } = useSWR<Candidato[]>('/api/candidatos', fetcher)
  const { data: fase2Data, error: fase2Error, isLoading: fase2Loading } = useSWR<CandidatoFase2[]>('/api/candidatos/fase2', fetcher)
  const { data: fase3aData, error: fase3aError, isLoading: fase3aLoading } = useSWR<CandidatoFase3[]>('/api/candidatos/fase3a', fetcher)
  const { data: verifyFase2 } = useSWR('/api/verify/fase2', fetcher, { revalidateOnFocus: false })

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [fase2Filters, setFase2Filters] = useState<FiltersFase2>(DEFAULT_FILTERS_FASE2)
  const [fase3Filters, setFase3Filters] = useState<FiltersFase3>(DEFAULT_FILTERS_FASE3)
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(DEFAULT_VISIBLE_COLUMNS)
  const [tab, setTab] = useState<Tab>('tabla')
  const [phase, setPhase] = useState<Phase>('fase1')

  // Determine which main nav item is active
  const activeMainPhase: string = phase.startsWith('fase3') ? 'fase3a' : phase
  // Determine if we're inside Fase 3
  const isFase3 = phase.startsWith('fase3')

  const displayDataFase1 = Array.isArray(fase1Data) ? fase1Data : []
  const displayDataFase2 = Array.isArray(fase2Data) ? fase2Data : []
  const displayDataFase3a = Array.isArray(fase3aData) ? fase3aData : []

  const isPhaseWithData = phase === 'fase1' || phase === 'fase2' || phase === 'fase3a'

  // --- Fase 1 sorting ---
  const sortedPhaseData = useMemo(() => {
    if (!displayDataFase1 || !Array.isArray(displayDataFase1)) return []
    return [...displayDataFase1].sort((a, b) => {
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
  }, [displayDataFase1, filters.sortBy, filters.sortDir])

  // --- Fase 1 stats cards ---
  const fase1CardDefs: StatCardDef[] = useMemo(() => {
    const data = sortedPhaseData
    if (!data.length) return []
    const total = data.length
    const aptos = data.filter((c) => c.estado === 'APTO/A').length
    const noAptos = data.filter((c) => c.estado === 'NO APTO/A').length
    const noPresentados = data.filter((c) => c.estado === 'NO PRESENTADO/A').length
    const conPuntuacion = data.filter((c) => c.totalFase1 !== null)
    const media = conPuntuacion.length > 0
      ? conPuntuacion.reduce((a, c) => a + (c.totalFase1 ?? 0), 0) / conPuntuacion.length
      : 0
    return [
      { eyebrow: 'TOTAL', value: total.toLocaleString('es-ES'), label: 'candidatos', icon: Users, iconColor: 'text-primary', valueColor: 'text-foreground' },
      { eyebrow: 'RESULTADO', value: aptos.toLocaleString('es-ES'), label: 'APTO/A', sub: `${total > 0 ? ((aptos / total) * 100).toFixed(1) : 0}%`, icon: CheckCircle2, iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
      { eyebrow: 'RESULTADO', value: noAptos.toLocaleString('es-ES'), label: 'NO APTO/A', sub: `${total > 0 ? ((noAptos / total) * 100).toFixed(1) : 0}%`, icon: XCircle, iconColor: 'text-red-500', valueColor: 'text-red-700' },
      { eyebrow: 'RESULTADO', value: noPresentados.toLocaleString('es-ES'), label: 'No Presentados', sub: `${total > 0 ? ((noPresentados / total) * 100).toFixed(1) : 0}%`, icon: MinusCircle, iconColor: 'text-amber-500', valueColor: 'text-amber-700' },
    ]
  }, [sortedPhaseData])

  // --- Fase 2 sorting ---
  const sortedFase2Data = useMemo(() => {
    if (!displayDataFase2 || !Array.isArray(displayDataFase2)) return []
    return [...displayDataFase2].sort((a, b) => {
      const key = fase2Filters.sortBy as keyof CandidatoFase2
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
      return fase2Filters.sortDir === 'asc' ? cmp : -cmp
    })
  }, [displayDataFase2, fase2Filters.sortBy, fase2Filters.sortDir])

  // --- Fase 3a sorting ---
  const sortedFase3aData = useMemo(() => {
    if (!displayDataFase3a || !Array.isArray(displayDataFase3a)) return []
    return [...displayDataFase3a].sort((a, b) => {
      const key = fase3Filters.sortBy as keyof CandidatoFase3
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
      return fase3Filters.sortDir === 'asc' ? cmp : -cmp
    })
  }, [displayDataFase3a, fase3Filters.sortBy, fase3Filters.sortDir])

  const handleSortChange = (col: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: col,
      sortDir: prev.sortBy === col && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleSortChangeFase2 = (col: string) => {
    setFase2Filters((prev) => ({
      ...prev,
      sortBy: col,
      sortDir: prev.sortBy === col && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleSortChangeFase3 = (col: string) => {
    setFase3Filters((prev) => ({
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

  const handleResetFiltersFase2 = () => {
    setFase2Filters(DEFAULT_FILTERS_FASE2)
  }

  const handleResetFiltersFase3 = () => {
    setFase3Filters(DEFAULT_FILTERS_FASE3)
  }

  // --- Fase 2 stats cards ---
  const fase2CardDefs: StatCardDef[] = useMemo(() => {
    if (!displayDataFase2.length) return []
    const total = displayDataFase2.length
    const aptos = displayDataFase2.filter((c) => c.estado === 'APTO/A').length
    const noAptos = displayDataFase2.filter((c) => c.estado === 'NO APTO/A').length
    const conPuntuacion = displayDataFase2.filter((c) => c.puntuacion !== null)
    const media = conPuntuacion.length > 0
      ? conPuntuacion.reduce((a, c) => a + (c.puntuacion ?? 0), 0) / conPuntuacion.length
      : 0
    return [
      { eyebrow: 'TOTAL', value: total.toLocaleString('es-ES'), label: 'candidatos', icon: Users, iconColor: 'text-primary', valueColor: 'text-foreground' },
      { eyebrow: 'RESULTADO', value: aptos.toLocaleString('es-ES'), label: 'APTO/A', sub: `${total > 0 ? ((aptos / total) * 100).toFixed(1) : 0}%`, icon: CheckCircle2, iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
      { eyebrow: 'RESULTADO', value: noAptos.toLocaleString('es-ES'), label: 'NO APTO', sub: `${total > 0 ? ((noAptos / total) * 100).toFixed(1) : 0}%`, icon: XCircle, iconColor: 'text-red-500', valueColor: 'text-red-700' },
      { eyebrow: 'MEDIA', value: media.toFixed(2), label: 'puntuación media', icon: BarChart3, iconColor: 'text-primary', valueColor: 'text-foreground' },
    ]
  }, [displayDataFase2])

  // --- Fase 3a stats cards ---
  const fase3aCardDefs: StatCardDef[] = useMemo(() => {
    if (!displayDataFase3a.length) return []
    const total = displayDataFase3a.length
    const aptos = displayDataFase3a.filter((c) => c.resultado3a === 'APTO/A').length
    const noAptos = displayDataFase3a.filter((c) => c.resultado3a === 'NO APTO/A' || c.resultado3a === 'NO PRESENTADO/A').length
    const conPuntuacion = displayDataFase3a.filter((c) => c.puntuacion3a !== null)
    const media = conPuntuacion.length > 0
      ? conPuntuacion.reduce((a, c) => a + (c.puntuacion3a ?? 0), 0) / conPuntuacion.length
      : 0
    return [
      { eyebrow: 'TOTAL', value: total.toLocaleString('es-ES'), label: 'candidatos', icon: Users, iconColor: 'text-primary', valueColor: 'text-foreground' },
      { eyebrow: 'RESULTADO', value: aptos.toLocaleString('es-ES'), label: 'APTO/A', sub: `${total > 0 ? ((aptos / total) * 100).toFixed(1) : 0}%`, icon: CheckCircle2, iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
      { eyebrow: 'RESULTADO', value: noAptos.toLocaleString('es-ES'), label: 'NO APTO / NP', sub: `${total > 0 ? ((noAptos / total) * 100).toFixed(1) : 0}%`, icon: XCircle, iconColor: 'text-red-500', valueColor: 'text-red-700' },
      { eyebrow: 'MEDIA', value: media.toFixed(2), label: 'puntuación media', icon: BarChart3, iconColor: 'text-primary', valueColor: 'text-foreground' },
    ]
  }, [displayDataFase3a])

  const recordCount = phase === 'fase1' ? displayDataFase1.length : phase === 'fase2' ? displayDataFase2.length : displayDataFase3a.length

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="bg-primary sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-0 flex items-stretch gap-8">
          <div className="flex items-center gap-2.5 py-3 pr-8 border-r border-white/20">
            <FileSpreadsheet className="h-5 w-5 text-white shrink-0" />
            <span className="text-white font-bold text-sm tracking-wide uppercase leading-none">ENAIRE</span>
          </div>

          <nav className="hidden md:flex items-stretch gap-0">
            {MAIN_PHASES.map((phaseId) => (
              <button
                key={phaseId}
                onClick={() => setPhase(phaseId)}
                className={`flex items-center px-4 py-3 text-sm cursor-pointer transition-colors border-b-2 ${
                  activeMainPhase === phaseId
                    ? 'text-white bg-white/10 border-white/90'
                    : 'text-white/90 hover:text-white hover:bg-white/10 border-transparent'
                }`}
              >
                {MAIN_PHASE_LABELS[phaseId]}
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
            <span className="text-xs text-white/80 font-medium">{recordCount.toLocaleString('es-ES')} registros</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-10 space-y-10">
        {(fase1Loading || fase2Loading || (isFase3 && fase3aLoading)) && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando datos...</p>
          </div>
        )}

        {fase1Error && phase === 'fase1' && (
          <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            No se pudieron cargar los datos desde public/data/resultados-fase1.csv.
          </div>
        )}

        {fase2Error && phase === 'fase2' && (
          <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            No se pudieron cargar los datos de Fase 2.
          </div>
        )}

        {fase3aError && isFase3 && (
          <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            No se pudieron cargar los datos de Fase 3A.
          </div>
        )}

        {/* Fase 3 sub-tabs */}
        {isFase3 && !fase3aLoading && (
          <div className="flex items-center gap-1 border-b border-border pb-0">
            {FASE3_SUB_TABS.map((sub) => (
              <button
                key={sub}
                onClick={() => setPhase(sub)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                  phase === sub
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                {sub === 'fase3a' ? '3A — Inglés' : sub === 'fase3b' ? '3B — Conductual' : '3C — Clínica'}
              </button>
            ))}
          </div>
        )}

        {!fase1Loading && !(phase === 'fase2' && fase2Loading) && !(isFase3 && fase3aLoading) && (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">RESULTADOS</p>
              <h1 className="text-3xl font-bold text-foreground text-balance leading-tight">
                {phase === 'fase2' ? 'Listado Definitivo Fase 2' : `Listado Provisional ${phase === 'fase1' ? 'Fase 1' : isFase3 ? `Fase 3${phase.replace('fase3', ' - ')}` : ''}`}
              </h1>
              <div className="mt-2 h-0.5 w-10 bg-primary" />
            </div>

            {/* Phase with no data yet: show info + pending banner */}
            {!isPhaseWithData && (
              <div className="space-y-4">
                {phase === 'fase3b' && (
                  <FasePendiente
                    title="Fase 3B — Pendiente de publicación"
                    description="Los resultados de la evaluación conductual (Fase 3B) aún no han sido publicados por ENAIRE. Esta sección se habilitará automáticamente cuando los datos estén disponibles."
                  />
                )}
                {phase === 'fase3c' && (
                  <FasePendiente
                    title="Fase 3C — Pendiente de publicación"
                    description="Los resultados de la evaluación clínica de la personalidad (Fase 3C) aún no han sido publicados por ENAIRE. Esta sección se habilitará automáticamente cuando los datos estén disponibles."
                  />
                )}
                <section className="rounded-lg border border-border bg-card p-5">
                  <h2 className="text-base font-semibold mb-3">{PHASE_NOTES[phase]?.title ?? ''}</h2>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {(PHASE_NOTES[phase]?.bullets ?? []).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </section>
              </div>
            )}

            {/* Fase 1 stats and content */}
            {phase === 'fase1' && (
              <>
                <StatsCards cards={fase1CardDefs} />
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
                          ? sortedPhaseData.filter((c) => filters.estado.includes(c.estado))
                          : sortedPhaseData
                      }
                    />
                  </div>
                )}
              </>
            )}

            {/* Fase 2 content */}
            {phase === 'fase2' && (
              <>
                <StatsCards cards={fase2CardDefs} />

                {/* Verification badge */}
                {verifyFase2?.status === 'verified' && (
                  <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
                    <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Datos verificados</span>
                    <span className="text-emerald-600">{verifyFase2.integrity_check.matched}/{verifyFase2.integrity_check.total_rows} filas cotejadas contra el PDF original</span>
                    <span className="ml-auto text-[10px] text-emerald-500 font-mono">SHA-256: {verifyFase2.csv_hash.slice(0, 12)}…</span>
                  </div>
                )}

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
                  <div>
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      <div className="w-full lg:w-60 shrink-0">
                        <FilterSidebarFase2
                          filters={fase2Filters}
                          onChange={setFase2Filters}
                          onReset={handleResetFiltersFase2}
                        />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <DataTableFase2
                          data={sortedFase2Data}
                          filters={fase2Filters}
                          onSortChange={handleSortChangeFase2}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'graficas' && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">ANÁLISIS</p>
                      <h2 className="text-xl font-bold text-foreground">Estadísticas Fase 2 — Pruebas digitales</h2>
                      <div className="mt-2 h-0.5 w-8 bg-primary" />
                    </div>

                    {/* Filter buttons for Fase 2 charts */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtrar:</span>
                      {[
                        { label: 'APTO/A', active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50' },
                        { label: 'NO APTO/A', active: 'bg-red-600 text-white border-red-600', inactive: 'bg-white text-red-700 border-red-300 hover:bg-red-50' },
                        { label: 'NO PRESENTADO/A', active: 'bg-amber-500 text-white border-amber-500', inactive: 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50' },
                        { label: 'EXCLUIDO/A (1)', active: 'bg-gray-600 text-white border-gray-600', inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' },
                        { label: 'RENUNCIA', active: 'bg-purple-600 text-white border-purple-600', inactive: 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50' },
                      ].map(({ label, active, inactive }) => (
                        <button
                          key={label}
                          onClick={() => {
                            const next = fase2Filters.estado.includes(label)
                              ? fase2Filters.estado.filter((x) => x !== label)
                              : [...fase2Filters.estado, label]
                            setFase2Filters((f) => ({ ...f, estado: next }))
                          }}
                          className={`rounded-sm border px-3 py-1 text-xs font-medium transition-all ${
                            fase2Filters.estado.includes(label) ? active : inactive
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      {fase2Filters.estado.length > 0 && (
                        <button
                          onClick={() => setFase2Filters((f) => ({ ...f, estado: [] }))}
                          className="text-xs text-primary underline underline-offset-2"
                        >
                          Ver todos
                        </button>
                      )}
                    </div>

                    <ChartsPanelFase2
                      data={
                        fase2Filters.estado.length > 0
                          ? displayDataFase2.filter((c) => fase2Filters.estado.includes(c.estado))
                          : displayDataFase2
                      }
                    />
                  </div>
                )}
              </>
            )}

            {/* Fase 3a content */}
            {phase === 'fase3a' && (
              <>
                <StatsCards cards={fase3aCardDefs} />

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
                  <div>
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      <div className="w-full lg:w-60 shrink-0">
                        {/* Fase 3a filter sidebar */}
                        <FilterSidebarFase3
                          filters={fase3Filters}
                          onChange={setFase3Filters}
                          onReset={handleResetFiltersFase3}
                        />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <DataTableFase3
                          data={sortedFase3aData}
                          filters={fase3Filters}
                          onSortChange={handleSortChangeFase3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'graficas' && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">ANÁLISIS</p>
                      <h2 className="text-xl font-bold text-foreground">Estadísticas Fase 3A — Inglés</h2>
                      <div className="mt-2 h-0.5 w-8 bg-primary" />
                    </div>

                    {/* Filter buttons for Fase 3A charts */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtrar:</span>
                      {[
                        { label: 'APTO/A', active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50' },
                        { label: 'NO APTO/A', active: 'bg-red-600 text-white border-red-600', inactive: 'bg-white text-red-700 border-red-300 hover:bg-red-50' },
                        { label: 'NO PRESENTADO/A', active: 'bg-amber-500 text-white border-amber-500', inactive: 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50' },
                        { label: 'EXCLUIDO/A (1)', active: 'bg-gray-600 text-white border-gray-600', inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' },
                        { label: 'EXCLUIDO/A (2)', active: 'bg-gray-600 text-white border-gray-600', inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' },
                        { label: 'RENUNCIA', active: 'bg-purple-600 text-white border-purple-600', inactive: 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50' },
                      ].map(({ label, active, inactive }) => (
                        <button
                          key={label}
                          onClick={() => {
                            const next = fase3Filters.resultado.includes(label)
                              ? fase3Filters.resultado.filter((x) => x !== label)
                              : [...fase3Filters.resultado, label]
                            setFase3Filters((f) => ({ ...f, resultado: next }))
                          }}
                          className={`rounded-sm border px-3 py-1 text-xs font-medium transition-all ${
                            fase3Filters.resultado.includes(label) ? active : inactive
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      {fase3Filters.resultado.length > 0 && (
                        <button
                          onClick={() => setFase3Filters((f) => ({ ...f, resultado: [] }))}
                          className="text-xs text-primary underline underline-offset-2"
                        >
                          Ver todos
                        </button>
                      )}
                    </div>

                    <ChartsPanelFase3a
                      data={
                        fase3Filters.resultado.length > 0
                          ? displayDataFase3a.filter((c) => {
                              const r = c.resultado3a ?? ''
                              return fase3Filters.resultado.includes(r)
                            })
                          : displayDataFase3a
                      }
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer id="informacion" className="border-t border-border mt-16 py-6 px-6 bg-card scroll-mt-20">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Resultados — Fase 1 (Provisional) / Fase 2 (Definitivo) / Fase 3A (Provisional). Solo consulta. Datos sujetos a modificación.</p>
          <div className="flex items-center gap-1.5">
            {phase === 'fase2' && verifyFase2?.status === 'verified' ? (
              <>
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">
                  Fase 2 verificada — {verifyFase2.integrity_check.matched} filas cotejadas
                </span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs text-muted-foreground">Datos cargados desde CSV</span>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
