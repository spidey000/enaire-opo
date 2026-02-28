'use client'

import { useMemo } from 'react'
import { Candidato } from '@/lib/parseCSV'
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
  ScatterChart,
  Scatter,
  CartesianGrid,
  Legend,
} from 'recharts'

interface Props {
  data: Candidato[]
}

const PRIMARY = '#009FE3'
const ESTADO_COLORS: Record<string, string> = {
  'APTO/A': '#16a34a',
  'NO APTO/A': '#dc2626',
  'NO PRESENTADO/A': '#d97706',
}
const BAR_COLORS = [PRIMARY, '#16a34a', '#d97706']

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

function avg(values: (number | null)[]) {
  const valid = values.filter((v): v is number => v !== null)
  if (!valid.length) return 0
  return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2))
}

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

export function ChartsPanel({ data }: Props) {
  const estadoData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of data) counts[c.estado] = (counts[c.estado] ?? 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [data])

  const distributionData = useMemo(() => {
    const buckets: Record<string, number> = {}
    const step = 5
    for (const c of data) {
      if (c.totalFase1 === null) continue
      const bucket = Math.floor(c.totalFase1 / step) * step
      const label = `${bucket}`
      buckets[label] = (buckets[label] ?? 0) + 1
    }
    return Object.entries(buckets)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([name, count]) => ({ name, count }))
  }, [data])

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
      return { x: [0, 10], y: [0, 10] }
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
      x: [Math.max(0, minX - padding), maxX + padding],
      y: [Math.max(0, minY - padding), maxY + padding],
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

  const TICK = { fontSize: 11, fill: '#6b7280' }
  const GRID_COLOR = '#e5e7eb'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Distribución por Estado" sub="Resultado provisional Fase 1">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={estadoData} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" paddingAngle={2}>
                {estadoData.map((entry) => (
                  <Cell key={entry.name} fill={ESTADO_COLORS[entry.name] ?? '#94a3b8'} stroke="none" />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [v.toLocaleString('es-ES'), name]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribución de Puntuación Total" sub="Candidatos con puntuación registrada">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={distributionData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="name" tick={TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} interval="preserveStartEnd" />
              <YAxis tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString('es-ES'), 'Candidatos']} labelFormatter={(l) => `Puntuación ~${l}`} />
              <Bar dataKey="count" fill={PRIMARY} radius={[2, 2, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Media de Puntuaciones — APTO/A" sub="Puntuación media por prueba entre candidatos aptos">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={scoresByCategory} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
              <XAxis type="number" tick={TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis type="category" dataKey="name" tick={TICK} tickLine={false} axisLine={false} width={90} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}`, 'Media']} />
              <Bar dataKey="media" radius={[0, 2, 2, 0]} maxBarSize={28}>
                {scoresByCategory.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Conocimientos vs. Aptitudes" sub="Todos los candidatos con puntuación en ambas pruebas">
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis type="number" dataKey="x" name="Con. Generales" tick={TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} domain={scatterDomain.x} />
              <YAxis type="number" dataKey="y" name="Aptitudes" tick={TICK} tickLine={false} axisLine={false} domain={scatterDomain.y} />
              <Tooltip {...TOOLTIP_STYLE} />
              {['APTO/A', 'NO APTO/A', 'NO PRESENTADO/A'].map((estado) => (
                <Scatter
                  key={estado}
                  name={estado}
                  data={scatterData.filter((d) => d.estado === estado)}
                  fill={ESTADO_COLORS[estado]}
                  opacity={0.55}
                  r={2.5}
                />
              ))}
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

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
  )
}
