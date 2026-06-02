'use client'

import { useMemo } from 'react'
import { Doughnut, Bar, Scatter } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import '@/lib/chart-config'
import { Candidato } from '@/lib/parseCSV'
import { buildScoreBuckets, buildUngroupedHistogram } from './ScoreDistributionTable'
import { PRIMARY, GRID_COLOR, TICK_COLOR, ESTADO_COLORS, BAR_COLORS, TOOLTIP_BG, TOOLTIP_BORDER, avg } from '@/lib/chart-config'

interface Props {
  data: Candidato[]
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
      <div className="mb-1">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="mt-4 h-60">{children}</div>
    </div>
  )
}

const tooltipOptions: ChartOptions['plugins']['tooltip'] = {
  backgroundColor: TOOLTIP_BG,
  borderColor: TOOLTIP_BORDER,
  borderWidth: 1,
  titleColor: '#1a1a2e',
  bodyColor: '#1a1a2e',
  titleFont: { size: 11 },
  bodyFont: { size: 11 },
  padding: 8,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  cornerRadius: 4,
}

export function ChartsPanel({ data }: Props) {
  const estadoData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of data) counts[c.estado] = (counts[c.estado] ?? 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [data])

  const scores = useMemo(() => {
    return data
      .filter((c) => c.totalFase1 !== null)
      .map((c) => c.totalFase1! as number)
  }, [data])

  const { buckets } = useMemo(
    () => buildScoreBuckets(scores, 5, 0),
    [scores]
  )

  const ungroupedData = useMemo(
    () => buildUngroupedHistogram(scores, 0),
    [scores]
  )

  const scoresByCategory = useMemo(() => {
    const aptosData = data.filter((c) => c.estado === 'APTO/A')
    return [
      { name: 'Con. Generales', media: avg(aptosData.map((c) => c.conocimientosGenerales)) },
      { name: 'Inglés', media: avg(aptosData.map((c) => c.ingles)) },
      { name: 'Aptitudes', media: avg(aptosData.map((c) => c.aptitudes)) },
    ]
  }, [data])

  const scatterData = useMemo(() => {
    return data
      .filter((c) => c.conocimientosGenerales !== null && c.aptitudes !== null)
      .map((c) => ({ x: c.conocimientosGenerales!, y: c.aptitudes!, estado: c.estado }))
  }, [data])

  const scatterDomain = useMemo(() => {
    if (!scatterData.length) {
      return { x: [0, 10] as [number, number], y: [0, 10] as [number, number] }
    }
    let minX = scatterData[0].x
    let maxX = scatterData[0].x
    let minY = scatterData[0].y
    let maxY = scatterData[0].y
    for (const point of scatterData) {
      if (point.x < minX) minX = point.x
      if (point.x > maxX) maxX = point.x
      if (point.y < minY) minY = point.y
      if (point.y > maxY) maxY = point.y
    }
    const padding = 2
    return {
      x: [Math.max(0, minX - padding), maxX + padding] as [number, number],
      y: [Math.max(0, minY - padding), maxY + padding] as [number, number],
    }
  }, [scatterData])

  const commonStats = useMemo(() => {
    const aptos = data.filter((c) => c.estado === 'APTO/A').length
    const noAptos = data.filter((c) => c.estado === 'NO APTO/A').length
    const noPresentados = data.filter((c) => c.estado === 'NO PRESENTADO/A').length
    const presentados = aptos + noAptos

    return [
      { label: 'Total candidatos', value: data.length.toLocaleString('es-ES') },
      { label: 'APTO/A', value: aptos.toLocaleString('es-ES') },
      { label: 'NO APTO/A', value: noAptos.toLocaleString('es-ES') },
      { label: 'NO PRESENTADO/A', value: noPresentados.toLocaleString('es-ES') },
      { label: 'Tasa de aptos', value: `${((aptos / Math.max(presentados, 1)) * 100).toFixed(2)}%` },
      { label: 'Media total F1', value: avg(data.map((c) => c.totalFase1)).toFixed(2) },
    ]
  }, [data])

  // ─── Donut: Distribución por Estado ──────────────────────────
  const donutData: ChartData<'doughnut'> = {
    labels: estadoData.map((d) => d.name),
    datasets: [
      {
        data: estadoData.map((d) => d.value),
        backgroundColor: estadoData.map((d) => ESTADO_COLORS[d.name] ?? '#94a3b8'),
        borderWidth: 0,
      },
    ],
  }
  const donutOptions: ChartOptions<'doughnut'> = {
    cutout: '45%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 11 }, boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 16 },
      },
      tooltip: {
        ...tooltipOptions,
        callbacks: {
          label: (ctx) => {
            const total = (ctx.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0)
            const pct = total > 0 ? ((ctx.parsed as number) / total * 100).toFixed(1) : '0'
            return `${ctx.label}: ${(ctx.parsed as number).toLocaleString('es-ES')} (${pct}%)`
          },
        },
      },
    },
  }

  // ─── Horizontal Bar: Media por prueba ────────────────────────
  const horizBarData: ChartData<'bar'> = {
    labels: scoresByCategory.map((d) => d.name),
    datasets: [
      {
        label: 'Media',
        data: scoresByCategory.map((d) => d.media),
        backgroundColor: BAR_COLORS.slice(0, scoresByCategory.length),
        borderRadius: 2,
        borderSkipped: false,
      },
    ],
  }
  const horizBarOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipOptions,
        callbacks: { label: (ctx) => `${ctx.parsed.x}` },
      },
    },
    scales: {
      x: {
        grid: { color: GRID_COLOR, drawTicks: false },
        ticks: { font: { size: 11 }, color: TICK_COLOR },
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: TICK_COLOR },
      },
    },
  }

  // ─── Bar: Distribución sin agrupar ──────────────────────────
  const ungroupedBarData: ChartData<'bar'> = {
    labels: ungroupedData.map((d) => d.score),
    datasets: [
      {
        label: 'Candidatos',
        data: ungroupedData.map((d) => d.count),
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
        ...tooltipOptions,
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

  // ─── Scatter: Conocimientos vs Aptitudes ────────────────────
  const scatterChartData: ChartData<'scatter'> = {
    datasets: ['APTO/A', 'NO APTO/A', 'NO PRESENTADO/A'].map((estado) => ({
      label: estado,
      data: scatterData.filter((d) => d.estado === estado).map((d) => ({ x: d.x, y: d.y })),
      backgroundColor: ESTADO_COLORS[estado],
      pointRadius: 2.5,
      pointHoverRadius: 4,
    })),
  }
  const scatterOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 11 }, boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 16 },
      },
      tooltip: {
        ...tooltipOptions,
        callbacks: {
          label: (ctx) => {
            const p = ctx.parsed as { x: number; y: number }
            return `${ctx.dataset.label}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        grid: { color: GRID_COLOR, drawTicks: false },
        ticks: { font: { size: 11 }, color: TICK_COLOR },
        title: { display: true, text: 'Con. Generales', font: { size: 11 }, color: TICK_COLOR },
        min: scatterDomain.x[0],
        max: scatterDomain.x[1],
      },
      y: {
        grid: { color: GRID_COLOR, drawTicks: false },
        ticks: { font: { size: 11 }, color: TICK_COLOR },
        title: { display: true, text: 'Aptitudes', font: { size: 11 }, color: TICK_COLOR },
        min: scatterDomain.y[0],
        max: scatterDomain.y[1],
      },
    },
  }

  // ─── Bar: Distribución por tramos ───────────────────────────
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
        ...tooltipOptions,
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
        <ChartCard title="Distribución por Estado" sub="Resultado provisional Fase 1">
          <Doughnut data={donutData} options={donutOptions} />
        </ChartCard>

        <ChartCard title="Media de Puntuaciones — APTO/A" sub="Puntuación media por prueba entre candidatos aptos">
          <Bar data={horizBarData} options={horizBarOptions} />
        </ChartCard>

        <ChartCard title="Distribución de Puntuación Total (sin agrupar)" sub="Candidatos con puntuación registrada — cada punto entero">
          <Bar data={ungroupedBarData} options={ungroupedBarOptions} />
        </ChartCard>

        <ChartCard title="Conocimientos vs. Aptitudes" sub="Todos los candidatos con puntuación en ambas pruebas">
          <Scatter data={scatterChartData} options={scatterOptions} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Distribución por tramos" sub="Puntuación Total Fase 1 — agrupado cada 5 puntos">
          <Bar data={bucketsBarData} options={bucketsBarOptions} />
        </ChartCard>

        <div className="bg-card border border-border rounded-sm p-4 shadow-sm overflow-x-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Estadísticas comunes</h4>
          <table className="w-full min-w-[420px] text-xs">
            <tbody className="divide-y divide-border/60">
              {commonStats.map((row) => (
                <tr key={row.label}>
                  <td className="py-2 pr-3 text-muted-foreground">{row.label}</td>
                  <td className="py-2 text-right font-mono font-semibold text-foreground">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
