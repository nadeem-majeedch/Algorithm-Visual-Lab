/** Pure formatting helpers shared across the app and unit tests. */

/** Converts a free-text label into a URL- and hash-safe slug. */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Truncates a label for compact UI contexts, appending an ellipsis. */
export function truncateLabel(value: string, maxLength: number): string {
  if (maxLength < 1) {
    return ''
  }
  return value.length > maxLength
    ? `${value.slice(0, Math.max(maxLength - 1, 0))}…`
    : value
}
