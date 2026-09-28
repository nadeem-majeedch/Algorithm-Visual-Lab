import type { Graph } from '../../models/graph'

/** Visual state flags per node/edge id, computed by callers. */
export interface GraphHighlight {
  readonly nodes?: Readonly<Record<string, 'active' | 'visited' | 'source' | 'destination' | 'path'>>
  readonly edges?: Readonly<Record<string, 'active' | 'visited' | 'path'>>
  readonly selectedNode?: string | null
  readonly selectedEdge?: string | null
}

export interface GraphViewProps {
  graph: Graph
  highlight?: GraphHighlight
  onSelectNode?: (id: string) => void
  onSelectEdge?: (from: string, to: string) => void
}

const NODE_R = 16
const TEXT = '#1e293b'

const NODE_FILLS: Record<string, string> = {
  source: '#2563eb',
  destination: '#7c3aed',
  active: '#d97706',
  visited: '#93c5fd',
  path: '#10b981',
}

const EDGE_STROKES: Record<string, string> = {
  active: '#d97706',
  visited: '#93c5fd',
  path: '#10b981',
}

/**
 * SVG graph rendering layer. Pure presentation over the immutable graph
 * model: nodes, edges, arrowheads for directed graphs, weight labels,
 * and caller-supplied highlight/selection states. Clicks emit ids.
 */
export function GraphView({
  graph,
  highlight = {},
  onSelectNode,
  onSelectEdge,
}: GraphViewProps) {
  const width = 480
  const height = 300

  return (
    <svg
      data-testid="graph-view"
      role="img"
      aria-label={`Graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges`}
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: 560, height: 'auto' }}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
        </marker>
      </defs>
      {graph.edges.map((edge) => {
        const from = graph.nodes.find((node) => node.id === edge.from)
        const to = graph.nodes.find((node) => node.id === edge.to)
        if (!from || !to) return null
        const key = `${edge.from}->${edge.to}`
        const state = highlight.edges?.[key]
        const stroke = state ? (EDGE_STROKES[state] ?? '#64748b') : '#64748b'
        const selected = highlight.selectedEdge === key
        return (
          <g key={key}>
            <line
              data-testid={`edge-${key}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={stroke}
              strokeWidth={selected ? 4 : 2}
              markerEnd={graph.direction === 'directed' ? 'url(#arrow)' : undefined}
              onClick={() => onSelectEdge?.(edge.from, edge.to)}
              style={{ cursor: onSelectEdge ? 'pointer' : 'default' }}
            />
            {edge.weight !== 1 ? (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 4}
                textAnchor="middle"
                fontSize={10}
                fill="#475569"
              >
                {edge.weight}
              </text>
            ) : null}
          </g>
        )
      })}
      {graph.nodes.map((node) => {
        const state = highlight.nodes?.[node.id]
        const fill = state ? (NODE_FILLS[state] ?? '#93b4f8') : '#93b4f8'
        const selected = highlight.selectedNode === node.id
        return (
          <g key={node.id}>
            <circle
              data-testid={`node-${node.id}`}
              cx={node.x}
              cy={node.y}
              r={NODE_R + (selected ? 3 : 0)}
              fill={fill}
              stroke={selected ? '#1e293b' : '#64748b'}
              strokeWidth={selected ? 3 : 1}
              onClick={() => onSelectNode?.(node.id)}
              style={{ cursor: onSelectNode ? 'pointer' : 'default' }}
            />
            <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={11} fill={TEXT}>
              {node.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
