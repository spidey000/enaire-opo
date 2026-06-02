'use client'

export interface ScoreBucket {
  rangeLabel: string
  count: number
  percentage: string
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
