"""
Fetch the original CSV from the blob URL, decode from Windows-1252,
deduplicate repeated header rows, and write a clean UTF-8 file to
public/data/resultados-fase1-clean.csv
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

OUT_PATH = "/vercel/share/v0-project/public/data/resultados-fase1-clean.csv"

# Canonical header exactly as it will appear in the output file
HEADER = [
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

print(f"Fetching source CSV...")
req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req) as resp:
    raw = resp.read()

print(f"Downloaded {len(raw):,} bytes")

# Decode as Windows-1252 — this fixes all broken accents (tildes, Ñ, etc.)
text = raw.decode("windows-1252")
text = text.replace("\r\n", "\n").replace("\r", "\n")

reader = csv.reader(io.StringIO(text))
rows = [HEADER]
header_written = False

for row in reader:
    # Skip blank lines
    if not row or all(c.strip() == "" for c in row):
        continue

    # Normalize internal whitespace in every cell
    cleaned = [" ".join(c.split()) for c in row]

    # Skip any row that is a repeated header (first cell == IDENTIFICADOR)
    if cleaned[0].upper() == "IDENTIFICADOR":
        header_written = True
        continue

    # Skip rows that appeared before the first header block
    if not header_written:
        continue

    rows.append(cleaned)

print(f"Data rows parsed: {len(rows) - 1:,}")

# Write UTF-8 CSV
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerows(rows)

size = os.path.getsize(OUT_PATH)
print(f"Written: {OUT_PATH} ({size:,} bytes)")

# --- Verification ---
print("\n-- Header row --")
print(rows[0])

print("\n-- First 3 data rows --")
for r in rows[1:4]:
    print(r)

ranked = [r for r in rows[1:] if len(r) >= 9 and r[8].strip().isdigit()]
print(f"\nRows with RANKING value: {len(ranked):,}")
if ranked:
    print("Sample:", ranked[0])

# Check accented characters present
accented = [r for r in rows[1:] if any(c in " ".join(r) for c in "ÁÉÍÓÚáéíóúÑñÜü")]
print(f"Rows with accented characters: {len(accented):,}")
if accented:
    print("Sample:", accented[0])
