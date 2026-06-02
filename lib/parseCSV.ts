export interface Candidato {
  id: string
  nombre: string
  uid: string // id|nombre — única dentro de cada fase
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

export type ResultadoFase2 =
  | 'APTO/A'
  | 'NO APTO/A'
  | 'NO PRESENTADO/A'
  | 'EXCLUIDO/A (1)'
  | 'RENUNCIA'

export interface CandidatoFase2 {
  id: string
  nombre: string
  uid: string
  estado: ResultadoFase2
  puntuacion: number | null
  ranking: number
}

export interface CandidatoFase3 {
  id: string
  nombre: string
  uid: string
  resultado3a: ResultadoFase3 | null
  puntuacion3a: number | null
  ranking: number
  resultado3b: null // always null until phase 3b is published
  puntuacion3b: null
  resultado3c: null // always null until phase 3c is published
  puntuacion3c: null
}

export interface CandidatoGlobal {
  id: string
  nombre: string
  uid: string
  totalFase1: number | null
  rankingFase1: number | null
  puntuacionFase2: number | null
  rankingFase2: number | null
  puntuacionFase3a: number | null
  rankingFase3a: number | null
  puntuacionGlobal: number | null
  rankingGlobal: number
  evolF1aF2: number | null // positivo = mejoró (subió de ranking)
  evolF2aF3a: number | null
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

  const HEADER_PATTERN = /^"?IDENTIFICADOR/i

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (HEADER_PATTERN.test(trimmed)) continue

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

    const uid = id + '|' + nombre

    results.push({
      id,
      nombre,
      uid,
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

  const HEADER_PATTERN = /^"?IDENTIFICADOR/i

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

    const uid = id + '|' + nombre

    results.push({
      id,
      nombre,
      uid,
      resultado3a: resultado,
      puntuacion3a,
      ranking: 0,
      resultado3b: null,
      puntuacion3b: null,
      resultado3c: null,
      puntuacion3c: null,
    })
  }

  // Compute ranking sorted by score descending (ties broken by name)
  return results
    .sort((a, b) => (b.puntuacion3a ?? 0) - (a.puntuacion3a ?? 0) || a.nombre.localeCompare(b.nombre))
    .map((c, i) => ({ ...c, ranking: i + 1 }))
}

export function parseFase2CSV(raw: string): CandidatoFase2[] {
  const lines = raw.split('\n')
  const results: CandidatoFase2[] = []

  const HEADER_PATTERN = /^"?IDENTIFICADOR/i

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (HEADER_PATTERN.test(trimmed)) continue

    const fields = parseCSVLine(trimmed)
    if (fields.length < 4) continue

    const id = fields[0]?.trim() ?? ''
    const nombre = fields[1]?.trim().replace(/^"|"$/g, '') ?? ''

    if (!id || !nombre) continue

    const estado = mapResultadoFase2(fields[2]?.trim() ?? '')
    const puntuacionRaw = fields[3]?.trim() ?? ''
    const puntuacion = parseScore(puntuacionRaw)
    const uid = id + '|' + nombre

    results.push({ id, nombre, uid, estado, puntuacion, ranking: 0 })
  }

  // Compute ranking sorted by score descending (ties broken by name)
  return results
    .sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0) || a.nombre.localeCompare(b.nombre))
    .map((c, i) => ({ ...c, ranking: i + 1 }))
}

function mapResultadoFase2(raw: string): ResultadoFase2 {
  const trimmed = raw.trim().toUpperCase()
  if (trimmed === 'APTO/A') return 'APTO/A'
  if (trimmed === 'NO APTO/A') return 'NO APTO/A'
  if (trimmed === 'NO PRESENTADO/A') return 'NO PRESENTADO/A'
  if (trimmed.includes('EXCLUIDO')) return 'EXCLUIDO/A (1)'
  if (trimmed === 'RENUNCIA') return 'RENUNCIA'
  return 'NO APTO/A' // fallback
}

export function computeGlobalRanking(
  fase1: Candidato[],
  fase2: CandidatoFase2[],
  fase3a: CandidatoFase3[]
): CandidatoGlobal[] {
  const f1Map = new Map(fase1.map((c) => [c.id, c]))
  const f2Map = new Map(fase2.map((c) => [c.id, c]))

  // Cada fila APTO/A de F3A es un candidato del ranking global
  const aptos3a = fase3a.filter((c) => c.resultado3a === 'APTO/A')

  const raw: Omit<CandidatoGlobal, 'rankingGlobal' | 'evolF1aF2' | 'evolF2aF3a'>[] = aptos3a.map((c) => {
    const f1 = f1Map.get(c.id)
    const f2 = f2Map.get(c.id)
    const scores = [
      f1?.totalFase1 ?? null,
      f2?.puntuacion ?? null,
      c.puntuacion3a,
    ]
    const sum = scores.every((s) => s !== null)
      ? scores.reduce((a, b) => a! + b!, 0)
      : null
    return {
      uid: c.uid,
      id: c.id,
      nombre: c.nombre,
      totalFase1: f1?.totalFase1 ?? null,
      rankingFase1: f1?.ranking ?? null,
      puntuacionFase2: f2?.puntuacion ?? null,
      rankingFase2: f2?.ranking ?? null,
      puntuacionFase3a: c.puntuacion3a,
      rankingFase3a: c.ranking,
      puntuacionGlobal: sum,
    }
  })

  // Sort by global score desc, ties broken by name
  const sorted = raw.sort(
    (a, b) => (b.puntuacionGlobal ?? 0) - (a.puntuacionGlobal ?? 0) || a.nombre.localeCompare(b.nombre)
  )

  return sorted.map((c, i) => ({
    ...c,
    rankingGlobal: i + 1,
    evolF1aF2: c.rankingFase1 !== null && c.rankingFase2 !== null
      ? c.rankingFase1 - c.rankingFase2
      : null,
    evolF2aF3a: c.rankingFase2 !== null && c.rankingFase3a !== null
      ? c.rankingFase2 - c.rankingFase3a
      : null,
  }))
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
