'use client'

import { useMemo } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import '@/lib/chart-config'
import { CandidatoFase3 } from '@/lib/parseCSV'
import { buildScoreBuckets, buildUngroupedHistogram } from './ScoreDistributionTable'
import { PRIMARY, GRID_COLOR, TICK_COLOR, ESTADO_COLORS, TOOLTIP_BG, TOOLTIP_BORDER } from '@/lib/chart-config'

interface Props {
  data: CandidatoFase3[]
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
  cornerRadius: 4,
}

export function ChartsPanelFase3a({ data }: Props) {
  const resultadoData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of data) {
      const key = c.resultado3a ?? 'SIN DATO'
      counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [data])

  const scores = useMemo(() => {
    return data
      .filter((c) => c.puntuacion3a !== null)
      .map((c) => c.puntuacion3a! as number)
  }, [data])

  const { buckets } = useMemo(
    () => buildScoreBuckets(scores, 5, 0),
    [scores]
  )

  const ungroupedData = useMemo(
    () => buildUngroupedHistogram(scores, 0),
    [scores]
  )

  const commonStats = useMemo(() => {
    const total = data.length
    const aptos = data.filter((c) => c.resultado3a === 'APTO/A').length
    const noAptos = data.filter((c) => c.resultado3a === 'NO APTO/A').length
    const noPresentados = data.filter((c) => c.resultado3a === 'NO PRESENTADO/A').length
    const excluidos = data.filter(
      (c) => c.resultado3a && c.resultado3a.startsWith('EXCLUIDO')
    ).length
    const renuncias = data.filter(
      (c) => c.resultado3a && c.resultado3a.startsWith('RENUNCIA')
    ).length
    const conPuntuacion = data.filter((c) => c.puntuacion3a !== null)
    const media = conPuntuacion.length > 0
      ? conPuntuacion.reduce((a, c) => a + (c.puntuacion3a ?? 0), 0) / conPuntuacion.length
      : 0

    return [
      { label: 'Total candidatos', value: total.toLocaleString('es-ES') },
      { label: 'APTO/A', value: aptos.toLocaleString('es-ES') },
      { label: 'NO APTO/A', value: noAptos.toLocaleString('es-ES') },
      { label: 'NO PRESENTADO/A', value: noPresentados.toLocaleString('es-ES') },
      { label: 'Excluidos', value: excluidos.toLocaleString('es-ES') },
      { label: 'Renuncias', value: renuncias.toLocaleString('es-ES') },
      { label: 'Puntuación media (aptos)', value: media.toFixed(2) },
    ]
  }, [data])

  // ─── Donut: Distribución por Resultado ───────────────────────
  const donutData: ChartData<'doughnut'> = {
    labels: resultadoData.map((d) => d.name),
    datasets: [
      {
        data: resultadoData.map((d) => d.value),
        backgroundColor: resultadoData.map((d) => ESTADO_COLORS[d.name] ?? '#94a3b8'),
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
        <ChartCard title="Distribución por Resultado" sub="Resultado provisional Fase 3A">
          <Doughnut data={donutData} options={donutOptions} />
        </ChartCard>

        <ChartCard title="Distribución de Puntuación (sin agrupar)" sub="Candidatos aptos — cada punto entero de puntuación">
          <Bar data={ungroupedBarData} options={ungroupedBarOptions} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Distribución por tramos" sub="Puntuación Fase 3A — agrupado cada 5 puntos">
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
