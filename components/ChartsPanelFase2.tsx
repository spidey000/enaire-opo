'use client'

import { useMemo } from 'react'
import { CandidatoFase2 } from '@/lib/parseCSV'
import { buildScoreBuckets, buildUngroupedHistogram } from './ScoreDistributionTable'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts'

interface Props {
  data: CandidatoFase2[]
}

const PRIMARY = '#009FE3'
const ESTADO_COLORS: Record<string, string> = {
  'APTO/A': '#16a34a',
  'NO APTO/A': '#dc2626',
  'NO PRESENTADO/A': '#d97706',
  'EXCLUIDO/A (1)': '#6b7280',
  RENUNCIA: '#a855f7',
}
const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    color: '#1a1a2e',
    fontSize: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
}
const TICK = { fontSize: 11, fill: '#6b7280' }
const GRID_COLOR = '#e5e7eb'

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-sm p-5 shadow-sm">
      <div className="mb-1">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function ChartsPanelFase2({ data }: Props) {
  const estadoData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of data) {
      const key = c.estado || 'SIN DATO'
      counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [data])

  const scores = useMemo(() => {
    return data.filter((c) => c.puntuacion !== null).map((c) => c.puntuacion! as number)
  }, [data])

  const { buckets, total: bucketTotal } = useMemo(
    () => buildScoreBuckets(scores, 5, 0),
    [scores]
  )

  const ungroupedData = useMemo(
    () => buildUngroupedHistogram(scores, 0),
    [scores]
  )

  const commonStats = useMemo(() => {
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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Distribución por Resultado" sub="Resultado definitivo Fase 2">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={estadoData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
                dataKey="value"
                paddingAngle={2}
              >
                {estadoData.map((entry) => (
                  <Cell key={entry.name} fill={ESTADO_COLORS[entry.name] ?? '#94a3b8'} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: number, name: string) => [v.toLocaleString('es-ES'), name]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribución de Puntuación (sin agrupar)" sub="Candidatos aptos con puntuación registrada — cada punto entero">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ungroupedData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="score" tick={TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} interval="preserveStartEnd" />
              <YAxis tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: number) => [v.toLocaleString('es-ES'), 'Candidatos']}
                labelFormatter={(l) => `Puntuación ${l}`}
              />
              <Bar dataKey="count" fill={PRIMARY} radius={[1, 1, 0, 0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Distribución por tramos" sub="Puntuación Fase 2 — agrupado cada 5 puntos">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={buckets} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="rangeLabel" tick={TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} interval={0} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString('es-ES'), 'Candidatos']} labelFormatter={(l) => `Tramo ${l}`} />
              <Bar dataKey="count" fill={PRIMARY} radius={[2, 2, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
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
