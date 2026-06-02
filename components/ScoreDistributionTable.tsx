'use client'

interface ScoreBucket {
  rangeLabel: string
  count: number
  percentage: string
}

interface Props {
  title: string
  buckets: ScoreBucket[]
  total: number
}

export function ScoreDistributionTable({ title, buckets, total }: Props) {
  if (!buckets.length) return null

  return (
    <div className="bg-card border border-border rounded-sm p-4 shadow-sm overflow-x-auto">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h4>
      <table className="w-full min-w-[320px] text-xs">
        <thead>
          <tr className="border-b border-border/60">
            <th className="py-2 pr-3 text-left font-semibold text-muted-foreground uppercase tracking-wider">Tramo</th>
            <th className="py-2 pr-3 text-right font-semibold text-muted-foreground uppercase tracking-wider">Candidatos</th>
            <th className="py-2 text-right font-semibold text-muted-foreground uppercase tracking-wider">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {buckets.map((b) => (
            <tr key={b.rangeLabel} className="hover:bg-muted/30 transition-colors">
              <td className="py-1.5 pr-3 font-mono text-foreground font-medium">{b.rangeLabel}</td>
              <td className="py-1.5 pr-3 text-right font-mono text-foreground">{b.count.toLocaleString('es-ES')}</td>
              <td className="py-1.5 text-right font-mono text-muted-foreground">{b.percentage}%</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-semibold">
            <td className="py-2 pr-3 text-foreground">Total</td>
            <td className="py-2 pr-3 text-right font-mono text-foreground">{total.toLocaleString('es-ES')}</td>
            <td className="py-2 text-right font-mono text-muted-foreground">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/**
 * Build score buckets from an array of scores.
 * @param scores - array of numeric scores
 * @param step - bucket size (default 5)
 * @param min - minimum score for first bucket (default 0)
 * @returns buckets with range labels, counts, and percentages
 */
export function buildScoreBuckets(
  scores: number[],
  step: number = 5,
  min: number = 0
): { buckets: ScoreBucket[]; total: number } {
  if (!scores.length) return { buckets: [], total: 0 }

  const max = Math.max(...scores)
  const bucketCounts: Record<string, number> = {}

  for (const s of scores) {
    const floor = Math.floor((s - min) / step) * step + min
    const start = floor
    const end = floor + step - 1
    const label = `${start}–${end}`
    bucketCounts[label] = (bucketCounts[label] ?? 0) + 1
  }

  const total = scores.length
  const sortedLabels = Object.keys(bucketCounts).sort((a, b) => {
    const aStart = parseInt(a.split('–')[0], 10)
    const bStart = parseInt(b.split('–')[0], 10)
    return aStart - bStart
  })

  const buckets: ScoreBucket[] = sortedLabels.map((label) => ({
    rangeLabel: label,
    count: bucketCounts[label],
    percentage: ((bucketCounts[label] / total) * 100).toFixed(1),
  }))

  return { buckets, total }
}

/**
 * Build a fine-grained histogram (step=1) for the "sin agrupar" bar chart.
 */
export function buildUngroupedHistogram(
  scores: number[],
  min: number = 0
): { score: string; count: number }[] {
  if (!scores.length) return []

  const counts: Record<string, number> = {}
  for (const s of scores) {
    const key = Math.floor(s).toString()
    counts[key] = (counts[key] ?? 0) + 1
  }

  return Object.entries(counts)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([score, count]) => ({ score, count }))
}
