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

/* ENAIRE brand cyan + semantic colors */
const PRIMARY = '#009FE3'
const ESTADO_COLORS: Record<string, string> = {
  'APTO/A':          '#16a34a',
  'NO APTO/A':       '#dc2626',
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
    for (const c of data) {
      counts[c.estado] = (counts[c.estado] ?? 0) + 1
    }
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
    const avg = (arr: (number | null)[]): number => {
      const valid = arr.filter((v): v is number => v !== null)
      if (!valid.length) return 0
      return parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2))
    }
    return [
      { name: 'Con. Generales', media: avg(aptosData.map((c) => c.conocimientosGenerales)) },
      { name: 'Inglés', media: avg(aptosData.map((c) => c.ingles)) },
      { name: 'Aptitudes', media: avg(aptosData.map((c) => c.aptitudes)) },
    ]
  }, [data])

  const scatterData = useMemo(() => {
    return data
      .filter((c) => c.conocimientosGenerales !== null && c.aptitudes !== null)
      .slice(0, 600)
      .map((c) => ({ x: c.conocimientosGenerales!, y: c.aptitudes!, estado: c.estado }))
  }, [data])

  const TICK = { fontSize: 11, fill: '#6b7280' }
  const GRID_COLOR = '#e5e7eb'

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

      {/* Pie — Estado distribution */}
      <ChartCard
        title="Distribución por Estado"
        sub="Resultado provisional Fase 1"
      >
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
                <Cell
                  key={entry.name}
                  fill={ESTADO_COLORS[entry.name] ?? '#94a3b8'}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v: number, name: string) => [v.toLocaleString('es-ES'), name]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(value) => (
                <span style={{ color: '#374151' }}>
                  {value === 'NO PRESENTADO/A' ? 'No Presentado/A' : value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Bar — Score distribution */}
      <ChartCard
        title="Distribución de Puntuación Total"
        sub="Candidatos con puntuación registrada"
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={distributionData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="name"
              tick={TICK}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={TICK}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v: number) => [v.toLocaleString('es-ES'), 'Candidatos']}
              labelFormatter={(l) => `Puntuación ~${l}`}
            />
            <Bar dataKey="count" fill={PRIMARY} radius={[2, 2, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Bar — Average scores for APTO/A */}
      <ChartCard
        title="Media de Puntuaciones — APTO/A"
        sub="Puntuación media por prueba entre candidatos aptos"
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={scoresByCategory}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
            <XAxis type="number" tick={TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={TICK}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v: number) => [`${v}`, 'Media']}
            />
            <Bar dataKey="media" radius={[0, 2, 2, 0]} maxBarSize={28}>
              {scoresByCategory.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Scatter — Conocimientos vs Aptitudes */}
      <ChartCard
        title="Conocimientos vs. Aptitudes"
        sub="Muestra de hasta 600 candidatos con puntuación"
      >
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis
              type="number"
              dataKey="x"
              name="Con. Generales"
              tick={TICK}
              tickLine={false}
              axisLine={{ stroke: GRID_COLOR }}
              label={{ value: 'Con. Generales', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#9ca3af' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Aptitudes"
              tick={TICK}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Aptitudes', angle: -90, position: 'insideLeft', offset: 16, fontSize: 10, fill: '#9ca3af' }}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              cursor={{ strokeDasharray: '3 3', stroke: '#d1d5db' }}
              content={({ payload }) => {
                if (!payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={TOOLTIP_STYLE.contentStyle} className="p-2 text-xs">
                    <div className="font-medium mb-1">{d.estado}</div>
                    <div>Con. Generales: <span className="font-mono">{d.x}</span></div>
                    <div>Aptitudes: <span className="font-mono">{d.y}</span></div>
                  </div>
                )
              }}
            />
            {['APTO/A', 'NO APTO/A'].map((estado) => (
              <Scatter
                key={estado}
                name={estado}
                data={scatterData.filter((d) => d.estado === estado)}
                fill={ESTADO_COLORS[estado]}
                opacity={0.55}
                r={2.5}
              />
            ))}
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(v) => <span style={{ color: '#374151' }}>{v}</span>}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
