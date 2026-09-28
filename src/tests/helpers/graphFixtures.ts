import {
  addEdge,
  addNode,
  createGraph,
} from '../../models/graph'
import type { Graph, GraphEdge, GraphNode } from '../../models/graph'

const NODES: readonly GraphNode[] = [
  { id: 'A', label: 'A', x: 0, y: 0 },
  { id: 'B', label: 'B', x: 100, y: 0 },
  { id: 'C', label: 'C', x: 50, y: 87 },
  { id: 'D', label: 'D', x: 150, y: 87 },
]

const UNDIRECTED_EDGES: readonly GraphEdge[] = [
  { from: 'A', to: 'B', weight: 1 },
  { from: 'B', to: 'C', weight: 2 },
  { from: 'C', to: 'D', weight: 3 },
]

const DIRECTED_EDGES: readonly GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4 },
  { from: 'A', to: 'C', weight: 1 },
  { from: 'C', to: 'B', weight: 2 },
  { from: 'B', to: 'D', weight: 5 },
  { from: 'C', to: 'D', weight: 8 },
]

function build(
  direction: 'directed' | 'undirected',
  edges: readonly GraphEdge[],
): Graph {
  let graph = createGraph(direction)
  for (const node of NODES) graph = addNode(graph, node)
  for (const edge of edges) graph = addEdge(graph, edge)
  return graph
}

/** Deterministic 4-node undirected fixture. */
export function fixtureUndirected(): Graph {
  return build('undirected', UNDIRECTED_EDGES)
}

/** Deterministic 4-node directed weighted fixture. */
export function fixtureDirected(): Graph {
  return build('directed', DIRECTED_EDGES)
}
