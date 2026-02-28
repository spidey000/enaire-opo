"""
Fetches the original CSV from the blob URL, decodes it as Windows-1252,
joins multiline quoted cells, deduplicates header rows, and writes a
clean UTF-8 CSV with a corrected canonical header row.
"""

import urllib.request
import csv
import io
import os

SOURCE_URL = (
    "https://blobs.vusercontent.net/blob/"
    "ANEXO%20I_LISTADO%20PROVISIONAL%20RESULTADOS%20FASE%201-"
    "I6EZLq6EYXcsqGn24vHSJ0Q8k0ua3n.csv"
)

OUT_PATH = "/vercel/share/v0-project/public/data/resultados-fase1.csv"

# Canonical header matching the 12 columns in the CSV
CANONICAL_HEADER = [
    "IDENTIFICADOR",
    "APELLIDOS Y NOMBRE",
    "CONOCIMIENTOS GENERALES",
    "CONOCIMIENTOS IDIOMA INGLÉS",
    "APTITUDES",
    "PERSONALIDAD",
    "TOTAL FASE 1",
    "ESTADO PROVISIONAL",
    "RANKING",
    "RANKING CONOCIMIENTOS",
    "RANKING INGLÉS",
    "RANKING APTITUD",
]


def main():
    print(f"[v0] Fetching CSV from blob URL...")
    with urllib.request.urlopen(SOURCE_URL) as resp:
        raw_bytes = resp.read()
    print(f"[v0] Downloaded {len(raw_bytes):,} bytes")

    # Decode as Windows-1252 — the encoding of the original PDF-exported CSV
    raw_text = raw_bytes.decode("windows-1252")
    raw_text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    print(f"[v0] Decoded. Total chars: {len(raw_text):,}")

    # Use Python's csv reader — it handles quoted multiline fields automatically
    reader = csv.reader(io.StringIO(raw_text))

    out_rows = []
    header_written = False
    data_count = 0

    for row in reader:
        if not row or all(c.strip() == "" for c in row):
            continue

        # Normalise each cell: strip whitespace, collapse internal newlines/spaces
        row = [" ".join(c.split()) for c in row]

        # Detect header rows: first cell is IDENTIFICADOR (case-insensitive)
        if row[0].upper().strip() == "IDENTIFICADOR":
            if not header_written:
                out_rows.append(CANONICAL_HEADER)
                header_written = True
            continue  # skip all duplicate headers

        out_rows.append(row)
        data_count += 1

    print(f"[v0] Parsed {data_count:,} data rows + 1 header")

    # Write clean UTF-8 CSV
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        writer.writerows(out_rows)

    print(f"[v0] Written to {OUT_PATH}")

    # Sanity check
    print("[v0] First 6 rows:")
    for i, row in enumerate(out_rows[:6]):
        print(f"  [{i}] {row}")

    # Check a row with ranking data
    with_ranking = [r for r in out_rows[1:] if len(r) >= 9 and r[8].strip().isdigit()]
    print(f"[v0] Rows with ranking data: {len(with_ranking):,}")
    if with_ranking:
        print(f"  Sample: {with_ranking[0]}")


if __name__ == "__main__":
    main()
