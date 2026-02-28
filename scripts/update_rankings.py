#!/usr/bin/env python3
"""Recupera el CSV base desde git, corrige codificación y recalcula rankings."""

from __future__ import annotations

import csv
import io
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

OUTPUT_PATH = Path("public/data/resultados-fase1.csv")

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

VALID_STATES = {"APTO/A", "NO APTO/A", "NO PRESENTADO/A", "RENUNCIA"}


@dataclass
class CandidateRow:
    row: list[str]
    conocimientos: Optional[float]
    ingles: Optional[float]
    aptitudes: Optional[float]
    total: Optional[float]
    estado: str


def parse_score(value: str) -> Optional[float]:
    text = value.strip()
    if text in {"", "---", "NO APTO/A", "APTO/A"}:
        return None
    try:
        return float(text.replace(",", "."))
    except ValueError:
        return None


def format_rank(rank: Optional[int]) -> str:
    return "" if rank is None else str(rank)


def competition_ranking(items: list[CandidateRow], value_getter):
    scored = [(idx, value_getter(c)) for idx, c in enumerate(items)]
    scored = [(idx, score) for idx, score in scored if score is not None]
    scored.sort(key=lambda item: (-item[1], items[item[0]].row[0]))

    result: dict[int, int] = {}
    previous_score = None
    previous_rank = 0

    for position, (idx, score) in enumerate(scored, start=1):
        rank = previous_rank if previous_score is not None and score == previous_score else position
        result[idx] = rank
        previous_score = score
        previous_rank = rank

    return result


def load_source_text_from_root_commit() -> str:
    root_commit = subprocess.check_output(
        ["git", "rev-list", "--max-parents=0", "HEAD"], text=True
    ).strip()
    blob = subprocess.check_output(["git", "show", f"{root_commit}:public/data/resultados-fase1.csv"])
    return blob.decode("windows-1252").replace("\r\n", "\n").replace("\r", "\n")


def load_candidates() -> list[CandidateRow]:
    candidates: list[CandidateRow] = []
    raw_text = load_source_text_from_root_commit()

    for raw_row in csv.reader(io.StringIO(raw_text)):
        if not raw_row:
            continue

        row = [" ".join(cell.split()) for cell in raw_row]
        row += [""] * (12 - len(row))
        row = row[:12]

        if row[0].strip().upper() == "IDENTIFICADOR":
            continue

        estado = row[7].strip()
        if estado not in VALID_STATES:
            continue

        candidates.append(
            CandidateRow(
                row=row,
                conocimientos=parse_score(row[2]),
                ingles=parse_score(row[3]),
                aptitudes=parse_score(row[4]),
                total=parse_score(row[6]),
                estado=estado,
            )
        )

    return candidates


def update_rankings(candidates: list[CandidateRow]):
    aptos = [c for c in candidates if c.estado == "APTO/A" and c.total is not None]
    total_ranks = competition_ranking(aptos, lambda c: c.total)

    apto_indices = [idx for idx, c in enumerate(candidates) if c.estado == "APTO/A" and c.total is not None]
    total_rank_by_index = {global_idx: total_ranks[sub_idx] for sub_idx, global_idx in enumerate(apto_indices)}

    conocimientos_ranks = competition_ranking(candidates, lambda c: c.conocimientos)
    ingles_ranks = competition_ranking(candidates, lambda c: c.ingles)
    aptitudes_ranks = competition_ranking(candidates, lambda c: c.aptitudes)

    for idx, candidate in enumerate(candidates):
        candidate.row[8] = format_rank(total_rank_by_index.get(idx))
        candidate.row[9] = format_rank(conocimientos_ranks.get(idx))
        candidate.row[10] = format_rank(ingles_ranks.get(idx))
        candidate.row[11] = format_rank(aptitudes_ranks.get(idx))


def write_output(candidates: list[CandidateRow]):
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(HEADER)
        writer.writerows(candidate.row for candidate in candidates)


def main():
    candidates = load_candidates()
    update_rankings(candidates)
    write_output(candidates)
    print(f"CSV actualizado y saneado: {OUTPUT_PATH} ({len(candidates)} candidatos)")


if __name__ == "__main__":
    main()
