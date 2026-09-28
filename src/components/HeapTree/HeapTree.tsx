import { parentOf } from '../../algorithms/sorting/heapSort'

export interface HeapTreeProps {
  /** Current array contents (heap layout is implicit in the indices). */
  values: readonly number[]
  /** Live heap size: indices [0, heapSize) are in the heap. */
  heapSize: number
  /** Current parent index being sifted, or null. */
  parent: number | null
  /** Current child index being compared, or null. */
  child: number | null
  /** Current largest-candidate index, or null. */
  largest: number | null
}

const NODE_R = 18
const LEVEL_H = 64
const TEXT = '#1e293b'

const FILL_BASE = '#93b4f8'
const FILL_COMPARE = '#2563eb'
const FILL_SELECTED = '#7c3aed'
const FILL_EXTRACTED = '#10b981'

/**
 * Binary-tree representation of the SAME heap state the array view
 * renders. Node positions follow the implicit index math (children at
 * 2i+1 / 2i+2), so the two views cannot drift apart: both are pure
 * functions of one state snapshot. Pure presentation — no engine logic.
 */
export function HeapTree({
  values,
  heapSize,
  parent,
  child,
  largest,
}: HeapTreeProps) {
  const n = Math.min(values.length, Math.max(heapSize, 1))
  const depth = Math.ceil(Math.log2(n + 1))
  const width = Math.max(2 ** (depth - 1), 1) * (NODE_R * 4)
  const height = depth * LEVEL_H + NODE_R * 2

  const position = (index: number): { x: number; y: number } => {
    const level = Math.floor(Math.log2(index + 1))
    const posInLevel = index + 1 - 2 ** level
    const slots = 2 ** level
    return {
      x: ((posInLevel + 0.5) / slots) * width,
      y: level * LEVEL_H + NODE_R + 4,
    }
  }

  const fillFor = (index: number): string => {
    if (index >= heapSize) {
      return FILL_EXTRACTED
    }
    if (index === parent || index === child) {
      return FILL_COMPARE
    }
    if (index === largest) {
      return FILL_SELECTED
    }
    return FILL_BASE
  }

  const edges: { from: number; to: number }[] = []
  for (let index = 1; index < n; index += 1) {
    const p = parentOf(index)
    if (p >= 0) {
      edges.push({ from: p, to: index })
    }
  }

  return (
    <svg
      data-testid="heap-tree"
      role="img"
      aria-label={`Heap tree with ${n} live nodes`}
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: 560, height: 'auto' }}
    >
      {edges.map(({ from, to }) => {
        const a = position(from)
        const b = position(to)
        return (
          <line
            key={`${from}-${to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#cbd5e1"
            strokeWidth={2}
          />
        )
      })}
      {Array.from({ length: n }, (_, index) => {
        const { x, y } = position(index)
        return (
          <g key={index}>
            <circle
              data-testid={`heap-node-${index}`}
              cx={x}
              cy={y}
              r={NODE_R}
              fill={fillFor(index)}
            />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fill={TEXT}>
              {values[index]}
            </text>
            <text
              x={x}
              y={y + NODE_R + 12}
              textAnchor="middle"
              fontSize={9}
              fill="#94a3b8"
            >
              {index}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
