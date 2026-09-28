/**
 * Deep-freezes a value in place and returns it.
 *
 * Snapshots retained by the engine must never change after creation:
 * history, replay, and future UI state all rely on structural
 * immutability. Freezing happens before recursion, so cyclic structures
 * terminate safely.
 */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value
  }
  if (Object.isFrozen(value)) {
    return value
  }
  Object.freeze(value)
  const record = value as Record<PropertyKey, unknown>
  for (const key of Reflect.ownKeys(record)) {
    deepFreeze(record[key])
  }
  return value
}
