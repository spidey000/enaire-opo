"""
Direct fix: fetch original CSV, decode Windows-1252, parse properly with csv module,
write clean UTF-8 to the public directory.
"""
import urllib.request
import csv
import io

SOURCE_URL = (
    "https://blobs.vusercontent.net/blob/"
    "ANEXO%20I_LISTADO%20PROVISIONAL%20RESULTADOS%20FASE%201-"
    "I6EZLq6EYXcsqGn24vHSJ0Q8k0ua3n.csv"
)

OUT_PATH = "/vercel/share/v0-project/public/data/resultados-fase1.csv"

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

print(f"Fetching {SOURCE_URL}")
req = urllib.request.Request(SOURCE_URL, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req) as resp:
    raw = resp.read()

print(f"Downloaded {len(raw)} bytes")
text = raw.decode("windows-1252").replace("\r\n", "\n").replace("\r", "\n")
print(f"Decoded to {len(text)} chars")

reader = csv.reader(io.StringIO(text))
rows = []
header_done = False

for row in reader:
    if not row or all(c.strip() == "" for c in row):
        continue
    cleaned = [" ".join(c.split()) for c in row]
    if cleaned[0].upper() == "IDENTIFICADOR":
        if not header_done:
            rows.append(HEADER)
            header_done = True
        continue
    rows.append(cleaned)

print(f"Total rows (incl header): {len(rows)}")

import os
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerows(rows)

print(f"Written to {OUT_PATH}")
print("First 4 rows:")
for i, r in enumerate(rows[:4]):
    print(f"  {i}: {r}")

# Verify a row with ranking
ranked = [r for r in rows[1:] if len(r) >= 9 and r[8].strip().isdigit()]
print(f"Rows with ranking: {len(ranked)}")
if ranked:
    print(f"  Sample ranked: {ranked[0]}")

# Final file size
size = os.path.getsize(OUT_PATH)
print(f"Output file size: {size} bytes")
