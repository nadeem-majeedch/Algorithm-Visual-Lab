import type { Highlight } from '../../engine'

export interface ArrayVisualizerProps {
  /** Current array contents for this step. */
  values: readonly number[]
  /** Engine highlights for this step (compare/swap/selected/sorted/...). */
  highlights: readonly Highlight[]
  /** First index of a guaranteed-sorted suffix (bubble, selection). */
  sortedFrom?: number
  /** Exclusive end of a guaranteed-sorted prefix (insertion). */
  sortedTo?: number
  /** Temporary merge buffer to render under the array. */
  buffer?: { targetStart: number; values: readonly (number | null)[] } | null
}

const BAR_WIDTH = 40
const BAR_GAP = 8
const CHART_HEIGHT = 220
const LABEL_SPACE = 26
const BUFFER_CELL = 26

const FILL_BASE = '#93b4f8'
const FILL_COMPARE = '#2563eb'
const FILL_SWAP = '#d97706'
const FILL_SELECTED = '#7c3aed'
const FILL_BOUNDARY = '#334155'
const FILL_SORTED = '#10b981'
const FILL_VISITED = '#e2e8f0'
const TEXT_MUTED = '#64748b'

/** Per-index fill precedence: swap > compare > selected > sorted > base. */
function fillFor(
  kinds: Set<string>,
  inSuffix: boolean,
  inPrefix: boolean,
): string {
  if (kinds.has('swap')) {
    return FILL_SWAP
  }
  if (kinds.has('compare')) {
    return FILL_COMPARE
  }
  if (kinds.has('selected')) {
    return FILL_SELECTED
  }
  if (kinds.has('boundary')) {
    return FILL_BOUNDARY
  }
  if (kinds.has('visited')) {
    return FILL_VISITED
  }
  if (kinds.has('sorted') || kinds.has('result') || inSuffix || inPrefix) {
    return FILL_SORTED
  }
  return FILL_BASE
}

/**
 * SVG visualization of one step's array state: bars, highlight colors,
 * optional sorted prefix/suffix tinting, and (for merge sort) the
 * temporary buffer row aligned to its target range.
 */
export function ArrayVisualizer({
  values,
  highlights,
  sortedFrom,
  sortedTo,
  buffer = null,
}: ArrayVisualizerProps) {
  const max = Math.max(...values, 1)
  const kindsByIndex = new Map<string, Set<string>>()
  for (const highlight of highlights) {
    for (const element of highlight.elements) {
      const set = kindsByIndex.get(element) ?? new Set<string>()
      set.add(highlight.kind)
      kindsByIndex.set(element, set)
    }
  }
  const width = Math.max(values.length, 1) * (BAR_WIDTH + BAR_GAP) + BAR_GAP
  const bufferHeight = buffer ? 34 : 0

  return (
    <svg
      data-testid="array-visualizer"
      role="img"
      aria-label={`Array visualization with ${values.length} elements`}
      viewBox={`0 0 ${width} ${CHART_HEIGHT + LABEL_SPACE + bufferHeight}`}
      style={{ width: '100%', maxWidth: 720, height: 'auto' }}
    >
      {values.map((value, index) => {
        const barHeight = Math.max(4, Math.round((value / max) * CHART_HEIGHT))
        const x = BAR_GAP + index * (BAR_WIDTH + BAR_GAP)
        const y = CHART_HEIGHT - barHeight
        const key = String(index)
        const kinds = kindsByIndex.get(key) ?? new Set<string>()
        const inSuffix = sortedFrom !== undefined && index >= sortedFrom
        const inPrefix = sortedTo !== undefined && index < sortedTo
        return (
          <g key={key}>
            <rect
              data-testid={`bar-${index}`}
              x={x}
              y={y}
              width={BAR_WIDTH}
              height={barHeight}
              rx={4}
              fill={fillFor(kinds, inSuffix, inPrefix)}
            />
            <text
              x={x + BAR_WIDTH / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize={12}
              fill={TEXT_MUTED}
            >
              {value}
            </text>
            <text
              x={x + BAR_WIDTH / 2}
              y={CHART_HEIGHT + 16}
              textAnchor="middle"
              fontSize={10}
              fill={TEXT_MUTED}
            >
              {index}
            </text>
          </g>
        )
      })}
      {buffer
        ? buffer.values.map((value, offset) => {
            const x =
              BAR_GAP + (buffer.targetStart + offset) * (BAR_WIDTH + BAR_GAP) + 8
            const y = CHART_HEIGHT + LABEL_SPACE
            return (
              <g key={`buffer-${offset}`}>
                <rect
                  data-testid={`buffer-cell-${offset}`}
                  x={x}
                  y={y}
                  width={BUFFER_CELL}
                  height={BUFFER_CELL - 8}
                  rx={3}
                  fill={value === null ? 'transparent' : '#e0e7ff'}
                  stroke={value === null ? '#cbd5e1' : '#6366f1'}
                  strokeDasharray={value === null ? '3 2' : undefined}
                />
                {value !== null ? (
                  <text
                    x={x + BUFFER_CELL / 2}
                    y={y + 14}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#4338ca"
                  >
                    {value}
                  </text>
                ) : null}
              </g>
            )
          })
        : null}
    </svg>
  )
}
