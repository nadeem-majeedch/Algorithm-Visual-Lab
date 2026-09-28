/**
 * Canonical sample datasets.
 *
 * Future visualizers render these arrays so every algorithm works against
 * identical input; tests can also assert deterministic step sequences.
 */

export const SAMPLE_ARRAY_SORTED = [1, 2, 3, 4, 5, 6, 7, 8] as const

export const SAMPLE_ARRAY_REVERSED = [8, 7, 6, 5, 4, 3, 2, 1] as const

export const SAMPLE_ARRAY_RANDOM = [42, 7, 19, 88, 3, 56, 23, 71] as const
