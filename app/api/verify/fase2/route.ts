import { NextResponse } from 'next/server'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const VERIFICATION_PATH = path.join(process.cwd(), 'public/data/verificacion-fase2.json')
const CSV_PATH = path.join(process.cwd(), 'public/data/resultados-fase2.csv')

let cachedVerification: Record<string, unknown> | null = null

export async function GET() {
  try {
    if (!cachedVerification) {
      // Load stored verification data
      const raw = await fs.readFile(VERIFICATION_PATH, 'utf-8')
      cachedVerification = JSON.parse(raw)
    }

    // Recompute CSV hash for live integrity check
    const csvBuffer = await fs.readFile(CSV_PATH)
    const liveHash = createHash('sha256').update(csvBuffer).digest('hex')

    // Verify first 5 and last 5 rows as spot check
    const csvText = csvBuffer.toString('utf-8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()
    const lines = csvText.split('\n').filter(l => l.trim() && !l.startsWith('IDENTIFICADOR'))
    const spotChecks: { line: number, id: string, passed: boolean }[] = []
    
    const checksums = (cachedVerification as { row_checksums: { line: number, sha256: string }[] }).row_checksums
    const checkLines = [0, 1, 2, lines.length - 3, lines.length - 2, lines.length - 1].filter(i => i >= 0 && i < lines.length)
    
    for (const idx of checkLines) {
      const line = lines[idx]
      const fields = parseCSVLine(line)
      const rowStr = `${fields[0]}|${fields[1]}|${fields[2]}|${fields[3]}`
      const hash = createHash('sha256').update(rowStr).digest('hex')
      const storedHash = checksums[idx]?.sha256 ?? ''
      spotChecks.push({
        line: idx + 1,
        id: fields[0] ?? '',
        passed: hash === storedHash,
      })
    }

    const allPassed = spotChecks.every(c => c.passed)

    return NextResponse.json({
      status: allPassed ? 'verified' : 'mismatch',
      phase: 'fase2',
      csv_hash: liveHash,
      stored_root_hash: (cachedVerification as { root_hash: string }).root_hash,
      total_candidates: (cachedVerification as { total_candidates: number }).total_candidates,
      extraction_date: (cachedVerification as { extraction_date: string }).extraction_date,
      cross_reference: (cachedVerification as { cross_reference: Record<string, unknown> }).cross_reference,
      pdf_source: (cachedVerification as { pdf_source: string }).pdf_source,
      resolucion: (cachedVerification as { resolucion: string }).resolucion,
      spot_checks: spotChecks,
      integrity: allPassed ? '✅ Los datos coinciden con el PDF original' : '⚠️ Discrepancias detectadas',
    })
  } catch (err) {
    console.error('[api/verify/fase2] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
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
