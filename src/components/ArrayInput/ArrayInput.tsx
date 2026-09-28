import { useState } from 'react'

import {
  ARRAY_INPUT_MAX_LENGTH,
  ARRAY_INPUT_MAX_VALUE,
  generateRandomArray,
  parseArrayInput,
  sanitizeArrayInput,
} from '../../utils/arrayInput'
import styles from './ArrayInput.module.css'

export interface ArrayInputProps {
  /** Applies a validated custom array. */
  onApply: (values: number[]) => void
  /** Disables controls while, e.g., playback is running. */
  disabled?: boolean
}

/**
 * Custom array input: enter comma/space-separated integers, apply them
 * to the visualization, or generate a random demonstration array.
 * Randomness is confined to input generation, never to execution.
 */
export function ArrayInput({ onApply, disabled = false }: ArrayInputProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleApply = () => {
    const parsed = parseArrayInput(draft)
    if (parsed.error !== null || parsed.values.length === 0) {
      setError(parsed.error ?? 'Enter at least two numbers.')
      return
    }
    setError(null)
    onApply(sanitizeArrayInput(parsed.values))
  }

  const handleRandom = () => {
    const values = generateRandomArray(8)
    setDraft(values.join(', '))
    setError(null)
    onApply(values)
  }

  return (
    <div className={styles.arrayInput} aria-label="Array input">
      <label className={styles.field}>
        <span className={styles.label}>Array</span>
        <input
          className={styles.input}
          type="text"
          value={draft}
          placeholder={`e.g. 5, 12, 3, 9 (2–${ARRAY_INPUT_MAX_LENGTH} numbers, max ${ARRAY_INPUT_MAX_VALUE})`}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleApply()
            }
          }}
          disabled={disabled}
        />
      </label>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          onClick={handleApply}
          disabled={disabled}
        >
          Apply array
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.secondary}`}
          onClick={handleRandom}
          disabled={disabled}
        >
          Generate random array
        </button>
      </div>
      {error !== null ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
