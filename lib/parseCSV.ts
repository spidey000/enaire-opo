export interface Candidato {
  id: string
  nombre: string
  conocimientosGenerales: number | null
  ingles: number | null
  aptitudes: number | null
  personalidad: string // APTO/A or NO APTO/A
  totalFase1: number | null
  estado: string // APTO/A, NO APTO/A, NO PRESENTADO/A
  ranking: number | null
  rankingConocimientos: number | null
  rankingIngles: number | null
  rankingAptitud: number | null
}

function parseScore(val: string): number | null {
  if (!val || val.trim() === '' || val.trim() === '---' || val.trim() === 'NO APTO/A' || val.trim() === 'APTO/A') return null
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? null : n
}

function parseRank(val: string): number | null {
  if (!val || val.trim() === '') return null
  const n = parseInt(val.trim(), 10)
  return isNaN(n) ? null : n
}

export function parseCSV(raw: string): Candidato[] {
  const lines = raw.split('\n')
  const results: Candidato[] = []

  const HEADER_PATTERN = /^IDENTIFICADOR/i

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (HEADER_PATTERN.test(trimmed)) continue

    // Parse CSV line respecting quoted fields
    const fields = parseCSVLine(trimmed)
    if (fields.length < 8) continue

    const id = fields[0]?.trim() ?? ''
    const nombre = fields[1]?.trim().replace(/^"|"$/g, '') ?? ''

    // Skip empty rows or rows that don't look like data
    if (!id || !nombre || id === 'IDENTIFICADOR') continue

    const conocimientosGenerales = parseScore(fields[2]?.trim() ?? '')
    const ingles = parseScore(fields[3]?.trim() ?? '')
    const aptitudes = parseScore(fields[4]?.trim() ?? '')
    const personalidad = fields[5]?.trim() ?? ''
    const totalRaw = fields[6]?.trim() ?? ''
    const totalFase1 = parseScore(totalRaw)
    const estado = fields[7]?.trim() ?? ''
    const ranking = parseRank(fields[8]?.trim() ?? '')
    const rankingConocimientos = parseRank(fields[9]?.trim() ?? '')
    const rankingIngles = parseRank(fields[10]?.trim() ?? '')
    const rankingAptitud = parseRank(fields[11]?.trim() ?? '')

    results.push({
      id,
      nombre,
      conocimientosGenerales,
      ingles,
      aptitudes,
      personalidad,
      totalFase1,
      estado,
      ranking,
      rankingConocimientos,
      rankingIngles,
      rankingAptitud,
    })
  }

  return results
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}
