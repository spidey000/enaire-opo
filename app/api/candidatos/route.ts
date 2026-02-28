import { NextResponse } from 'next/server'
import { parseCSV } from '@/lib/parseCSV'

const CSV_URL =
  'https://blobs.vusercontent.net/blob/ANEXO%20I_LISTADO%20PROVISIONAL%20RESULTADOS%20FASE%201-I6EZLq6EYXcsqGn24vHSJ0Q8k0ua3n.csv'

// In-memory cache that survives warm lambda invocations
let cachedData: ReturnType<typeof parseCSV> | null = null

export async function GET() {
  try {
    if (!cachedData) {
      // Fetch the original CSV and decode as latin1/windows-1252 via the byte-level trick:
      // fetch gives us ArrayBuffer, we decode manually so accented chars are preserved.
      const res = await fetch(CSV_URL, { next: { revalidate: 86400 } })
      if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`)

      const buffer = await res.arrayBuffer()
      // Decode as windows-1252 (latin1) — this is what the original file uses
      const decoder = new TextDecoder('windows-1252')
      const raw = decoder.decode(buffer)

      cachedData = parseCSV(raw)
    }

    return NextResponse.json(cachedData)
  } catch (err) {
    console.error('[api/candidatos] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
