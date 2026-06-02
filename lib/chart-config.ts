'use client'

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
)

// ─── Colores ENAIRE ───────────────────────────────────────────────
export const PRIMARY = '#009FE3'
export const GRID_COLOR = '#e5e7eb'
export const TICK_COLOR = '#6b7280'

export const ESTADO_COLORS: Record<string, string> = {
  'APTO/A': '#16a34a',
  'NO APTO/A': '#dc2626',
  'NO PRESENTADO/A': '#d97706',
  'EXCLUIDO/A (1)': '#6b7280',
  'EXCLUIDO/A (2)': '#9ca3af',
  RENUNCIA: '#a855f7',
  'RENUNCIA (Incumplimiento base 3.1 c))': '#c084fc',
}

export const BAR_COLORS = [PRIMARY, '#16a34a', '#d97706']

// ─── Tooltip base ─────────────────────────────────────────────────
export const TOOLTIP_BG = '#ffffff'
export const TOOLTIP_BORDER = '#e5e7eb'
export const TOOLTIP_SHADOW = '0 2px 8px rgba(0,0,0,0.08)'

// ─── Helpers ──────────────────────────────────────────────────────
export function avg(values: (number | null)[]) {
  const valid = values.filter((v): v is number => v !== null)
  if (!valid.length) return 0
  return Number((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2))
}
