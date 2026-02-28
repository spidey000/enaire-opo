import { NextResponse } from 'next/server'
import { parseCSV } from '@/lib/parseCSV'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const CSV_PATH = path.join(process.cwd(), 'public/data/resultados-fase1.csv')

// In-memory cache that survives warm lambda invocations
let cachedData: ReturnType<typeof parseCSV> | null = null

const cleanCsv = (text: string) => text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()

const repairKnownMojibake = (text: string) =>
  text
    // Frequent reversible mojibake patterns (if present)
    .replaceAll('Ã¡', 'á')
    .replaceAll('Ã©', 'é')
    .replaceAll('Ã­', 'í')
    .replaceAll('Ã³', 'ó')
    .replaceAll('Ãº', 'ú')
    .replaceAll('Ã', 'Á')
    .replaceAll('Ã‰', 'É')
    .replaceAll('Ã', 'Í')
    .replaceAll('Ã“', 'Ó')
    .replaceAll('Ãš', 'Ú')
    .replaceAll('Ã±', 'ñ')
    .replaceAll('Ã‘', 'Ñ')

const loadCsv = async () => {
  const raw = await fs.readFile(CSV_PATH, 'utf-8')
  return repairKnownMojibake(cleanCsv(raw))
}

export async function GET() {
  try {
    if (!cachedData) {
      const raw = await loadCsv()
      cachedData = parseCSV(raw)
    }

    return NextResponse.json(cachedData)
  } catch (err) {
    console.error('[api/candidatos] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
