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

export type ResultadoFase3 =
  | 'APTO/A'
  | 'NO APTO/A'
  | 'NO PRESENTADO/A'
  | 'EXCLUIDO/A (1)'
  | 'EXCLUIDO/A (2)'
  | 'RENUNCIA'
  | 'RENUNCIA (Incumplimiento base 3.1 c))'

export interface CandidatoFase3 {
  id: string
  nombre: string
  resultado3a: ResultadoFase3 | null
  puntuacion3a: number | null
  resultado3b: null // always null until phase 3b is published
  puntuacion3b: null
  resultado3c: null // always null until phase 3c is published
  puntuacion3c: null
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

export function parseFase3aCSV(raw: string): CandidatoFase3[] {
  const lines = raw.split('\n')
  const results: CandidatoFase3[] = []

  const HEADER_PATTERN = /^IDENTIFICADOR/i

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (HEADER_PATTERN.test(trimmed)) continue

    const fields = parseCSVLine(trimmed)
    if (fields.length < 4) continue

    const id = fields[0]?.trim() ?? ''
    const nombre = fields[1]?.trim().replace(/^"|"$/g, '') ?? ''

    if (!id || !nombre) continue

    const resultadoRaw = fields[2]?.trim() ?? ''
    const puntuacionRaw = fields[3]?.trim() ?? ''

    // Map CSV result values to ResultadoFase3 union
    const resultado: ResultadoFase3 | null = mapResultadoFase3(resultadoRaw)
    const puntuacion3a = parseScore(puntuacionRaw)

    results.push({
      id,
      nombre,
      resultado3a: resultado,
      puntuacion3a,
      resultado3b: null,
      puntuacion3b: null,
      resultado3c: null,
      puntuacion3c: null,
    })
  }

  return results
}

function mapResultadoFase3(raw: string): ResultadoFase3 | null {
  if (!raw || raw === '') return null
  const trimmed = raw.trim().toUpperCase()
  if (trimmed === 'APTO/A') return 'APTO/A'
  if (trimmed === 'NO APTO/A') return 'NO APTO/A'
  if (trimmed === 'NO PRESENTADO/A') return 'NO PRESENTADO/A'
  if (trimmed === 'EXCLUIDO/A (1)') return 'EXCLUIDO/A (1)'
  if (trimmed === 'EXCLUIDO/A (2)') return 'EXCLUIDO/A (2)'
  if (trimmed === 'RENUNCIA') return 'RENUNCIA'
  if (trimmed === 'RENUNCIA (INCUMPLIMIENTO BASE 3.1 C))') return 'RENUNCIA (Incumplimiento base 3.1 c))'
  return null
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
