import { NextResponse } from 'next/server'
import { parseFase3cCSV, type CandidatoFase3COnly } from '@/lib/parseCSV'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const CSV_PATH = path.join(process.cwd(), 'public/data/resultados-fase3c.csv')

let cachedData: CandidatoFase3COnly[] | null = null

const cleanCsv = (text: string) => text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()

const decodeCsvBuffer = (buffer: Buffer) => {
  const utf8 = buffer.toString('utf-8')
  if (utf8.includes('\uFFFD')) {
    return new TextDecoder('windows-1252').decode(buffer)
  }
  return utf8
}

export async function GET() {
  try {
    if (!cachedData) {
      const raw = await fs.readFile(CSV_PATH)
      const text = cleanCsv(decodeCsvBuffer(raw))
      cachedData = parseFase3cCSV(text)
    }

    return NextResponse.json(cachedData)
  } catch (err) {
    console.error('[api/candidatos/fase3c] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
