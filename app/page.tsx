'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Candidato, CandidatoFase2, CandidatoFase3 } from '@/lib/parseCSV'
import { StatsCards } from '@/components/StatsCards'
import { ChartsPanel } from '@/components/ChartsPanel'
import { FilterSidebar, Filters, DEFAULT_FILTERS } from '@/components/FilterSidebar'
import { DataTable, DEFAULT_VISIBLE_COLUMNS, ColumnVisibility } from '@/components/DataTable'
import { DataTableFase2, FiltersFase2 } from '@/components/DataTableFase2'
import { DataTableFase3, FiltersFase3 } from '@/components/DataTableFase3'
import { FasePendiente } from '@/components/FasePendiente'
import { BarChart3, Table2, Loader2, FileSpreadsheet, CheckCircle2, XCircle, Users } from 'lucide-react'

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

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [fase2Filters, setFase2Filters] = useState<FiltersFase2>({
    search: '',
    estado: [],
    scoreMin: 0,
    scoreMax: 100,
    sortBy: 'nombre',
    sortDir: 'asc',
  })
  const [fase3Filters, setFase3Filters] = useState<FiltersFase3>({
    search: '',
    resultado: [],
    scoreMin: 0,
    scoreMax: 50,
    sortBy: 'nombre',
    sortDir: 'asc',
  })
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

  // --- Fase 1 sorting (unchanged) ---
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

  // --- Fase 2 inline stats ---
  const fase2Stats = useMemo(() => {
    const data = displayDataFase2
    if (!data.length) return null
    const total = data.length
    const aptos = data.filter((c) => c.estado === 'APTO/A').length
    const noAptos = data.filter((c) => c.estado === 'NO APTO/A').length
    const noPresentados = data.filter((c) => c.estado === 'NO PRESENTADO/A').length
    const excluidos = data.filter((c) => c.estado.startsWith('EXCLUIDO')).length
    const renuncias = data.filter((c) => c.estado === 'RENUNCIA').length
    const conPuntuacion = data.filter((c) => c.puntuacion !== null)
    const media = conPuntuacion.length > 0
      ? conPuntuacion.reduce((a, c) => a + (c.puntuacion ?? 0), 0) / conPuntuacion.length
      : 0
    return { total, aptos, noAptos, noPresentados, excluidos, renuncias, media }
  }, [displayDataFase2])

  const fase2Distribucion = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of displayDataFase2) {
      counts[c.estado] = (counts[c.estado] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [displayDataFase2])

  const fase2Histograma = useMemo(() => {
    const buckets: Record<string, number> = {}
    const step = 5
    for (const c of displayDataFase2) {
      if (c.puntuacion === null) continue
      const bucket = Math.floor(c.puntuacion / step) * step
      const label = `${bucket}`
      buckets[label] = (buckets[label] ?? 0) + 1
    }
    return Object.entries(buckets)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([name, count]) => ({ name, count }))
  }, [displayDataFase2])

  const renderFase2Stats = () => {
    if (!fase2Stats) return null
    const s = fase2Stats
    const cards = [
      { eyebrow: 'TOTAL', value: s.total.toLocaleString('es-ES'), label: 'candidatos', icon: Users, iconColor: 'text-primary', valueColor: 'text-foreground' },
      { eyebrow: 'RESULTADO', value: s.aptos.toLocaleString('es-ES'), label: 'APTO/A', sub: `${s.total > 0 ? ((s.aptos / s.total) * 100).toFixed(1) : 0}%`, icon: CheckCircle2, iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
      { eyebrow: 'RESULTADO', value: s.noAptos.toLocaleString('es-ES'), label: 'NO APTO', sub: `${s.total > 0 ? ((s.noAptos / s.total) * 100).toFixed(1) : 0}%`, icon: XCircle, iconColor: 'text-red-500', valueColor: 'text-red-700' },
      { eyebrow: 'MEDIA', value: s.media.toFixed(2), label: 'puntuación media', icon: BarChart3, iconColor: 'text-primary', valueColor: 'text-foreground' },
    ]
    return (
      <div className="grid grid-cols-2 gap-0 lg:grid-cols-4 border border-border rounded-sm overflow-hidden bg-card shadow-sm">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`flex flex-col gap-3 p-6 lg:p-8 ${idx < 2 ? 'border-b lg:border-b-0 lg:border-r border-border' : ''} ${idx === 1 ? 'lg:border-r border-border' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card.eyebrow}</span>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div>
                <span className={`text-4xl font-bold leading-none ${card.valueColor}`}>{card.value}</span>
                {card.sub && <span className="ml-2 text-sm font-medium text-muted-foreground">{card.sub}</span>}
              </div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          )
        })}
      </div>
    )
  }

  // --- Fase 3a inline stats ---
  const fase3aStats = useMemo(() => {
    const data = displayDataFase3a
    if (!data.length) return null
    const total = data.length
    const aptos = data.filter((c) => c.resultado3a === 'APTO/A').length
    const noAptos = data.filter((c) => c.resultado3a === 'NO APTO/A' || c.resultado3a === 'NO PRESENTADO/A').length
    const excluidos = data.filter((c) => c.resultado3a && c.resultado3a.startsWith('EXCLUIDO')).length
    const renuncias = data.filter((c) => c.resultado3a && c.resultado3a.startsWith('RENUNCIA')).length
    const conPuntuacion = data.filter((c) => c.puntuacion3a !== null)
    const media = conPuntuacion.length > 0
      ? conPuntuacion.reduce((a, c) => a + (c.puntuacion3a ?? 0), 0) / conPuntuacion.length
      : 0
    return { total, aptos, noAptos, excluidos, renuncias, media }
  }, [displayDataFase3a])

  // --- Fase 3a inline charts ---
  const fase3aDistribucion = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of displayDataFase3a) {
      const r = c.resultado3a ?? 'SIN DATO'
      counts[r] = (counts[r] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [displayDataFase3a])

  const fase3aHistograma = useMemo(() => {
    const buckets: Record<string, number> = {}
    const step = 5
    for (const c of displayDataFase3a) {
      if (c.puntuacion3a === null) continue
      const bucket = Math.floor(c.puntuacion3a / step) * step
      const label = `${bucket}`
      buckets[label] = (buckets[label] ?? 0) + 1
    }
    return Object.entries(buckets)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([name, count]) => ({ name, count }))
  }, [displayDataFase3a])

  const renderFase3aStats = () => {
    if (!fase3aStats) return null
    const s = fase3aStats
    const cards = [
      { eyebrow: 'TOTAL', value: s.total.toLocaleString('es-ES'), label: 'candidatos', icon: Users, iconColor: 'text-primary', valueColor: 'text-foreground' },
      { eyebrow: 'RESULTADO', value: s.aptos.toLocaleString('es-ES'), label: 'APTO/A', sub: `${s.total > 0 ? ((s.aptos / s.total) * 100).toFixed(1) : 0}%`, icon: CheckCircle2, iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
      { eyebrow: 'RESULTADO', value: s.noAptos.toLocaleString('es-ES'), label: 'NO APTO / NP', sub: `${s.total > 0 ? ((s.noAptos / s.total) * 100).toFixed(1) : 0}%`, icon: XCircle, iconColor: 'text-red-500', valueColor: 'text-red-700' },
      { eyebrow: 'MEDIA', value: s.media.toFixed(2), label: 'puntuación media', icon: BarChart3, iconColor: 'text-primary', valueColor: 'text-foreground' },
    ]

    return (
      <div className="grid grid-cols-2 gap-0 lg:grid-cols-4 border border-border rounded-sm overflow-hidden bg-card shadow-sm">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`flex flex-col gap-3 p-6 lg:p-8 ${idx < 2 ? 'border-b lg:border-b-0 lg:border-r border-border' : ''} ${idx === 1 ? 'lg:border-r border-border' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card.eyebrow}</span>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div>
                <span className={`text-4xl font-bold leading-none ${card.valueColor}`}>{card.value}</span>
                {card.sub && <span className="ml-2 text-sm font-medium text-muted-foreground">{card.sub}</span>}
              </div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          )
        })}
      </div>
    )
  }

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
                <StatsCards data={sortedPhaseData} />
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
                {renderFase2Stats()}

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
                        <aside className="flex flex-col gap-5 bg-card border border-border rounded-sm p-5 h-fit sticky top-[57px] shadow-sm">
                          <div className="flex items-center justify-between border-b border-border pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Filtros</span>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Buscar candidato</label>
                            <input
                              placeholder="Nombre o identificador..."
                              value={fase2Filters.search}
                              onChange={(e) => setFase2Filters((f) => ({ ...f, search: e.target.value }))}
                              className="w-full h-8 rounded-sm border border-border bg-background px-2.5 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Puntuación Fase 2</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={fase2Filters.scoreMin}
                                onChange={(e) => setFase2Filters((f) => ({ ...f, scoreMin: Number(e.target.value) }))}
                                className="w-full rounded-sm border border-border bg-background px-2 py-1 text-xs"
                              />
                              <span className="text-xs text-muted-foreground self-center">—</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={fase2Filters.scoreMax}
                                onChange={(e) => setFase2Filters((f) => ({ ...f, scoreMax: Number(e.target.value) }))}
                                className="w-full rounded-sm border border-border bg-background px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ordenar por</label>
                            <select
                              value={fase2Filters.sortBy}
                              onChange={(e) => setFase2Filters((f) => ({ ...f, sortBy: e.target.value }))}
                              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs"
                            >
                              <option value="nombre">Nombre</option>
                              <option value="puntuacion">Puntuación Fase 2</option>
                              <option value="id">Identificador</option>
                            </select>
                            <div className="flex gap-1.5">
                              {(['asc', 'desc'] as const).map((dir) => (
                                <button
                                  key={dir}
                                  onClick={() => setFase2Filters((f) => ({ ...f, sortDir: dir }))}
                                  className={`flex-1 rounded-sm border py-1.5 text-xs font-medium transition-all ${
                                    fase2Filters.sortDir === dir
                                      ? 'bg-primary text-white border-primary'
                                      : 'bg-background text-muted-foreground border-border'
                                  }`}
                                >
                                  {dir === 'asc' ? 'Ascendente' : 'Descendente'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </aside>
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

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-foreground mb-1">Distribución por Resultado</h3>
                        <p className="text-xs text-muted-foreground mb-4">Resultado definitivo Fase 2</p>
                        <div className="h-64 flex items-center justify-center">
                          <div className="space-y-3 w-full max-w-xs">
                            {fase2Distribucion.map(({ name, value }) => {
                              const total = displayDataFase2.length
                              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                              return (
                                <div key={name} className="flex items-center gap-3">
                                  <span className="text-xs font-medium w-32 text-right truncate">{name}</span>
                                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-mono text-muted-foreground w-16 text-right">{value} ({pct}%)</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-foreground mb-1">Distribución de Puntuación</h3>
                        <p className="text-xs text-muted-foreground mb-4">Candidatos aptos con puntuación registrada</p>
                        <div className="h-64 flex items-end gap-1">
                          {fase2Histograma.map(({ name, count }) => {
                            const maxCount = Math.max(...fase2Histograma.map(h => h.count), 1)
                            const height = (count / maxCount) * 100
                            return (
                              <div key={name} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground font-mono">{count}</span>
                                <div className="w-full bg-primary/10 rounded-t" style={{ height: `${Math.max(height, 2)}%` }}>
                                  <div className="w-full h-full bg-primary rounded-t" style={{ opacity: 0.3 + (height / 100) * 0.7 }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">{name}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-sm p-4 shadow-sm overflow-x-auto">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Estadísticas comunes</h4>
                      <table className="w-full min-w-[420px] text-xs">
                        <tbody className="divide-y divide-border/60">
                          <tr><td className="py-2 pr-3 text-muted-foreground">Total candidatos</td><td className="py-2 text-right font-mono font-semibold text-foreground">{displayDataFase2.length.toLocaleString('es-ES')}</td></tr>
                          <tr><td className="py-2 pr-3 text-muted-foreground">APTO/A</td><td className="py-2 text-right font-mono font-semibold text-emerald-700">{fase2Stats?.aptos.toLocaleString('es-ES') ?? 0}</td></tr>
                          <tr><td className="py-2 pr-3 text-muted-foreground">NO APTO/A</td><td className="py-2 text-right font-mono font-semibold text-red-700">{fase2Stats?.noAptos.toLocaleString('es-ES') ?? 0}</td></tr>
                          <tr><td className="py-2 pr-3 text-muted-foreground">NO PRESENTADO/A</td><td className="py-2 text-right font-mono font-semibold text-amber-700">{fase2Stats?.noPresentados.toLocaleString('es-ES') ?? 0}</td></tr>
                          <tr><td className="py-2 pr-3 text-muted-foreground">Excluidos / Renuncias</td><td className="py-2 text-right font-mono font-semibold text-muted-foreground">{(fase2Stats?.excluidos ?? 0) + (fase2Stats?.renuncias ?? 0)}</td></tr>
                          <tr><td className="py-2 pr-3 text-muted-foreground">Puntuación media (aptos)</td><td className="py-2 text-right font-mono font-semibold text-foreground">{fase2Stats?.media.toFixed(2) ?? '—'}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Fase 3a content */}
            {phase === 'fase3a' && (
              <>
                {renderFase3aStats()}

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
                        <aside className="flex flex-col gap-5 bg-card border border-border rounded-sm p-5 h-fit sticky top-[57px] shadow-sm">
                          <div className="flex items-center justify-between border-b border-border pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Filtros</span>
                          </div>

                          {/* Search */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Buscar candidato</label>
                            <input
                              placeholder="Nombre o identificador..."
                              value={fase3Filters.search}
                              onChange={(e) => setFase3Filters((f) => ({ ...f, search: e.target.value }))}
                              className="w-full h-8 rounded-sm border border-border bg-background px-2.5 text-sm"
                            />
                          </div>

                          {/* Score range */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Puntuación 3A</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min={0}
                                max={50}
                                value={fase3Filters.scoreMin}
                                onChange={(e) => setFase3Filters((f) => ({ ...f, scoreMin: Number(e.target.value) }))}
                                className="w-full rounded-sm border border-border bg-background px-2 py-1 text-xs"
                              />
                              <span className="text-xs text-muted-foreground self-center">—</span>
                              <input
                                type="number"
                                min={0}
                                max={50}
                                value={fase3Filters.scoreMax}
                                onChange={(e) => setFase3Filters((f) => ({ ...f, scoreMax: Number(e.target.value) }))}
                                className="w-full rounded-sm border border-border bg-background px-2 py-1 text-xs"
                              />
                            </div>
                          </div>

                          {/* Sort */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ordenar por</label>
                            <select
                              value={fase3Filters.sortBy}
                              onChange={(e) => setFase3Filters((f) => ({ ...f, sortBy: e.target.value }))}
                              className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs"
                            >
                              <option value="nombre">Nombre</option>
                              <option value="puntuacion3a">Puntuación 3A</option>
                              <option value="id">Identificador</option>
                            </select>
                            <div className="flex gap-1.5">
                              {(['asc', 'desc'] as const).map((dir) => (
                                <button
                                  key={dir}
                                  onClick={() => setFase3Filters((f) => ({ ...f, sortDir: dir }))}
                                  className={`flex-1 rounded-sm border py-1.5 text-xs font-medium transition-all ${
                                    fase3Filters.sortDir === dir
                                      ? 'bg-primary text-white border-primary'
                                      : 'bg-background text-muted-foreground border-border'
                                  }`}
                                >
                                  {dir === 'asc' ? 'Ascendente' : 'Descendente'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </aside>
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

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      {/* Pie chart */}
                      <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-foreground mb-1">Distribución por Resultado</h3>
                        <p className="text-xs text-muted-foreground mb-4">Resultado provisional Fase 3A</p>
                        <div className="h-64 flex items-center justify-center">
                          <div className="space-y-3 w-full max-w-xs">
                            {fase3aDistribucion.map(({ name, value }) => {
                              const total = displayDataFase3a.length
                              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                              return (
                                <div key={name} className="flex items-center gap-3">
                                  <span className="text-xs font-medium w-32 text-right truncate">{name}</span>
                                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-mono text-muted-foreground w-16 text-right">{value} ({pct}%)</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Histogram */}
                      <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-foreground mb-1">Distribución de Puntuación</h3>
                        <p className="text-xs text-muted-foreground mb-4">Candidatos con puntuación registrada</p>
                        <div className="h-64 flex items-end gap-1">
                          {fase3aHistograma.map(({ name, count }) => {
                            const maxCount = Math.max(...fase3aHistograma.map(h => h.count), 1)
                            const height = (count / maxCount) * 100
                            return (
                              <div key={name} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground font-mono">{count}</span>
                                <div className="w-full bg-primary/10 rounded-t" style={{ height: `${Math.max(height, 2)}%` }}>
                                  <div className="w-full h-full bg-primary rounded-t" style={{ opacity: 0.3 + (height / 100) * 0.7 }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">{name}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* summary table */}
                    <div className="bg-card border border-border rounded-sm p-4 shadow-sm overflow-x-auto">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Estadísticas comunes</h4>
                      <table className="w-full min-w-[420px] text-xs">
                        <tbody className="divide-y divide-border/60">
                          <tr><td className="py-2 pr-3 text-muted-foreground">Total candidatos</td><td className="py-2 text-right font-mono font-semibold text-foreground">{displayDataFase3a.length.toLocaleString('es-ES')}</td></tr>
                          <tr><td className="py-2 pr-3 text-muted-foreground">APTO/A</td><td className="py-2 text-right font-mono font-semibold text-emerald-700">{fase3aStats?.aptos.toLocaleString('es-ES') ?? 0}</td></tr>
                          <tr><td className="py-2 pr-3 text-muted-foreground">NO APTO/A</td><td className="py-2 text-right font-mono font-semibold text-red-700">{fase3aStats?.noAptos.toLocaleString('es-ES') ?? 0}</td></tr>
                          <tr><td className="py-2 pr-3 text-muted-foreground">Puntuación media</td><td className="py-2 text-right font-mono font-semibold text-foreground">{fase3aStats?.media.toFixed(2) ?? '—'}</td></tr>
                        </tbody>
                      </table>
                    </div>
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
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Datos cargados desde CSV</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
