/**
 * Fetches the original CSV from the source blob URL, decodes it as Windows-1252 / Latin-1,
 * then writes a clean UTF-8 version to public/data/resultados-fase1.csv
 */

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, '../public/data/resultados-fase1.csv')

const SOURCE_URL =
  'https://blobs.vusercontent.net/blob/ANEXO%20I_LISTADO%20PROVISIONAL%20RESULTADOS%20FASE%201-I6EZLq6EYXcsqGn24vHSJ0Q8k0ua3n.csv'

async function main() {
  console.log('[v0] Fetching original CSV from blob URL...')
  const res = await fetch(SOURCE_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching CSV`)

  const arrayBuffer = await res.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  console.log(`[v0] Downloaded ${bytes.length} bytes`)

  // Decode using Windows-1252 (superset of Latin-1 that covers the special chars in this file)
  const decoder = new TextDecoder('windows-1252')
  const raw = decoder.decode(bytes)
  console.log('[v0] Decoded as windows-1252')

  // The CSV has multiline quoted headers repeated many times (one per page from the original PDF export).
  // We need to:
  // 1. Re-join the multiline quoted header cells (e.g. "CONOCIMIENTOS\nGENERALES" → "CONOCIMIENTOS GENERALES")
  // 2. Keep only ONE header row at the top
  // 3. Remove all duplicate header rows
  // 4. Write clean UTF-8 CSV

  // First, collapse all CRLF to LF
  let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // The headers span 2 physical lines because of quoted newlines:
  //   "CONOCIMIENTOS\nGENERALES" and "CONOCIMIENTOS\nIDIOMA INGLÉS"
  // Collapse quoted multi-line fields: if a line starts inside a quote, merge with previous
  const physicalLines = text.split('\n')
  const logicalLines: string[] = []
  let buffer = ''
  let openQuotes = 0

  for (const line of physicalLines) {
    // Count unescaped quotes
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (line[i + 1] === '"') { i++; continue } // escaped quote
        openQuotes++
      }
    }
    if (buffer === '') {
      buffer = line
    } else {
      buffer += ' ' + line
    }
    if (openQuotes % 2 === 0) {
      logicalLines.push(buffer)
      buffer = ''
    }
  }
  if (buffer) logicalLines.push(buffer)

  // Normalise the canonical header (remove internal spaces from multiline collapse)
  const CANONICAL_HEADER =
    'IDENTIFICADOR,APELLIDOS Y NOMBRE,CONOCIMIENTOS GENERALES,CONOCIMIENTOS IDIOMA INGLÉS,APTITUDES,PERSONALIDAD,TOTAL FASE 1,ESTADO PROVISIONAL,ranking,ranking conocimientos,rank ingles,rank aptitud'

  // Identify header rows — they start with IDENTIFICADOR
  const HEADER_RE = /^IDENTIFICADOR/i

  let headerWritten = false
  const cleanLines: string[] = []

  for (const line of logicalLines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (HEADER_RE.test(trimmed)) {
      if (!headerWritten) {
        cleanLines.push(CANONICAL_HEADER)
        headerWritten = true
      }
      // skip all subsequent duplicate headers
      continue
    }

    cleanLines.push(trimmed)
  }

  const output = cleanLines.join('\n') + '\n'
  writeFileSync(OUT_PATH, output, 'utf-8')
  console.log(`[v0] Written ${cleanLines.length} lines (${output.length} chars) to ${OUT_PATH}`)

  // Quick sanity check: show first 5 data rows
  console.log('[v0] First 5 lines:')
  cleanLines.slice(0, 6).forEach((l, i) => console.log(`  [${i}] ${l.slice(0, 120)}`))
}

main().catch((e) => { console.error(e); process.exit(1) })
