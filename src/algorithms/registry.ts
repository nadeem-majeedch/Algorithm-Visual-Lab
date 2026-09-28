import type {
  AlgorithmDefinition,
  AlgorithmInput,
  AlgorithmState,
} from '../engine'
import { bubbleSortAlgorithm } from './sorting/bubbleSort'
import { insertionSortAlgorithm } from './sorting/insertionSort'
import { selectionSortAlgorithm } from './sorting/selectionSort'
import { mergeSortAlgorithm } from './sorting/mergeSort'
import { quickSortAlgorithm } from './sorting/quickSort'
import { heapSortAlgorithm } from './sorting/heapSort'
import { linearSearchAlgorithm } from './searching/linearSearch'
import { binarySearchAlgorithm } from './searching/binarySearch'

/** Any engine-compatible algorithm definition, state-erased. */
export type AnyAlgorithm = AlgorithmDefinition<AlgorithmInput, AlgorithmState>

/**
 * Registry of executable algorithms, keyed by metadata id.
 *
 * Algorithms register here as they are implemented; the UI resolves the
 * current route's id against this map to decide between a live workspace
 * and the coming-soon placeholder.
 */
export const algorithmRegistry: Readonly<Record<string, AnyAlgorithm>> = {
  [bubbleSortAlgorithm.metadata.id]: bubbleSortAlgorithm,
  [insertionSortAlgorithm.metadata.id]: insertionSortAlgorithm,
  [selectionSortAlgorithm.metadata.id]: selectionSortAlgorithm,
  [mergeSortAlgorithm.metadata.id]: mergeSortAlgorithm,
  [quickSortAlgorithm.metadata.id]: quickSortAlgorithm,
  [heapSortAlgorithm.metadata.id]: heapSortAlgorithm,
  [linearSearchAlgorithm.metadata.id]: linearSearchAlgorithm,
  [binarySearchAlgorithm.metadata.id]: binarySearchAlgorithm,
}

/** Returns the registered algorithm for an id, or null when unimplemented. */
export function getRegisteredAlgorithm(id: string): AnyAlgorithm | null {
  return algorithmRegistry[id] ?? null
}
