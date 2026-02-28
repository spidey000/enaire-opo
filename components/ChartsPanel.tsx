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
  LineChart,
  Line,
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
  return valid.reduce((a, b) => a + b, 0) / valid.length
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

function StatTable({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <div className="bg-card border border-border rounded-sm p-4 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[320px]">
          <tbody className="divide-y divide-border/60">
            {rows.map((row) => (
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
      buckets[String(bucket)] = (buckets[String(bucket)] ?? 0) + 1
    }
    return Object.entries(buckets)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([name, count]) => ({ name, count }))
  }, [data])

  const scoresByCategory = useMemo(() => {
    const aptosData = data.filter((c) => c.estado === 'APTO/A')
    return [
      { name: 'Con. Generales', media: Number(avg(aptosData.map((c) => c.conocimientosGenerales)).toFixed(2)) },
      { name: 'Inglés', media: Number(avg(aptosData.map((c) => c.ingles)).toFixed(2)) },
      { name: 'Aptitudes', media: Number(avg(aptosData.map((c) => c.aptitudes)).toFixed(2)) },
    ]
  }, [data])

  const scatterData = useMemo(() => {
    return data
      .filter((c) => c.conocimientosGenerales !== null && c.aptitudes !== null)
      .map((c) => ({ x: c.conocimientosGenerales!, y: c.aptitudes!, estado: c.estado }))
  }, [data])

  const bizarreLineData = useMemo(() => {
    const sorted = data
      .filter((c) => c.ranking !== null && c.ingles !== null && c.aptitudes !== null)
      .sort((a, b) => (a.ranking! - b.ranking!))
      .slice(0, 120)

    return sorted.map((c) => ({
      rank: c.ranking,
      pulso: Number((c.ingles! * c.aptitudes! / 10).toFixed(2)),
      equilibrio: Number(((c.ingles! - c.aptitudes!) * -1).toFixed(2)),
    }))
  }, [data])

  const quirkyScatter = useMemo(() => {
    return data
      .filter((c) => c.totalFase1 !== null && c.ranking !== null)
      .map((c) => ({
        x: Number((c.totalFase1! / (c.ranking! || 1)).toFixed(3)),
        y: Number((((c.rankingConocimientos ?? 0) + (c.rankingIngles ?? 0) + (c.rankingAptitud ?? 0)) / 3).toFixed(2)),
        estado: c.estado,
      }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  }, [data])

  const scatterDomain = useMemo(() => {
    if (!scatterData.length) return { x: [0, 10], y: [0, 10] }
    const xs = scatterData.map((d) => d.x)
    const ys = scatterData.map((d) => d.y)
    return {
      x: [Math.max(0, Math.min(...xs) - 2), Math.max(...xs) + 2],
      y: [Math.max(0, Math.min(...ys) - 2), Math.max(...ys) + 2],
    }
  }, [scatterData])

  const commonStats = useMemo(() => {
    const aptos = data.filter((c) => c.estado === 'APTO/A').length
    const noAptos = data.filter((c) => c.estado === 'NO APTO/A').length
    const presentados = data.filter((c) => c.estado !== 'NO PRESENTADO/A').length
    return [
      { label: 'Total de candidatos', value: data.length.toLocaleString('es-ES') },
      { label: 'Aprobados (APTO/A)', value: aptos.toLocaleString('es-ES') },
      { label: 'No aptos', value: noAptos.toLocaleString('es-ES') },
      { label: 'Tasa de presentación', value: `${((presentados / Math.max(data.length, 1)) * 100).toFixed(2)}%` },
      { label: 'Media total F1', value: avg(data.map((c) => c.totalFase1)).toFixed(2) },
    ]
  }, [data])

  const uncommonStats = useMemo(() => {
    const bothHigh = data.filter((c) => (c.ingles ?? 0) >= 40 && (c.aptitudes ?? 0) >= 40).length
    const gap = data
      .filter((c) => c.conocimientosGenerales !== null && c.ingles !== null)
      .map((c) => Math.abs(c.conocimientosGenerales! - c.ingles!))
    return [
      { label: 'Top 10% por ranking con inglés > 35', value: data.filter((c) => (c.ranking ?? 999999) <= Math.max(1, Math.floor(data.length * 0.1)) && (c.ingles ?? 0) > 35).length.toString() },
      { label: 'Con inglés y aptitudes muy altas (>=40)', value: bothHigh.toLocaleString('es-ES') },
      { label: 'Brecha media Conocimientos vs Inglés', value: `${avg(gap.map((n) => n)).toFixed(2)} pts` },
      { label: 'Mediana aproximada total F1', value: `${distributionData[Math.floor(distributionData.length / 2)]?.name ?? '—'} pts` },
    ]
  }, [data, distributionData])

  const funStats = useMemo(() => {
    const turbo = data.filter((c) => (c.rankingAptitud ?? 99999) < (c.rankingIngles ?? 99999)).length
    const zen = data.filter((c) => c.ingles !== null && c.aptitudes !== null && Math.abs(c.ingles - c.aptitudes) <= 1).length
    return [
      { label: '"Turbo mental" (aptitudes > inglés en ranking)', value: turbo.toLocaleString('es-ES') },
      { label: '"Perfil zen" (inglés y aptitudes casi iguales)', value: zen.toLocaleString('es-ES') },
      { label: 'Índice caótico (media rank tríada / total candidatos)', value: `${(avg(data.map((c) => ((c.rankingConocimientos ?? 0) + (c.rankingIngles ?? 0) + (c.rankingAptitud ?? 0)) / 3)) / Math.max(1, data.length)).toFixed(4)}` },
      { label: 'Puntuación "cohete" media (inglés*aptitudes/10)', value: avg(data.map((c) => c.ingles !== null && c.aptitudes !== null ? (c.ingles * c.aptitudes) / 10 : null)).toFixed(2) },
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
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString('es-ES'), 'Candidatos']} />
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
                {scoresByCategory.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Conocimientos vs. Aptitudes" sub="Todos los candidatos con puntuación en ambas pruebas">
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis type="number" dataKey="x" tick={TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} domain={scatterDomain.x} />
              <YAxis type="number" dataKey="y" tick={TICK} tickLine={false} axisLine={false} domain={scatterDomain.y} />
              <Tooltip {...TOOLTIP_STYLE} />
              {['APTO/A', 'NO APTO/A', 'NO PRESENTADO/A'].map((estado) => (
                <Scatter key={estado} name={estado} data={scatterData.filter((d) => d.estado === estado)} fill={ESTADO_COLORS[estado]} opacity={0.55} r={2.5} />
              ))}
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Relación estrambótica: Pulso vs Equilibrio" sub="Ranking bajo con señales de rendimiento cruzado">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={bizarreLineData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="rank" tick={TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend iconType="plainline" iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey="pulso" stroke="#7c3aed" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="equilibrio" stroke="#f97316" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Relación estrambótica: Eficiencia vs Rango medio" sub="Total/ranking contra media de ranking por materia">
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis type="number" dataKey="x" name="Eficiencia" tick={TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis type="number" dataKey="y" name="Rango medio" tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              {['APTO/A', 'NO APTO/A'].map((estado) => (
                <Scatter key={estado} name={estado} data={quirkyScatter.filter((d) => d.estado === estado)} fill={ESTADO_COLORS[estado]} opacity={0.5} r={2.2} />
              ))}
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatTable title="Estadísticas comunes" rows={commonStats} />
        <StatTable title="Estadísticas menos comunes" rows={uncommonStats} />
        <StatTable title="Estadísticas divertidas" rows={funStats} />
      </div>
    </div>
  )
}
