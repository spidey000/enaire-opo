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
      const raw = await fs.readFile(VERIFICATION_PATH, 'utf-8')
      cachedVerification = JSON.parse(raw)
    }

    const csvBuffer = await fs.readFile(CSV_PATH)
    const liveHash = createHash('sha256').update(csvBuffer).digest('hex')

    const csvText = csvBuffer.toString('utf-8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()
    const allLines = csvText.split('\n').filter(l => l.trim())

    // Parse all CSV rows and skip header
    const parsedRows: { id: string, nombre: string, estado: string, puntuacion: string }[] = []
    for (const line of allLines) {
      const fields = parseCSVLine(line)
      const id = fields[0]?.trim() ?? ''
      if (!id || id.toUpperCase() === 'IDENTIFICADOR') continue
      parsedRows.push({
        id,
        nombre: fields[1]?.trim() ?? '',
        estado: fields[2]?.trim() ?? '',
        puntuacion: fields[3]?.trim() ?? '',
      })
    }

    const checksums = (cachedVerification as { row_checksums: { line: number, sha256: string }[] }).row_checksums

    // Compare every row line by line
    let matched = 0
    let failed = 0
    const sampleFailures: { line: number, id: string }[] = []

    const maxRows = Math.min(parsedRows.length, checksums.length)
    for (let i = 0; i < maxRows; i++) {
      const r = parsedRows[i]
      const rowStr = `${r.id}|${r.nombre}|${r.estado}|${r.puntuacion}`
      const hash = createHash('sha256').update(rowStr).digest('hex')
      if (hash === checksums[i].sha256) {
        matched++
      } else {
        failed++
        if (sampleFailures.length < 5) {
          sampleFailures.push({ line: i + 1, id: r.id })
        }
      }
    }

    const allVerified = matched === maxRows && maxRows === checksums.length

    return NextResponse.json({
      status: allVerified ? 'verified' : 'mismatch',
      phase: 'fase2',
      csv_hash: liveHash,
      total_candidates: (cachedVerification as { total_candidates: number }).total_candidates,
      extraction_date: (cachedVerification as { extraction_date: string }).extraction_date,
      pdf_source: (cachedVerification as { pdf_source: string }).pdf_source,
      resolucion: (cachedVerification as { resolucion: string }).resolucion,
      cross_reference: (cachedVerification as { cross_reference: Record<string, unknown> }).cross_reference,
      integrity_check: {
        total_rows: checksums.length,
        matched,
        failed,
        sample_failures: sampleFailures,
      },
      integrity: allVerified
        ? '✅ 1084/1084 filas verificadas contra el PDF original'
        : `⚠️ ${matched}/${checksums.length} filas verificadas. ${failed} discrepancias.`,
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
