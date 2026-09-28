import { executeDefinition } from '../../engine'
import type { AlgorithmDefinition } from '../../engine'
import type {
  AlgorithmInput,
  AlgorithmStep,
  ComplexityInfo,
  Operation,
  PseudocodeLine,
} from '../../engine'
import { neighbors } from '../../models/graph'
import type { Graph } from '../../models/graph'

/** DFS snapshot: explicit stack, visited set, and backtrack marker. */
export type DfsState = {
  readonly stack: readonly string[]
  readonly visited: readonly string[]
  readonly current: string | null
  readonly lastOperation: string
  readonly order: readonly string[]
}

export const DFS_PSEUDOCODE: readonly PseudocodeLine[] = [
  { number: 1, text: 'stack = [start]' },
  { number: 2, text: 'while stack not empty' },
  { number: 3, text: '  v = stack.pop()' },
  { number: 4, text: '  if v visited: continue' },
  { number: 5, text: '  mark v visited; visit v' },
  { number: 6, text: '  push unvisited neighbors of v' },
]

export const DFS_COMPLEXITY: ComplexityInfo = {
  time: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
  space: 'O(V)',
}

type DfsDraft = Omit<AlgorithmStep<DfsState>, 'step' | 'complexity'>

/**
 * Depth-First Search — dives deep along one branch before backtracking.
 *
 * Iterative with an explicit stack (no real recursion), so every push,
 * pop, stale-skip, and backtrack is a visible deterministic step.
 * Neighbors are pushed in reverse edge order so the first edge is
 * explored first, matching textbook pre-order.
 */
export function dfsAlgorithm(graph: Graph): AlgorithmDefinition<AlgorithmInput, DfsState> {
  return {
    metadata: {
      id: 'dfs',
      label: 'Depth-First Search',
      category: 'Graphs',
      description:
        'Explores as deep as possible along each branch using a stack, backtracking when a dead end is reached.',
      complexity: DFS_COMPLEXITY,
      pseudocode: DFS_PSEUDOCODE,
      stable: true,
      inPlace: false,
      tags: ['traversal', 'stack'],
    },
    createState: (): DfsState => ({
      stack: [],
      visited: [],
      current: null,
      lastOperation: 'ready',
      order: [],
    }),
    run: function* (input: AlgorithmInput): Generator<DfsDraft, void, void> {
      const startOption = input.options?.['start']
      const start =
        typeof startOption === 'string' && startOption.length > 0
          ? startOption
          : graph.nodes[0]?.id ?? ''

      const visited = new Set<string>()
      const order: string[] = []
      const stack: string[] = [start]

      const snap = (current: string | null, lastOperation: string): DfsState => ({
        stack: [...stack],
        visited: [...visited],
        current,
        lastOperation,
        order: [...order],
      })

      yield {
        state: snap(null, 'stack init'),
        operation: { type: 'INITIALIZE', detail: `stack = [${start}]` } satisfies Operation,
        affected: [start],
        highlights: [{ kind: 'boundary', elements: [start] }],
        explanation: `Push the start node '${start}' onto the stack. DFS will dive deep before it widens.`,
        pseudocodeLine: 1,
        comparison: null,
        mutation: null,
      }

      while (stack.length > 0) {
        const v = stack.pop() ?? ''

        if (visited.has(v)) {
          yield {
            state: snap(v, 'stale pop'),
            operation: { type: 'UPDATE', detail: `pop ${v} (stale — already visited)` } satisfies Operation,
            affected: [v],
            highlights: [{ kind: 'visited', elements: [v], label: 'seen' }],
            explanation: `Popped '${v}' again but it was already visited on an earlier dive — discard it. This is how the explicit stack replaces recursion cleanly.`,
            pseudocodeLine: 4,
            comparison: null,
            mutation: null,
          }
          continue
        }

        visited.add(v)
        order.push(v)
        yield {
          state: snap(v, 'visit'),
          operation: { type: 'VISIT', detail: `visit ${v}` } satisfies Operation,
          affected: [v],
          highlights: [{ kind: 'visited', elements: [v] }],
          explanation: `Visit '${v}' — it becomes the current node and its neighbors are examined next.`,
          pseudocodeLine: 5,
          comparison: null,
          mutation: null,
        }

        const fresh: string[] = []
        for (const u of neighbors(graph, v)) {
          const known = visited.has(u)
          yield {
            state: snap(v, 'neighbor inspect'),
            operation: {
              type: 'COMPARE',
              detail: `inspect ${u} (${known ? 'visited' : 'undiscovered'})`,
            } satisfies Operation,
            affected: [v, u],
            highlights: [
              { kind: 'selected', elements: [v] },
              known
                ? { kind: 'visited', elements: [u], label: 'seen' }
                : { kind: 'compare', elements: [u], label: 'new' },
            ],
            explanation: known
              ? `Neighbor '${u}' is already visited — DFS will not re-enter it (cycle safety).`
              : `Neighbor '${u}' is undiscovered — DFS dives into it before finishing '${v}'.`,
            pseudocodeLine: 6,
            comparison: null,
            mutation: null,
          }
          if (!known) {
            fresh.push(u)
          }
        }

        for (let index = fresh.length - 1; index >= 0; index -= 1) {
          const u = fresh[index] ?? ''
          stack.push(u)
          yield {
            state: snap(v, 'push'),
            operation: { type: 'PUSH', detail: `push ${u}` } satisfies Operation,
            affected: [u],
            highlights: [{ kind: 'selected', elements: [u], label: 'on stack' }],
            explanation: `Push '${u}' onto the stack. Reverse-order pushing makes the first edge the next dive.`,
            pseudocodeLine: 6,
            comparison: null,
            mutation: null,
          }
        }

        if (fresh.length === 0 && stack.length > 0) {
          const nextPeek = stack[stack.length - 1] ?? ''
          yield {
            state: snap(v, 'backtrack'),
            operation: { type: 'UPDATE', detail: `backtrack ${v} -> ${nextPeek}` } satisfies Operation,
            affected: [v, nextPeek],
            highlights: [{ kind: 'boundary', elements: [v], label: 'dead end' }],
            explanation: `'${v}' has no unvisited neighbors — a dead end. DFS backtracks to '${nextPeek}' and continues from there.`,
            pseudocodeLine: 2,
            comparison: null,
            mutation: null,
          }
        }
      }

      yield {
        state: snap(null, 'complete'),
        operation: { type: 'COMPLETE' } satisfies Operation,
        affected: [...order],
        highlights: [{ kind: 'result', elements: [...order], label: 'traversal order' }],
        explanation: `Traversal complete. DFS order: ${order.join(' → ')}.`,
        pseudocodeLine: 2,
        comparison: null,
        mutation: null,
      }
    },
  }
}

/** Executes DFS deterministically; returns the full step list. */
export function executeDfs(graph: Graph, start: string): AlgorithmStep<DfsState>[] {
  return executeDefinition(dfsAlgorithm(graph), { values: [], options: { start } })
}
