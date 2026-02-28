import { Candidato } from './parseCSV'

export const MOCK_CANDIDATOS: Candidato[] = Array.from({ length: 100 }, (_, i) => {
  const idx = i + 1
  const conocimientos = Number((20 + ((idx * 7) % 31) + ((idx % 3) * 0.25)).toFixed(2))
  const ingles = Number((18 + ((idx * 5) % 29) + ((idx % 4) * 0.2)).toFixed(2))
  const aptitudes = Number((22 + ((idx * 9) % 27) + ((idx % 5) * 0.15)).toFixed(2))
  const totalFase1 = Number((conocimientos + ingles + aptitudes).toFixed(2))

  const estado: Candidato['estado'] = idx % 12 === 0
    ? 'NO PRESENTADO/A'
    : idx % 4 === 0
      ? 'NO APTO/A'
      : 'APTO/A'

  return {
    id: `TEST-${String(idx).padStart(4, '0')}`,
    nombre: `Candidato Prueba ${idx}`,
    conocimientosGenerales: estado === 'NO PRESENTADO/A' ? null : conocimientos,
    ingles: estado === 'NO PRESENTADO/A' ? null : ingles,
    aptitudes: estado === 'NO PRESENTADO/A' ? null : aptitudes,
    personalidad: estado === 'NO APTO/A' ? 'NO APTO/A' : 'APTO/A',
    totalFase1: estado === 'NO PRESENTADO/A' ? null : totalFase1,
    estado,
    ranking: estado === 'NO PRESENTADO/A' ? null : idx,
    rankingConocimientos: estado === 'NO PRESENTADO/A' ? null : Math.max(1, idx + ((idx * 3) % 20) - 10),
    rankingIngles: estado === 'NO PRESENTADO/A' ? null : Math.max(1, idx + ((idx * 5) % 25) - 12),
    rankingAptitud: estado === 'NO PRESENTADO/A' ? null : Math.max(1, idx + ((idx * 7) % 18) - 9),
  }
})
