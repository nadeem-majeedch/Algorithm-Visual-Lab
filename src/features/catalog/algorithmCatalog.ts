/**
 * Catalog of algorithm categories and their entries.
 *
 * Single source of truth for navigation, selectors, and the workspace.
 * Every algorithm is currently a placeholder: the shell is complete, while
 * algorithm engines arrive in later phases.
 */

export type AlgorithmStatus = 'available' | 'coming-soon'

export interface AlgorithmDescriptor {
  /** Stable identifier, doubles as the hash-route id (e.g. 'bubble-sort'). */
  readonly id: string
  /** Human-readable name shown in navigation and headings. */
  readonly label: string
  /** One-line educational summary of what the algorithm demonstrates. */
  readonly description: string
  /** Whether the algorithm has a working visualization yet. */
  readonly status: AlgorithmStatus
}

export interface AlgorithmCategory {
  /** Stable identifier, doubles as the hash-route category id. */
  readonly id: string
  /** Human-readable category name shown in the sidebar. */
  readonly label: string
  /** Short intent of the category, shown as section context. */
  readonly description: string
  readonly algorithms: readonly AlgorithmDescriptor[]
}

export type ComplexityKind = 'time' | 'space'

export interface ComplexityCase {
  /** Case name, e.g. 'Best', 'Average', 'Worst', 'Auxiliary'. */
  readonly label: string
  /** Big-O notation, e.g. 'O(n log n)'. */
  readonly notation: string
}

/**
 * Educational metadata shown in the workspace panels before the
 * visualizations themselves are wired up in later phases.
 */
export interface AlgorithmLearningInfo {
  readonly pseudocode: readonly string[]
  readonly complexity: Readonly<Record<ComplexityKind, readonly ComplexityCase[]>>
}

/** Finds an algorithm by id across all categories. */
export function findAlgorithm(
  categories: readonly AlgorithmCategory[],
  algorithmId: string,
): { algorithm: AlgorithmDescriptor; category: AlgorithmCategory } | null {
  for (const category of categories) {
    const algorithm = category.algorithms.find((a) => a.id === algorithmId)
    if (algorithm) {
      return { algorithm, category }
    }
  }
  return null
}

export const algorithmCategories: readonly AlgorithmCategory[] = [
  {
    id: 'sorting',
    label: 'Sorting',
    description: 'Ordering collections by comparison',
    algorithms: [
      {
        id: 'bubble-sort',
        label: 'Bubble Sort',
        description: 'Repeatedly swaps adjacent elements, bubbling the largest values to the end.',
        status: 'available',
      },
      {
        id: 'selection-sort',
        label: 'Selection Sort',
        description: 'Selects the minimum of the unsorted range and places it at the front.',
        status: 'available',
      },
      {
        id: 'insertion-sort',
        label: 'Insertion Sort',
        description: 'Builds a sorted prefix by inserting each element into its place.',
        status: 'available',
      },
      {
        id: 'merge-sort',
        label: 'Merge Sort',
        description: 'Divides the array, sorts the halves, and merges them back together.',
        status: 'available',
      },
      {
        id: 'quick-sort',
        label: 'Quick Sort',
        description: 'Partitions around pivots, sorting ranges in place.',
        status: 'available',
      },
      {
        id: 'heap-sort',
        label: 'Heap Sort',
        description: 'Builds a max-heap, then repeatedly extracts the largest element.',
        status: 'available',
      },
    ],
  },
  {
    id: 'searching',
    label: 'Searching',
    description: 'Locating values inside collections',
    algorithms: [
      {
        id: 'linear-search',
        label: 'Linear Search',
        description: 'Scans every element in order until the target is found.',
        status: 'available',
      },
      {
        id: 'binary-search',
        label: 'Binary Search',
        description: 'Halves a sorted range each step by comparing against the middle element.',
        status: 'available',
      },
    ],
  },
  {
    id: 'graphs',
    label: 'Graphs',
    description: 'Traversals and weighted paths',
    algorithms: [
      {
        id: 'bfs',
        label: 'BFS',
        description: 'Explores a graph level by level using a queue.',
        status: 'coming-soon',
      },
      {
        id: 'dfs',
        label: 'DFS',
        description: 'Explores as deep as possible along each branch before backtracking.',
        status: 'coming-soon',
      },
      {
        id: 'dijkstra',
        label: 'Dijkstra',
        description: 'Expands the cheapest frontier node to grow shortest paths.',
        status: 'coming-soon',
      },
      {
        id: 'astar',
        label: 'A*',
        description: 'Guides Dijkstra-style search with a heuristic toward the goal.',
        status: 'coming-soon',
      },
      {
        id: 'prim-mst',
        label: "Prim's MST",
        description: 'Grows a minimum spanning tree from a starting vertex.',
        status: 'coming-soon',
      },
      {
        id: 'kruskal-mst',
        label: "Kruskal's MST",
        description: 'Adds the cheapest edges that keep the forest acyclic.',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'data-structures',
    label: 'Data Structures',
    description: 'Classic containers and trees',
    algorithms: [
      {
        id: 'stack',
        label: 'Stack',
        description: 'Last-in, first-out pushes and pops.',
        status: 'coming-soon',
      },
      {
        id: 'queue',
        label: 'Queue',
        description: 'First-in, first-out enqueues and dequeues.',
        status: 'coming-soon',
      },
      {
        id: 'linked-list',
        label: 'Linked List',
        description: 'Chained nodes with insertion and removal.',
        status: 'coming-soon',
      },
      {
        id: 'binary-search-tree',
        label: 'Binary Search Tree',
        description: 'Ordered tree supporting insert, search, and traversals.',
        status: 'coming-soon',
      },
      {
        id: 'heap',
        label: 'Heap',
        description: 'Complete binary tree maintaining heap order.',
        status: 'coming-soon',
      },
      {
        id: 'hash-table',
        label: 'Hash Table',
        description: 'Key-value store with hashing and collision handling.',
        status: 'coming-soon',
      },
    ],
  },
]

/**
 * Learning metadata for placeholder algorithms, keyed by id. Kept separate
 * from the descriptors so catalog data stays cheap to serialize and the
 * educational copy can evolve independently.
 */
export const algorithmLearningInfo: Readonly<Record<string, AlgorithmLearningInfo>> = {
  'bubble-sort': {
    pseudocode: [
      'for i from 0 to n - 2',
      '  swapped = false',
      '  for j from 0 to n - 2 - i',
      '    if a[j] > a[j + 1]',
      '      swap a[j], a[j + 1]',
      '      swapped = true',
      '  if not swapped: break',
    ],
    complexity: {
      time: [
        { label: 'Best', notation: 'O(n)' },
        { label: 'Average', notation: 'O(n²)' },
        { label: 'Worst', notation: 'O(n²)' },
      ],
      space: [{ label: 'Auxiliary', notation: 'O(1)' }],
    },
  },
  'selection-sort': {
    pseudocode: [
      'for i from 0 to n - 2',
      '  min = i',
      '  for j from i + 1 to n - 1',
      '    if a[j] < a[min]: min = j',
      '  swap a[i], a[min]',
    ],
    complexity: {
      time: [
        { label: 'Best', notation: 'O(n²)' },
        { label: 'Average', notation: 'O(n²)' },
        { label: 'Worst', notation: 'O(n²)' },
      ],
      space: [{ label: 'Auxiliary', notation: 'O(1)' }],
    },
  },
  'insertion-sort': {
    pseudocode: [
      'for i from 1 to n - 1',
      '  key = a[i]',
      '  j = i - 1',
      '  while j >= 0 and a[j] > key',
      '    a[j + 1] = a[j]',
      '    j = j - 1',
      '  a[j + 1] = key',
    ],
    complexity: {
      time: [
        { label: 'Best', notation: 'O(n)' },
        { label: 'Average', notation: 'O(n²)' },
        { label: 'Worst', notation: 'O(n²)' },
      ],
      space: [{ label: 'Auxiliary', notation: 'O(1)' }],
    },
  },
  'merge-sort': {
    pseudocode: [
      'mergeSort(a, lo, hi)',
      '  if lo >= hi: return',
      '  mid = (lo + hi) / 2',
      '  mergeSort(a, lo, mid)',
      '  mergeSort(a, mid + 1, hi)',
      '  merge(a, lo, mid, hi)',
    ],
    complexity: {
      time: [
        { label: 'Best', notation: 'O(n log n)' },
        { label: 'Average', notation: 'O(n log n)' },
        { label: 'Worst', notation: 'O(n log n)' },
      ],
      space: [{ label: 'Auxiliary', notation: 'O(n)' }],
    },
  },
  'quick-sort': {
    pseudocode: [
      'quickSort(a, lo, hi)',
      '  if lo >= hi: return',
      '  p = partition(a, lo, hi)',
      '  quickSort(a, lo, p - 1)',
      '  quickSort(a, p + 1, hi)',
    ],
    complexity: {
      time: [
        { label: 'Best', notation: 'O(n log n)' },
        { label: 'Average', notation: 'O(n log n)' },
        { label: 'Worst', notation: 'O(n²)' },
      ],
      space: [{ label: 'Auxiliary', notation: 'O(log n)' }],
    },
  },
  'heap-sort': {
    pseudocode: [
      'buildMaxHeap(a)',
      'for end from n - 1 down to 1',
      '  swap a[0], a[end]',
      '  siftDown(a, 0, end - 1)',
    ],
    complexity: {
      time: [
        { label: 'Best', notation: 'O(n log n)' },
        { label: 'Average', notation: 'O(n log n)' },
        { label: 'Worst', notation: 'O(n log n)' },
      ],
      space: [{ label: 'Auxiliary', notation: 'O(1)' }],
    },
  },
  'linear-search': {
    pseudocode: [
      'for i from 0 to n - 1',
      '  if a[i] == target',
      '    return i',
      'return -1',
    ],
    complexity: {
      time: [
        { label: 'Best', notation: 'O(1)' },
        { label: 'Average', notation: 'O(n)' },
        { label: 'Worst', notation: 'O(n)' },
      ],
      space: [{ label: 'Auxiliary', notation: 'O(1)' }],
    },
  },
  'binary-search': {
    pseudocode: [
      'lo = 0, hi = n - 1',
      'while lo <= hi',
      '  mid = (lo + hi) / 2',
      '  if a[mid] == target: return mid',
      '  if a[mid] < target: lo = mid + 1',
      '  else: hi = mid - 1',
      'return -1',
    ],
    complexity: {
      time: [
        { label: 'Best', notation: 'O(1)' },
        { label: 'Average', notation: 'O(log n)' },
        { label: 'Worst', notation: 'O(log n)' },
      ],
      space: [{ label: 'Auxiliary', notation: 'O(1)' }],
    },
  },
  bfs: {
    pseudocode: [
      'queue = [start]',
      'while queue not empty',
      '  v = queue.dequeue()',
      '  for each neighbor u of v',
      '    if u not visited',
      '      mark u visited',
      '      queue.enqueue(u)',
    ],
    complexity: {
      time: [{ label: 'All cases', notation: 'O(V + E)' }],
      space: [{ label: 'Frontier', notation: 'O(V)' }],
    },
  },
  dfs: {
    pseudocode: [
      'stack = [start]',
      'while stack not empty',
      '  v = stack.pop()',
      '  if v visited: continue',
      '  mark v visited',
      '  push neighbors of v',
    ],
    complexity: {
      time: [{ label: 'All cases', notation: 'O(V + E)' }],
      space: [{ label: 'Stack', notation: 'O(V)' }],
    },
  },
  dijkstra: {
    pseudocode: [
      'dist[start] = 0',
      'priority queue = all vertices',
      'while queue not empty',
      '  v = extractMin(queue)',
      '  for each edge (v, u, w)',
      '    if dist[v] + w < dist[u]',
      '      dist[u] = dist[v] + w',
    ],
    complexity: {
      time: [{ label: 'Binary heap', notation: 'O((V + E) log V)' }],
      space: [{ label: 'Distances', notation: 'O(V)' }],
    },
  },
  astar: {
    pseudocode: [
      'open = { start: h(start) }',
      'while open not empty',
      '  v = argmin(f = g + h)',
      '  if v == goal: return path',
      '  for each neighbor u',
      '    relax g(u) and f(u)',
    ],
    complexity: {
      time: [{ label: 'Heuristic-dependent', notation: 'O(E log V)' }],
      space: [{ label: 'Open set', notation: 'O(V)' }],
    },
  },
  'prim-mst': {
    pseudocode: [
      'key[start] = 0',
      'while vertices remain',
      '  v = extractMin(key)',
      '  add v to MST',
      '  for each edge (v, u, w)',
      '    if w < key[u]: key[u] = w',
    ],
    complexity: {
      time: [{ label: 'Binary heap', notation: 'O(E log V)' }],
      space: [{ label: 'Keys', notation: 'O(V)' }],
    },
  },
  'kruskal-mst': {
    pseudocode: [
      'sort edges by weight',
      'forest = each vertex its own tree',
      'for each edge (u, v, w)',
      '  if find(u) != find(v)',
      '    union(u, v); add edge',
    ],
    complexity: {
      time: [{ label: 'Sorting edges', notation: 'O(E log E)' }],
      space: [{ label: 'Union-find', notation: 'O(V)' }],
    },
  },
  stack: {
    pseudocode: [
      'push(x): top += 1; a[top] = x',
      'pop(): x = a[top]; top -= 1',
      'peek(): return a[top]',
      'isEmpty(): return top < 0',
    ],
    complexity: {
      time: [{ label: 'Push / Pop', notation: 'O(1)' }],
      space: [{ label: 'Storage', notation: 'O(n)' }],
    },
  },
  queue: {
    pseudocode: [
      'enqueue(x): a[rear] = x; rear += 1',
      'dequeue(): x = a[front]; front += 1',
      'peek(): return a[front]',
      'isEmpty(): return front == rear',
    ],
    complexity: {
      time: [{ label: 'Enqueue / Dequeue', notation: 'O(1)' }],
      space: [{ label: 'Storage', notation: 'O(n)' }],
    },
  },
  'linked-list': {
    pseudocode: [
      'insert(x): node.next = head; head = node',
      'search(x): walk nodes until match',
      'delete(x): unlink the matching node',
    ],
    complexity: {
      time: [
        { label: 'Insert head', notation: 'O(1)' },
        { label: 'Search', notation: 'O(n)' },
        { label: 'Delete', notation: 'O(n)' },
      ],
      space: [{ label: 'Storage', notation: 'O(n)' }],
    },
  },
  'binary-search-tree': {
    pseudocode: [
      'insert(v): descend left/right by key',
      'search(v): compare and descend',
      'inOrder(): left, node, right',
    ],
    complexity: {
      time: [
        { label: 'Average', notation: 'O(log n)' },
        { label: 'Worst (chain)', notation: 'O(n)' },
      ],
      space: [{ label: 'Storage', notation: 'O(n)' }],
    },
  },
  heap: {
    pseudocode: [
      'insert(x): place at end; sift up',
      'extractMax(): take root;',
      '  move last to root; sift down',
      'heapify(a): sift down all nodes',
    ],
    complexity: {
      time: [
        { label: 'Insert', notation: 'O(log n)' },
        { label: 'Extract', notation: 'O(log n)' },
        { label: 'Peek', notation: 'O(1)' },
      ],
      space: [{ label: 'Storage', notation: 'O(n)' }],
    },
  },
  'hash-table': {
    pseudocode: [
      'put(k, v): i = hash(k) % m',
      '  resolve collision at i',
      'get(k): probe until key matches',
      'delete(k): remove from bucket',
    ],
    complexity: {
      time: [
        { label: 'Average', notation: 'O(1)' },
        { label: 'Worst (all collide)', notation: 'O(n)' },
      ],
      space: [{ label: 'Storage', notation: 'O(n)' }],
    },
  },
}
