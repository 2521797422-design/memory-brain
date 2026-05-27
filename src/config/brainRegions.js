/**
 * Normalized positions in brain bounds (0–1).
 * +Y superior (stem down), +Z anterior, +X patient right. Entry camera sits on −X (left-front).
 */
export const BRAIN_REGIONS = [
  {
    id: 'emotion',
    label: 'emotion',
    normalized: [0.28, 0.38, 0.58],
    scale: [0.28, 0.32, 0.28],
    color: '#e8c4d4',
    hint: 'where feeling gathers',
  },
  {
    id: 'vision',
    label: 'vision',
    normalized: [0.5, 0.5, 0.14],
    scale: [0.32, 0.34, 0.26],
    color: '#c8d4e8',
    hint: 'images becoming memory',
  },
  {
    id: 'hearing',
    label: 'hearing',
    normalized: [0.74, 0.42, 0.48],
    scale: [0.24, 0.3, 0.28],
    color: '#d4c8e8',
    hint: 'echoes that stay',
  },
  {
    id: 'memory',
    label: 'memory',
    normalized: [0.42, 0.4, 0.62],
    scale: [0.26, 0.28, 0.26],
    color: '#e0d4f0',
    hint: 'the quiet archive',
  },
  {
    id: 'decision',
    label: 'decision',
    normalized: [0.5, 0.68, 0.55],
    scale: [0.3, 0.28, 0.3],
    color: '#c4cce8',
    hint: 'paths chosen in light',
  },
]
