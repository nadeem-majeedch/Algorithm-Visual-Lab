/** Bounds for randomly generated demonstration arrays. */
export const RANDOM_ARRAY_DEFAULT_LENGTH = 8
export const RANDOM_ARRAY_MIN_VALUE = 5
export const RANDOM_ARRAY_MAX_VALUE = 100

/** Hard limits for user-provided arrays (protects the visual layout). */
export const ARRAY_INPUT_MIN_LENGTH = 2
export const ARRAY_INPUT_MAX_LENGTH = 24
export const ARRAY_INPUT_MAX_VALUE = 999

/** Parsed user input with a plain-language error when invalid. */
export interface ParsedArrayInput {
  readonly values: readonly number[]
  readonly error: string | null
}

function clampCount(count: number): number {
  return Math.min(
    Math.max(Math.round(count), ARRAY_INPUT_MIN_LENGTH),
    ARRAY_INPUT_MAX_LENGTH,
  )
}

/**
 * Generates a random array for the Generate Random button.
 *
 * Randomness is confined to input generation: it never participates in
 * algorithm execution, so runs stay deterministic for a given array.
 */
export function generateRandomArray(
  count: number = RANDOM_ARRAY_DEFAULT_LENGTH,
): number[] {
  const length = clampCount(count)
  const values: number[] = []
  for (let index = 0; index < length; index += 1) {
    const range = RANDOM_ARRAY_MAX_VALUE - RANDOM_ARRAY_MIN_VALUE + 1
    values.push(RANDOM_ARRAY_MIN_VALUE + Math.floor(Math.random() * range))
  }
  return values
}

/** Builds a copy, clamped to the hard input limits. */
export function sanitizeArrayInput(values: readonly number[]): number[] {
  return values
    .slice(0, ARRAY_INPUT_MAX_LENGTH)
    .map((value) => Math.min(Math.max(Math.round(value), 0), ARRAY_INPUT_MAX_VALUE))
}

/**
 * Parses raw user input into values plus a validation error.
 *
 * Accepted forms: comma or whitespace separated integers within
 * ARRAY_INPUT_MAX_VALUE; 2 to ARRAY_INPUT_MAX_LENGTH numbers.
 */
export function parseArrayInput(raw: string): ParsedArrayInput {
  const tokens = raw
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)

  if (tokens.length === 0) {
    return { values: [], error: 'Enter at least two numbers.' }
  }

  const values: number[] = []
  for (const token of tokens) {
    if (!/^-?\d+$/.test(token)) {
      return { values: [], error: `'${token}' is not an integer.` }
    }
    const parsed = Number(token)
    if (!Number.isSafeInteger(parsed)) {
      return { values: [], error: `'${token}' is out of range.` }
    }
    if (Math.abs(parsed) > ARRAY_INPUT_MAX_VALUE) {
      return { values: [], error: `'${token}' exceeds ${ARRAY_INPUT_MAX_VALUE}.` }
    }
    values.push(parsed)
  }

  if (values.length < ARRAY_INPUT_MIN_LENGTH) {
    return { values: [], error: 'Enter at least two numbers.' }
  }
  if (values.length > ARRAY_INPUT_MAX_LENGTH) {
    return {
      values: [],
      error: `Use at most ${ARRAY_INPUT_MAX_LENGTH} numbers (got ${values.length}).`,
    }
  }
  return { values, error: null }
}
