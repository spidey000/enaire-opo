import { NextResponse } from 'next/server'
import { parseCSV } from '@/lib/parseCSV'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const CSV_PATH = path.join(process.cwd(), 'public/data/resultados-fase1.csv')

// In-memory cache that survives warm lambda invocations
let cachedData: ReturnType<typeof parseCSV> | null = null

export async function GET() {
  try {
    if (!cachedData) {
      const raw = await fs.readFile(CSV_PATH, 'utf-8')
      cachedData = parseCSV(raw)
    }

    return NextResponse.json(cachedData)
  } catch (err) {
    console.error('[api/candidatos] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
