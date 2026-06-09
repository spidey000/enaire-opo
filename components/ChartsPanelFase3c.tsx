'use client'

import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import '@/lib/chart-config'
import { CandidatoFase3COnly } from '@/lib/parseCSV'
import { PRIMARY, ESTADO_COLORS, TOOLTIP_BG, TOOLTIP_BORDER } from '@/lib/chart-config'

interface Props {
  data: CandidatoFase3COnly[]
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

export function ChartsPanelFase3c({ data }: Props) {
  const resultadoData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of data) {
      const key = c.resultado3c ?? 'SIN DATO'
      counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [data])

  const stats = useMemo(() => {
    const total = data.length
    const aptos = data.filter((c) => c.resultado3c === 'APTO/A').length
    const noAptos = data.filter((c) => c.resultado3c === 'NO APTO/A').length
    const pctApto = total > 0 ? ((aptos / total) * 100).toFixed(1) : '0.0'

    return { total, aptos, noAptos, pctApto }
  }, [data])

  // ─── Donut: Distribución por Resultado 3C ─────────────────────
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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Distribución por Resultado 3C" sub="Resultado provisional Fase 3C">
          <Doughnut data={donutData} options={donutOptions} />
        </ChartCard>

        <div className="bg-card border border-border rounded-sm p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Estadísticas comunes</h4>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="py-2 pr-3 text-muted-foreground">Total candidatos</td>
                <td className="py-2 text-right font-mono font-semibold text-foreground">{stats.total.toLocaleString('es-ES')}</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-muted-foreground">APTO/A</td>
                <td className="py-2 text-right font-mono font-semibold text-foreground">{stats.aptos.toLocaleString('es-ES')}</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-muted-foreground">NO APTO/A</td>
                <td className="py-2 text-right font-mono font-semibold text-foreground">{stats.noAptos.toLocaleString('es-ES')}</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 text-muted-foreground">% APTO/A</td>
                <td className="py-2 text-right font-mono font-semibold text-foreground">{stats.pctApto}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-card border border-border rounded-sm p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Resumen de Resultados</p>
          <p className="text-5xl font-bold text-green-600 mt-2">{stats.aptos.toLocaleString('es-ES')}</p>
          <p className="text-xs text-muted-foreground mt-1">candidatos APTO/A en Fase 3C</p>
        </div>
      </div>
    </div>
  )
}
