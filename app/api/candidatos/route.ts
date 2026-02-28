import { NextResponse } from 'next/server'
import { parseCSV } from '@/lib/parseCSV'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const CSV_PATH = path.join(process.cwd(), 'public/data/resultados-fase1.csv')
const CSV_URL =
  'https://blobs.vusercontent.net/blob/ANEXO%20I_LISTADO%20PROVISIONAL%20RESULTADOS%20FASE%201-I6EZLq6EYXcsqGn24vHSJ0Q8k0ua3n.csv'

// In-memory cache that survives warm lambda invocations
let cachedData: ReturnType<typeof parseCSV> | null = null

const containsMojibake = (text: string) => text.includes('ï¿½') || text.includes('�')

const readCsv = async () => {
  const localCsv = await fs.readFile(CSV_PATH, 'utf-8')

  if (!containsMojibake(localCsv)) return localCsv

  const res = await fetch(CSV_URL, { next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`)

  const buffer = await res.arrayBuffer()
  const decoder = new TextDecoder('windows-1252')
  return decoder.decode(buffer)
}

export async function GET() {
  try {
    if (!cachedData) {
      const raw = await readCsv()
      cachedData = parseCSV(raw)
    }

    return NextResponse.json(cachedData)
  } catch (err) {
    console.error('[api/candidatos] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
