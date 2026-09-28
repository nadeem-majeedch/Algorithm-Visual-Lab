import { describe, expect, it } from 'vitest'

import {
  addEdge,
  addNode,
  createGraph,
  degree,
  getEdge,
  getNode,
  hasEdge,
  hasNode,
  neighbors,
  removeEdge,
  removeNode,
  updateEdge,
  updateNode,
} from '../models/graph'
import { fixtureDirected, fixtureUndirected } from './helpers/graphFixtures'

describe('graph model', () => {
  it('adds and finds nodes', () => {
    let graph = createGraph()
    graph = addNode(graph, { id: 'X', label: 'X', x: 1, y: 2 })
    expect(hasNode(graph, 'X')).toBe(true)
    expect(getNode(graph, 'X')?.x).toBe(1)
    expect(getNode(graph, 'Y')).toBeNull()
  })

  it('rejects duplicate node ids', () => {
    const graph = fixtureUndirected()
    expect(() =>
      addNode(graph, { id: 'A', label: 'A2', x: 0, y: 0 }),
    ).toThrow(/already exists/)
  })

  it('undirected edges are found in both orientations', () => {
    const graph = fixtureUndirected()
    expect(hasEdge(graph, 'A', 'B')).toBe(true)
    expect(hasEdge(graph, 'B', 'A')).toBe(true)
    expect(getEdge(graph, 'B', 'A')?.weight).toBe(1)
  })

  it('directed edges keep orientation', () => {
    const graph = fixtureDirected()
    expect(hasEdge(graph, 'C', 'B')).toBe(true)
    expect(hasEdge(graph, 'B', 'C')).toBe(false)
  })

  it('updateNode changes label/position without mutating the original', () => {
    const before = fixtureUndirected()
    const after = updateNode(before, 'A', { label: 'Alpha', x: 9 })
    expect(getNode(after, 'A')?.label).toBe('Alpha')
    expect(getNode(before, 'A')?.label).toBe('A')
    expect(getNode(after, 'B')?.label).toBe('B')
  })

  it('updateEdge changes weight/label without mutating the original', () => {
    const before = fixtureDirected()
    const after = updateEdge(before, 'A', 'B', { weight: 7, label: 'hot' })
    expect(getEdge(after, 'A', 'B')?.weight).toBe(7)
    expect(getEdge(after, 'A', 'B')?.label).toBe('hot')
    expect(getEdge(before, 'A', 'B')?.weight).toBe(4)
  })

  it('removeNode cascades incident edges', () => {
    let graph = fixtureUndirected()
    graph = removeNode(graph, 'B')
    expect(hasEdge(graph, 'A', 'B')).toBe(false)
    expect(hasEdge(graph, 'B', 'C')).toBe(false)
    expect(hasEdge(graph, 'C', 'D')).toBe(true)
  })

  it('removeEdge preserves the rest of the graph', () => {
    let graph = fixtureUndirected()
    graph = removeEdge(graph, 'C', 'D')
    expect(hasEdge(graph, 'C', 'D')).toBe(false)
    expect(hasEdge(graph, 'A', 'B')).toBe(true)
  })

  it('updateEdge rejects unknown edges', () => {
    const graph = fixtureUndirected()
    expect(() => updateEdge(graph, 'A', 'D', { weight: 1 })).toThrow(/does not exist/)
  })

  it('addEdge rejects unknown endpoints and negative weights', () => {
    const graph = fixtureUndirected()
    expect(() => addEdge(graph, { from: 'A', to: 'Z', weight: 1 })).toThrow(/must exist/)
    expect(() => addEdge(graph, { from: 'A', to: 'B', weight: -1 })).toThrow(/non-negative/)
  })

  it('neighbors respects direction', () => {
    expect(neighbors(fixtureUndirected(), 'B')).toEqual(['A', 'C'])
    expect(neighbors(fixtureDirected(), 'A')).toEqual(['B', 'C'])
    expect(neighbors(fixtureDirected(), 'D')).toEqual([])
  })

  it('degree counts incident edges (in + out for directed)', () => {
    expect(degree(fixtureDirected(), 'B')).toBe(3)
    expect(degree(fixtureUndirected(), 'B')).toBe(2)
  })

  it('mutations return new graph objects (immutability)', () => {
    const before = fixtureUndirected()
    const after = removeNode(before, 'D')
    expect(after).not.toBe(before)
    expect(before.nodes).toHaveLength(4)
    expect(after.nodes).toHaveLength(3)
  })
})
