'use client'

import { useMemo } from 'react'
import { Candidato } from '@/lib/parseCSV'
import { Filters } from './FilterSidebar'

interface Props {
  data: Candidato[]
  filters: Filters
}

export function AprobadosTable({ data, filters }: Props) {
  const filtered = useMemo(() => {
    const search = filters.search.toLowerCase().trim()
    return data.filter((c) => {
      if (search && !c.nombre.toLowerCase().includes(search) && !c.id.toLowerCase().includes(search)) {
        return false
      }
      if (filters.estado.length > 0 && !filters.estado.includes(c.estado)) return false
      if (c.totalFase1 !== null) {
        if (c.totalFase1 < filters.totalMin || c.totalFase1 > filters.totalMax) return false
      } else if (filters.totalMin > 0 || filters.totalMax < 150) {
        return false
      }
      return c.estado === 'APTO/A'
    })
  }, [data, filters])

  return (
    <div className="bg-card border border-border rounded-sm shadow-sm overflow-hidden w-full">
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Visualización simplificada de <span className="font-bold text-emerald-600">aprobados</span>
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {filtered.length.toLocaleString('es-ES')} candidatos APTO/A
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-xs">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border shadow-[0_1px_0_0_theme(colors.border)]">
              <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-right">Rank.</th>
              <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-left">Identificador</th>
              <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-left">Nombre y apellidos</th>
              <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-right">Rank conocimientos</th>
              <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-right">Rank inglés</th>
              <th className="px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-right">Rank aptitudes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((c, i) => (
              <tr key={`${c.id}-${i}`} className="hover:bg-primary/5 transition-colors">
                <td className="px-3 py-2.5 font-mono text-right font-semibold text-primary">{c.ranking ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">{c.id}</td>
                <td className="px-3 py-2.5 font-medium text-foreground min-w-[260px]">{c.nombre}</td>
                <td className="px-3 py-2.5 font-mono text-right">{c.rankingConocimientos ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-right">{c.rankingIngles ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-right">{c.rankingAptitud ?? '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No hay candidatos APTO/A con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
