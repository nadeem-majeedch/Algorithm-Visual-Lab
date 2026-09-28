/**
 * Framework-independent immutable graph model.
 *
 * No React, no DOM, no engine imports. Every mutation returns a NEW
 * graph, so graphs embed safely in engine state snapshots (history and
 * replay). See docs/architecture.md.
 */

/** A node with a unique id, label, and layout position. */
export interface GraphNode {
  readonly id: string
  readonly label: string
  readonly x: number
  readonly y: number
}

/** A directed or undirected connection with a non-negative weight. */
export interface GraphEdge {
  readonly from: string
  readonly to: string
  readonly weight: number
  readonly label?: string
}

export type GraphDirection = 'directed' | 'undirected'

export interface Graph {
  readonly direction: GraphDirection
  readonly nodes: readonly GraphNode[]
  readonly edges: readonly GraphEdge[]
}

export function createGraph(direction: GraphDirection = 'undirected'): Graph {
  return { direction, nodes: [], edges: [] }
}

export function getNode(graph: Graph, id: string): GraphNode | null {
  return graph.nodes.find((node) => node.id === id) ?? null
}

export function hasNode(graph: Graph, id: string): boolean {
  return getNode(graph, id) !== null
}

export function getEdge(graph: Graph, from: string, to: string): GraphEdge | null {
  const exact = graph.edges.find((edge) => edge.from === from && edge.to === to)
  if (exact) return exact
  if (graph.direction === 'undirected') {
    return graph.edges.find((edge) => edge.from === to && edge.to === from) ?? null
  }
  return null
}

export function hasEdge(graph: Graph, from: string, to: string): boolean {
  return getEdge(graph, from, to) !== null
}

export function addNode(graph: Graph, node: GraphNode): Graph {
  if (hasNode(graph, node.id)) {
    throw new Error(`Node '${node.id}' already exists.`)
  }
  return { ...graph, nodes: [...graph.nodes, node] }
}

export function removeNode(graph: Graph, id: string): Graph {
  if (!hasNode(graph, id)) {
    throw new Error(`Node '${id}' does not exist.`)
  }
  return {
    ...graph,
    nodes: graph.nodes.filter((node) => node.id !== id),
    edges: graph.edges.filter((edge) => edge.from !== id && edge.to !== id),
  }
}

export function updateNode(graph: Graph, id: string, patch: Partial<Omit<GraphNode, 'id'>>): Graph {
  if (!hasNode(graph, id)) {
    throw new Error(`Node '${id}' does not exist.`)
  }
  return {
    ...graph,
    nodes: graph.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
  }
}

export function addEdge(graph: Graph, edge: GraphEdge): Graph {
  if (!hasNode(graph, edge.from) || !hasNode(graph, edge.to)) {
    throw new Error(`Edge endpoints must exist: '${edge.from}' -> '${edge.to}'.`)
  }
  if (edge.weight < 0) {
    throw new Error('Edge weight must be non-negative.')
  }
  if (hasEdge(graph, edge.from, edge.to)) {
    throw new Error(`Edge '${edge.from}' -> '${edge.to}' already exists.`)
  }
  return { ...graph, edges: [...graph.edges, edge] }
}

export function removeEdge(graph: Graph, from: string, to: string): Graph {
  const edge = getEdge(graph, from, to)
  if (!edge) {
    throw new Error(`Edge '${from}' -> '${to}' does not exist.`)
  }
  return {
    ...graph,
    edges: graph.edges.filter((candidate) => candidate !== edge),
  }
}

export function updateEdge(graph: Graph, from: string, to: string, patch: Partial<Omit<GraphEdge, 'from' | 'to'>>): Graph {
  const edge = getEdge(graph, from, to)
  if (!edge) {
    throw new Error(`Edge '${from}' -> '${to}' does not exist.`)
  }
  return {
    ...graph,
    edges: graph.edges.map((candidate) => (candidate === edge ? { ...candidate, ...patch } : candidate)),
  }
}

/** Neighbor ids of a node (successors for directed, both sides otherwise). */
export function neighbors(graph: Graph, id: string): string[] {
  const out: string[] = []
  for (const edge of graph.edges) {
    if (edge.from === id) out.push(edge.to)
    else if (graph.direction === 'undirected' && edge.to === id) out.push(edge.from)
  }
  return out
}

/** Number of incident edges (in + out for directed). */
export function degree(graph: Graph, id: string): number {
  let count = 0
  for (const edge of graph.edges) {
    if (edge.from === id) count += 1
    if (edge.to === id) count += 1
  }
  return count
}
