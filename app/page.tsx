'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Candidato, CandidatoFase2, CandidatoFase3, CandidatoFase3BOnly, CandidatoFase3COnly, CandidatoGlobal, computeGlobalRanking } from '@/lib/parseCSV'
import { StatsCards, type StatCardDef } from '@/components/StatsCards'
import { ChartsPanel } from '@/components/ChartsPanel'
import { ChartsPanelFase2 } from '@/components/ChartsPanelFase2'
import { ChartsPanelFase3a } from '@/components/ChartsPanelFase3a'
import { ChartsPanelFase3b } from '@/components/ChartsPanelFase3b'
import { ChartsPanelFase3c } from '@/components/ChartsPanelFase3c'
import { FilterSidebar, Filters, DEFAULT_FILTERS } from '@/components/FilterSidebar'
import { FilterSidebarFase2, DEFAULT_FILTERS_FASE2 } from '@/components/FilterSidebarFase2'
import { FilterSidebarFase3, DEFAULT_FILTERS_FASE3 } from '@/components/FilterSidebarFase3'
import { FilterSidebarFase3b, DEFAULT_FILTERS_FASE3B } from '@/components/FilterSidebarFase3b'
import { FilterSidebarFase3c, DEFAULT_FILTERS_FASE3C } from '@/components/FilterSidebarFase3c'
import { FilterSidebarGlobal } from '@/components/FilterSidebarGlobal'
import { DataTable, DEFAULT_VISIBLE_COLUMNS, ColumnVisibility } from '@/components/DataTable'
import { DataTableFase2, FiltersFase2 } from '@/components/DataTableFase2'
import { DataTableFase3, FiltersFase3 } from '@/components/DataTableFase3'
import { DataTableFase3b, FiltersFase3B } from '@/components/DataTableFase3b'
import { DataTableFase3c, FiltersFase3C } from '@/components/DataTableFase3c'
import { DataTableGlobal, FiltersGlobal, DEFAULT_FILTERS_GLOBAL, GlobalColumnVisibility, GLOBAL_DEFAULT_VISIBLE_COLUMNS } from '@/components/DataTableGlobal'
import { buildScoreBuckets, buildUngroupedHistogram } from '@/components/ScoreDistributionTable'
import { BarChart3, Table2, Loader2, FileSpreadsheet, CheckCircle2, XCircle, Users, MinusCircle, Globe, Flag, RotateCcw } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import '@/lib/chart-config'
import { PRIMARY, GRID_COLOR, TICK_COLOR, TOOLTIP_BG, TOOLTIP_BORDER } from '@/lib/chart-config'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

type Tab = 'tabla' | 'graficas'

// Main phases in the top navigation
type Phase = 'global' | 'fase1' | 'fase2' | 'fase3a' | 'fase3b' | 'fase3c'

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
    ],
  },
  fase3b: {
    title: 'Fase 3B – Evaluación conductual',
    bullets: [
      'Evalúa la adecuación al perfil competencial del controlador/a según el marco estratégico de ENAIRE.',
      'Máximo 120 puntos y mínimo 60 para superar.',
      'Datos disponibles: listado provisional.',
    ],
  },
  fase3c: {
    title: 'Fase 3C – Evaluación clínica de la personalidad',
    bullets: [
      'Determina la aptitud psicológica con resultado Apto/No Apto.',
      'Datos disponibles: listado provisional.',
    ],
  },
}

// Group phases for main navigation
const MAIN_PHASES = ['global', 'fase1', 'fase2', 'fase3a'] as const
const FASE3_SUB_TABS = ['fase3a', 'fase3b', 'fase3c'] as const

const MAIN_PHASE_LABELS: Record<string, string> = {
  global: 'GLOBAL',
  fase1: 'FASE 1',
  fase2: 'FASE 2',
  fase3a: 'FASE 3',
}

export default function Home() {
  const { data: fase1Data, error: fase1Error, isLoading: fase1Loading } = useSWR<Candidato[]>('/api/candidatos', fetcher)
  const { data: fase2Data, error: fase2Error, isLoading: fase2Loading } = useSWR<CandidatoFase2[]>('/api/candidatos/fase2', fetcher)
  const { data: fase3aData, error: fase3aError, isLoading: fase3aLoading } = useSWR<CandidatoFase3[]>('/api/candidatos/fase3a', fetcher)
  const { data: fase3bData, error: fase3bError, isLoading: fase3bLoading } = useSWR<CandidatoFase3BOnly[]>('/api/candidatos/fase3b', fetcher)
  const { data: fase3cData, error: fase3cError, isLoading: fase3cLoading } = useSWR<CandidatoFase3COnly[]>('/api/candidatos/fase3c', fetcher)
  const { data: verifyFase2 } = useSWR('/api/verify/fase2', fetcher, { revalidateOnFocus: false })

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [fase2Filters, setFase2Filters] = useState<FiltersFase2>(DEFAULT_FILTERS_FASE2)
  const [fase3Filters, setFase3Filters] = useState<FiltersFase3>(DEFAULT_FILTERS_FASE3)
  const [fase3bFilters, setFase3bFilters] = useState<FiltersFase3B>(DEFAULT_FILTERS_FASE3B)
  const [fase3cFilters, setFase3cFilters] = useState<FiltersFase3C>(DEFAULT_FILTERS_FASE3C)
  const [globalFilters, setGlobalFilters] = useState<FiltersGlobal>(DEFAULT_FILTERS_GLOBAL)
  const [globalVisibleColumns, setGlobalVisibleColumns] = useState<GlobalColumnVisibility>(GLOBAL_DEFAULT_VISIBLE_COLUMNS)
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(DEFAULT_VISIBLE_COLUMNS)
  const [tab, setTab] = useState<Tab>('tabla')
  const [phase, setPhase] = useState<Phase>('global')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Determine which main nav item is active
  const activeMainPhase: string = phase.startsWith('fase3') ? 'fase3a' : phase
  // Determine if we're inside Fase 3
  const isFase3 = phase.startsWith('fase3')

  const displayDataFase1 = Array.isArray(fase1Data) ? fase1Data : []
  const displayDataFase2 = Array.isArray(fase2Data) ? fase2Data : []
  const displayDataFase3a = Array.isArray(fase3aData) ? fase3aData : []
  const displayDataFase3b = Array.isArray(fase3bData) ? fase3bData : []
  const displayDataFase3c = Array.isArray(fase3cData) ? fase3cData : []

  const globalData = useMemo<CandidatoGlobal[]>(() => {
    if (!displayDataFase1.length || !displayDataFase2.length || !displayDataFase3a.length) return []
    if (!displayDataFase3b.length || !displayDataFase3c.length) return []
    return computeGlobalRanking(displayDataFase1, displayDataFase2, displayDataFase3a, displayDataFase3b, displayDataFase3c)
  }, [displayDataFase1, displayDataFase2, displayDataFase3a, displayDataFase3b, displayDataFase3c])

  const isPhaseWithData = phase === 'global' || phase === 'fase1' || phase === 'fase2' || phase === 'fase3a' || phase === 'fase3b' || phase === 'fase3c'

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

  // --- Fase 3b sorting ---
  const sortedFase3bData = useMemo(() => {
    if (!displayDataFase3b || !Array.isArray(displayDataFase3b)) return []
    return [...displayDataFase3b].sort((a, b) => {
      const key = fase3bFilters.sortBy as keyof CandidatoFase3BOnly
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
      return fase3bFilters.sortDir === 'asc' ? cmp : -cmp
    })
  }, [displayDataFase3b, fase3bFilters.sortBy, fase3bFilters.sortDir])

  // --- Fase 3c sorting ---
  const sortedFase3cData = useMemo(() => {
    if (!displayDataFase3c || !Array.isArray(displayDataFase3c)) return []
    return [...displayDataFase3c].sort((a, b) => {
      const key = fase3cFilters.sortBy as keyof CandidatoFase3COnly
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
      return fase3cFilters.sortDir === 'asc' ? cmp : -cmp
    })
  }, [displayDataFase3c, fase3cFilters.sortBy, fase3cFilters.sortDir])

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

  const handleSortChangeGlobal = (col: string) => {
    setGlobalFilters((prev) => ({
      ...prev,
      sortBy: col,
      sortDir: prev.sortBy === col && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleToggleColumnGlobal = (key: string) => {
    setGlobalVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      const hasAnyVisible = Object.values(next).some(Boolean)
      return hasAnyVisible ? next : prev
    })
  }

  const handleResetFiltersGlobal = () => {
    setGlobalFilters(DEFAULT_FILTERS_GLOBAL)
    setGlobalVisibleColumns(GLOBAL_DEFAULT_VISIBLE_COLUMNS)
  }

  const handleSortChangeFase3B = (col: string) => {
    setFase3bFilters((prev) => ({
      ...prev,
      sortBy: col,
      sortDir: prev.sortBy === col && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleResetFiltersFase3B = () => {
    setFase3bFilters(DEFAULT_FILTERS_FASE3B)
  }

  const handleSortChangeFase3C = (col: string) => {
    setFase3cFilters((prev) => ({
      ...prev,
      sortBy: col,
      sortDir: prev.sortBy === col && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleResetFiltersFase3C = () => {
    setFase3cFilters(DEFAULT_FILTERS_FASE3C)
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

  // --- Fase 3b stats cards ---
  const fase3bCardDefs: StatCardDef[] = useMemo(() => {
    if (!displayDataFase3b.length) return []
    const total = displayDataFase3b.length
    const aptos = displayDataFase3b.filter((c) => c.resultado3b === 'APTO/A').length
    const noAptos = displayDataFase3b.filter((c) => c.resultado3b === 'NO APTO/A').length
    const conPuntuacion = displayDataFase3b.filter((c) => c.puntuacion3b !== null)
    const media = conPuntuacion.length > 0
      ? conPuntuacion.reduce((a, c) => a + (c.puntuacion3b ?? 0), 0) / conPuntuacion.length
      : 0
    return [
      { eyebrow: 'TOTAL', value: total.toLocaleString('es-ES'), label: 'candidatos', icon: Users, iconColor: 'text-primary', valueColor: 'text-foreground' },
      { eyebrow: 'RESULTADO', value: aptos.toLocaleString('es-ES'), label: 'APTO/A', sub: `${total > 0 ? ((aptos / total) * 100).toFixed(1) : 0}%`, icon: CheckCircle2, iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
      { eyebrow: 'RESULTADO', value: noAptos.toLocaleString('es-ES'), label: 'NO APTO', sub: `${total > 0 ? ((noAptos / total) * 100).toFixed(1) : 0}%`, icon: XCircle, iconColor: 'text-red-500', valueColor: 'text-red-700' },
      { eyebrow: 'MEDIA', value: media.toFixed(2), label: 'puntuación media', icon: BarChart3, iconColor: 'text-primary', valueColor: 'text-foreground' },
    ]
  }, [displayDataFase3b])

  // --- Fase 3c stats cards ---
  const fase3cCardDefs: StatCardDef[] = useMemo(() => {
    if (!displayDataFase3c.length) return []
    const total = displayDataFase3c.length
    const aptos = displayDataFase3c.filter((c) => c.resultado3c === 'APTO/A').length
    const noAptos = displayDataFase3c.filter((c) => c.resultado3c === 'NO APTO/A').length
    return [
      { eyebrow: 'TOTAL', value: total.toLocaleString('es-ES'), label: 'candidatos', icon: Users, iconColor: 'text-primary', valueColor: 'text-foreground' },
      { eyebrow: 'RESULTADO', value: aptos.toLocaleString('es-ES'), label: 'APTO/A', sub: `${total > 0 ? ((aptos / total) * 100).toFixed(1) : 0}%`, icon: CheckCircle2, iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
      { eyebrow: 'RESULTADO', value: noAptos.toLocaleString('es-ES'), label: 'NO APTO', sub: `${total > 0 ? ((noAptos / total) * 100).toFixed(1) : 0}%`, icon: XCircle, iconColor: 'text-red-500', valueColor: 'text-red-700' },
    ]
  }, [displayDataFase3c])

  // --- Global stats cards ---
  const globalCardDefs: StatCardDef[] = useMemo(() => {
    if (!globalData.length) return []
    const total = globalData.length
    const conPuntuacion = globalData.filter((c) => c.puntuacionGlobal !== null)
    const media = conPuntuacion.length > 0
      ? conPuntuacion.reduce((a, c) => a + (c.puntuacionGlobal ?? 0), 0) / conPuntuacion.length
      : 0
    const maxScore = conPuntuacion.length > 0
      ? Math.max(...conPuntuacion.map((c) => c.puntuacionGlobal!))
      : 0
    const corteIndex = Math.min(149, total) - 1
    const notaCorte = total >= 149 ? globalData[corteIndex]?.puntuacionGlobal ?? null : null
    return [
      { eyebrow: 'TOTAL', value: total.toLocaleString('es-ES'), label: 'candidatos', icon: Users, iconColor: 'text-primary', valueColor: 'text-foreground' },
      { eyebrow: 'MEDIA GLOBAL', value: media.toFixed(2), label: 'puntuación media', icon: BarChart3, iconColor: 'text-primary', valueColor: 'text-foreground' },
      { eyebrow: 'MÁXIMA', value: maxScore.toFixed(2), label: 'puntuación máxima', icon: Globe, iconColor: 'text-amber-600', valueColor: 'text-amber-700' },
      { eyebrow: 'CORTE #149', value: notaCorte !== null ? notaCorte.toFixed(2) : '—', label: 'nota de corte', icon: Flag, iconColor: 'text-red-600', valueColor: 'text-red-700' },
    ]
  }, [globalData])

  const recordCount = phase === 'global' ? globalData.length : phase === 'fase1' ? displayDataFase1.length : phase === 'fase2' ? displayDataFase2.length : phase === 'fase3b' ? displayDataFase3b.length : phase === 'fase3c' ? displayDataFase3c.length : displayDataFase3a.length

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="bg-primary sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-0 flex items-stretch gap-4 md:gap-8">
          <div className="flex items-center gap-2.5 py-3 pr-4 md:pr-8 border-r border-white/20 shrink-0">
            <FileSpreadsheet className="h-5 w-5 text-white shrink-0" />
            <span className="text-white font-bold text-xs md:text-sm tracking-wide uppercase leading-none">ENAIRE</span>
          </div>

          <nav className="flex items-stretch gap-0 overflow-x-auto flex-1 scrollbar-none">
            {MAIN_PHASES.map((phaseId) => (
              <button
                key={phaseId}
                onClick={() => setPhase(phaseId)}
                className={`flex items-center px-2.5 md:px-4 py-3 text-xs md:text-sm cursor-pointer transition-colors border-b-2 whitespace-nowrap ${
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
              className="hidden sm:flex items-center px-4 py-3 text-xs md:text-sm text-white/90 hover:text-white hover:bg-white/10 cursor-pointer transition-colors border-b-2 border-transparent whitespace-nowrap"
            >
              Información
            </a>
          </nav>

          <div className="ml-auto flex items-center">
            <span className="text-xs text-white/80 font-medium">{recordCount.toLocaleString('es-ES')} registros</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 md:px-6 py-10 space-y-10">
        {(phase === 'global'
          ? (fase1Loading || fase2Loading || fase3aLoading)
          : (fase1Loading || fase2Loading || (isFase3 && (fase3aLoading || fase3bLoading || fase3cLoading)))) && (
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

        {fase3bError && phase === 'fase3b' && (
          <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            No se pudieron cargar los datos de Fase 3B.
          </div>
        )}

        {fase3cError && phase === 'fase3c' && (
          <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            No se pudieron cargar los datos de Fase 3C.
          </div>
        )}

        {/* Fase 3 sub-tabs */}
        {isFase3 && !fase3aLoading && (
          <div className="flex items-center gap-1 border-b border-border pb-0 overflow-x-auto scrollbar-none">
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

        {!(phase === 'global' ? (fase1Loading || fase2Loading || fase3aLoading) : false) &&
          !(phase === 'fase1' && fase1Loading) &&
          !(phase === 'fase2' && fase2Loading) &&
          !(isFase3 && fase3aLoading) &&
          !(phase === 'fase3b' && fase3bLoading) &&
          !(phase === 'fase3c' && fase3cLoading) && (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">RESULTADOS</p>
              <h1 className="text-3xl font-bold text-foreground text-balance leading-tight">
                {phase === 'global'
                  ? 'Ranking Global'
                  : phase === 'fase2'
                    ? 'Listado Definitivo Fase 2'
                    : `Listado Provisional ${phase === 'fase1' ? 'Fase 1' : isFase3 ? `Fase 3${phase.replace('fase3', ' - ')}` : ''}`}
              </h1>
              <div className="mt-2 h-0.5 w-10 bg-primary" />
            </div>

            {/* Phase info notes */}
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-base font-semibold mb-3">{PHASE_NOTES[phase]?.title ?? ''}</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                {(PHASE_NOTES[phase]?.bullets ?? []).map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </section>

            {/* Global view */}
            {phase === 'global' && (
              <>
                <StatsCards cards={globalCardDefs} />

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
                    <div className={`${!sidebarOpen ? 'w-12' : 'w-full lg:w-60'} shrink-0`}>
                      <FilterSidebarGlobal
                        filters={globalFilters}
                        onChange={setGlobalFilters}
                        onReset={handleResetFiltersGlobal}
                        visibleColumns={globalVisibleColumns}
                        onToggleColumn={handleToggleColumnGlobal}
                        collapsed={!sidebarOpen}
                        onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
                      />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <DataTableGlobal
                        data={globalData}
                        filters={globalFilters}
                        visibleColumns={globalVisibleColumns}
                        onSortChange={handleSortChangeGlobal}
                      />
                    </div>
                  </div>
                )}

                {tab === 'graficas' && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">ANÁLISIS GLOBAL</p>
                      <h2 className="text-xl font-bold text-foreground">Estadísticas del ranking global</h2>
                      <div className="mt-2 h-0.5 w-8 bg-primary" />
                    </div>
                    <GlobalChartsSection data={globalData} />
                  </div>
                )}
              </>
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
                    <div className={`${!sidebarOpen ? 'w-12' : 'w-full lg:w-60'} shrink-0`}>
                      <FilterSidebar
                        filters={filters}
                        onChange={setFilters}
                        onReset={handleResetFilters}
                        visibleColumns={visibleColumns}
                        onToggleColumn={handleToggleColumn}
                        collapsed={!sidebarOpen}
                        onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
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
                          className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                        >
                          <RotateCcw className="h-3 w-3" /> Ver todos
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
                      <div className={`${!sidebarOpen ? 'w-12' : 'w-full lg:w-60'} shrink-0`}>
                        <FilterSidebarFase2
                          filters={fase2Filters}
                          onChange={setFase2Filters}
                          onReset={handleResetFiltersFase2}
                          collapsed={!sidebarOpen}
                          onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
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
                          className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                        >
                          <RotateCcw className="h-3 w-3" /> Ver todos
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
                      <div className={`${!sidebarOpen ? 'w-12' : 'w-full lg:w-60'} shrink-0`}>
                        {/* Fase 3a filter sidebar */}
                        <FilterSidebarFase3
                          filters={fase3Filters}
                          onChange={setFase3Filters}
                          onReset={handleResetFiltersFase3}
                          collapsed={!sidebarOpen}
                          onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
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
                          className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                        >
                          <RotateCcw className="h-3 w-3" /> Ver todos
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

            {/* Fase 3b content */}
            {phase === 'fase3b' && (
              <>
                <StatsCards cards={fase3bCardDefs} />

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
                      <div className={`${!sidebarOpen ? 'w-12' : 'w-full lg:w-60'} shrink-0`}>
                        <FilterSidebarFase3b
                          filters={fase3bFilters}
                          onChange={setFase3bFilters}
                          onReset={handleResetFiltersFase3B}
                          collapsed={!sidebarOpen}
                          onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
                        />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <DataTableFase3b
                          data={sortedFase3bData}
                          filters={fase3bFilters}
                          onSortChange={handleSortChangeFase3B}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'graficas' && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">ANÁLISIS</p>
                      <h2 className="text-xl font-bold text-foreground">Estadísticas Fase 3B — Conductual</h2>
                      <div className="mt-2 h-0.5 w-8 bg-primary" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtrar:</span>
                      {[
                        { label: 'APTO/A', active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50' },
                        { label: 'NO APTO/A', active: 'bg-red-600 text-white border-red-600', inactive: 'bg-white text-red-700 border-red-300 hover:bg-red-50' },
                        { label: 'EXCLUIDO/A (1)', active: 'bg-gray-600 text-white border-gray-600', inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' },
                      ].map(({ label, active, inactive }) => (
                        <button
                          key={label}
                          onClick={() => {
                            const next = fase3bFilters.resultado.includes(label)
                              ? fase3bFilters.resultado.filter((x) => x !== label)
                              : [...fase3bFilters.resultado, label]
                            setFase3bFilters((f) => ({ ...f, resultado: next }))
                          }}
                          className={`rounded-sm border px-3 py-1 text-xs font-medium transition-all ${
                            fase3bFilters.resultado.includes(label) ? active : inactive
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      {fase3bFilters.resultado.length > 0 && (
                        <button
                          onClick={() => setFase3bFilters((f) => ({ ...f, resultado: [] }))}
                          className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                        >
                          <RotateCcw className="h-3 w-3" /> Ver todos
                        </button>
                      )}
                    </div>

                    <ChartsPanelFase3b
                      data={
                        fase3bFilters.resultado.length > 0
                          ? sortedFase3bData.filter((c) => {
                              const r = c.resultado3b ?? ''
                              return fase3bFilters.resultado.includes(r)
                            })
                          : sortedFase3bData
                      }
                    />
                  </div>
                )}
              </>
            )}

            {/* Fase 3c content */}
            {phase === 'fase3c' && (
              <>
                <StatsCards cards={fase3cCardDefs} />

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
                      <div className={`${!sidebarOpen ? 'w-12' : 'w-full lg:w-60'} shrink-0`}>
                        <FilterSidebarFase3c
                          filters={fase3cFilters}
                          onChange={setFase3cFilters}
                          onReset={handleResetFiltersFase3C}
                          collapsed={!sidebarOpen}
                          onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
                        />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <DataTableFase3c
                          data={sortedFase3cData}
                          filters={fase3cFilters}
                          onSortChange={handleSortChangeFase3C}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'graficas' && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">ANÁLISIS</p>
                      <h2 className="text-xl font-bold text-foreground">Estadísticas Fase 3C — Clínica</h2>
                      <div className="mt-2 h-0.5 w-8 bg-primary" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtrar:</span>
                      {[
                        { label: 'APTO/A', active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50' },
                        { label: 'NO APTO/A', active: 'bg-red-600 text-white border-red-600', inactive: 'bg-white text-red-700 border-red-300 hover:bg-red-50' },
                      ].map(({ label, active, inactive }) => (
                        <button
                          key={label}
                          onClick={() => {
                            const next = fase3cFilters.resultado.includes(label)
                              ? fase3cFilters.resultado.filter((x) => x !== label)
                              : [...fase3cFilters.resultado, label]
                            setFase3cFilters((f) => ({ ...f, resultado: next }))
                          }}
                          className={`rounded-sm border px-3 py-1 text-xs font-medium transition-all ${
                            fase3cFilters.resultado.includes(label) ? active : inactive
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      {fase3cFilters.resultado.length > 0 && (
                        <button
                          onClick={() => setFase3cFilters((f) => ({ ...f, resultado: [] }))}
                          className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                        >
                          <RotateCcw className="h-3 w-3" /> Ver todos
                        </button>
                      )}
                    </div>

                    <ChartsPanelFase3c
                      data={
                        fase3cFilters.resultado.length > 0
                          ? sortedFase3cData.filter((c) => {
                              const r = c.resultado3c ?? ''
                              return fase3cFilters.resultado.includes(r)
                            })
                          : sortedFase3cData
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
          <p className="text-xs text-muted-foreground">Resultados — Fase 1 (Provisional) / Fase 2 (Definitivo) / Fase 3A/B/C (Provisional). Solo consulta. Datos sujetos a modificación.</p>
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

/** Global charts: grouped/ungrouped charts + destacados */
function GlobalChartsSection({ data }: { data: CandidatoGlobal[] }) {
  const scores = useMemo(
    () => data.filter((c) => c.puntuacionGlobal !== null).map((c) => c.puntuacionGlobal!),
    [data]
  )
  const { buckets } = useMemo(() => buildScoreBuckets(scores, 10), [scores])
  const ungrouped = useMemo(() => buildUngroupedHistogram(scores), [scores])

  const statsDestacados = useMemo(() => {
    if (!data.length) return null

    // Mayor subida F1→F3A
    const mejorSubida = data.reduce((best, c) =>
      (c.evolF1aF3a ?? -Infinity) > (best.evolF1aF3a ?? -Infinity) ? c : best
    )
    // Mayor bajada F1→F3A
    const mejorBajada = data.reduce((worst, c) =>
      (c.evolF1aF3a ?? Infinity) < (worst.evolF1aF3a ?? Infinity) ? c : worst
    )
    // Mayor subida F3A→F3B
    const mejorSubida3b = data.reduce((best, c) =>
      (c.evolF3aF3b ?? -Infinity) > (best.evolF3aF3b ?? -Infinity) ? c : best
    )
    // Mayor bajada F3A→F3B
    const mejorBajada3b = data.reduce((worst, c) =>
      (c.evolF3aF3b ?? Infinity) < (worst.evolF3aF3b ?? Infinity) ? c : worst
    )
    // Nota máxima y mínima
    const notaMax = data.reduce((best, c) =>
      (c.puntuacionGlobal ?? -Infinity) > (best.puntuacionGlobal ?? -Infinity) ? c : best
    )
    const notaMin = data.reduce((worst, c) =>
      (c.puntuacionGlobal ?? Infinity) < (worst.puntuacionGlobal ?? Infinity) ? c : worst
    )
    // Mediana
    const sortedScores = [...data].sort(
      (a, b) => (a.puntuacionGlobal ?? 0) - (b.puntuacionGlobal ?? 0)
    )
    const mid = Math.floor(sortedScores.length / 2)
    const mediana = sortedScores.length > 0
      ? sortedScores[mid].puntuacionGlobal
      : null

    return { mejorSubida, mejorBajada, mejorSubida3b, mejorBajada3b, notaMax, notaMin, mediana }
  }, [data])

  const tooltipBase: ChartOptions['plugins']['tooltip'] = {
    backgroundColor: TOOLTIP_BG,
    borderColor: TOOLTIP_BORDER,
    borderWidth: 1,
    titleColor: '#1a1a2e',
    bodyColor: '#1a1a2e',
    titleFont: { size: 11 },
    bodyFont: { size: 11 },
    padding: 8,
    cornerRadius: 4,
  }

  // ─── Bar: Ungrouped histogram ───────────────────────────────
  const ungroupedBarData: ChartData<'bar'> = {
    labels: ungrouped.map((d) => d.score),
    datasets: [
      {
        label: 'Candidatos',
        data: ungrouped.map((d) => d.count),
        backgroundColor: PRIMARY,
        borderRadius: 1,
        borderSkipped: false,
      },
    ],
  }
  const ungroupedBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        callbacks: {
          title: (ctx) => `Puntuación ${ctx[0].label}`,
          label: (ctx) => `${ctx.parsed.y.toLocaleString('es-ES')} candidatos`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: TICK_COLOR, maxTicksLimit: 15 },
      },
      y: {
        grid: { color: GRID_COLOR, drawTicks: false },
        ticks: { font: { size: 11 }, color: TICK_COLOR },
        beginAtZero: true,
      },
    },
  }

  // ─── Bar: Grouped buckets ──────────────────────────────────
  const bucketsBarData: ChartData<'bar'> = {
    labels: buckets.map((d) => d.rangeLabel),
    datasets: [
      {
        label: 'Candidatos',
        data: buckets.map((d) => d.count),
        backgroundColor: PRIMARY,
        borderRadius: 2,
        borderSkipped: false,
      },
    ],
  }
  const bucketsBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase,
        callbacks: {
          title: (ctx) => `Tramo ${ctx[0].label}`,
          label: (ctx) => `${ctx.parsed.y.toLocaleString('es-ES')} candidatos`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: TICK_COLOR, maxRotation: 35 },
      },
      y: {
        grid: { color: GRID_COLOR, drawTicks: false },
        ticks: { font: { size: 11 }, color: TICK_COLOR },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Ungrouped */}
        <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
          <div className="mb-1">
            <h3 className="text-sm font-bold text-foreground">Distribución de Puntuación Global (sin agrupar)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Cada punto entero de puntuación global</p>
          </div>
          <div className="mt-4 h-60">
            <Bar data={ungroupedBarData} options={ungroupedBarOptions} />
          </div>
        </div>

        {/* Grouped */}
        <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
          <div className="mb-1">
            <h3 className="text-sm font-bold text-foreground">Distribución por tramos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Puntuación Global — agrupado cada 10 puntos</p>
          </div>
          <div className="mt-4 h-60">
            <Bar data={bucketsBarData} options={bucketsBarOptions} />
          </div>
        </div>
      </div>

      {/* Estadísticas destacadas */}
      {statsDestacados && (
        <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">Estadísticas destacadas</h3>
            <div className="mt-1.5 h-0.5 w-6 bg-primary" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">🏆 Mayor subida F1→F3A</p>
              <p className="text-sm font-semibold text-emerald-900 truncate" title={statsDestacados.mejorSubida.nombre}>{statsDestacados.mejorSubida.nombre}</p>
              <p className="text-xs text-emerald-700 font-mono mt-0.5">+{statsDestacados.mejorSubida.evolF1aF3a} puestos</p>
            </div>
            <div className="rounded-sm border border-red-200 bg-red-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">📉 Mayor bajada F1→F3A</p>
              <p className="text-sm font-semibold text-red-900 truncate" title={statsDestacados.mejorBajada.nombre}>{statsDestacados.mejorBajada.nombre}</p>
              <p className="text-xs text-red-700 font-mono mt-0.5">{statsDestacados.mejorBajada.evolF1aF3a} puestos</p>
            </div>
            <div className="rounded-sm border border-sky-200 bg-sky-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700 mb-1">🏆 Mayor subida F3A→F3B</p>
              <p className="text-sm font-semibold text-sky-900 truncate" title={statsDestacados.mejorSubida3b.nombre}>{statsDestacados.mejorSubida3b.nombre}</p>
              <p className="text-xs text-sky-700 font-mono mt-0.5">+{statsDestacados.mejorSubida3b.evolF3aF3b} puestos</p>
            </div>
            <div className="rounded-sm border border-orange-200 bg-orange-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700 mb-1">📉 Mayor bajada F3A→F3B</p>
              <p className="text-sm font-semibold text-orange-900 truncate" title={statsDestacados.mejorBajada3b.nombre}>{statsDestacados.mejorBajada3b.nombre}</p>
              <p className="text-xs text-orange-700 font-mono mt-0.5">{statsDestacados.mejorBajada3b.evolF3aF3b} puestos</p>
            </div>
            <div className="rounded-sm border border-amber-200 bg-amber-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">🥇 Nota máxima</p>
              <p className="text-sm font-semibold text-amber-900 truncate" title={statsDestacados.notaMax.nombre}>{statsDestacados.notaMax.nombre}</p>
              <p className="text-xs text-amber-700 font-mono mt-0.5">{statsDestacados.notaMax.puntuacionGlobal?.toFixed(2)} pts</p>
            </div>
            <div className="rounded-sm border border-blue-200 bg-blue-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">🥉 Nota mínima</p>
              <p className="text-sm font-semibold text-blue-900 truncate" title={statsDestacados.notaMin.nombre}>{statsDestacados.notaMin.nombre}</p>
              <p className="text-xs text-blue-700 font-mono mt-0.5">{statsDestacados.notaMin.puntuacionGlobal?.toFixed(2)} pts</p>
            </div>
            <div className="rounded-sm border border-purple-200 bg-purple-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-1">📊 Nota mediana</p>
              <p className="text-sm font-semibold text-purple-900">—</p>
              <p className="text-xs text-purple-700 font-mono mt-0.5">{statsDestacados.mediana?.toFixed(2) ?? '—'} pts</p>
            </div>
            <div className="rounded-sm border border-gray-200 bg-gray-50 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">📋 Total candidatos</p>
              <p className="text-sm font-semibold text-gray-900">—</p>
              <p className="text-xs text-gray-700 font-mono mt-0.5">{data.length} candidatos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
