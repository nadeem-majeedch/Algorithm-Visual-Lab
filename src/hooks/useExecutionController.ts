import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ExecutionController } from '../engine/controller'
import type {
  ControllerSnapshot,
  PlaybackSpeed,
} from '../engine/controller'
import type { AlgorithmDefinition } from '../engine/definition'
import type {
  AlgorithmInput,
  AlgorithmState,
} from '../engine/models'
import { PLAYBACK_SPEEDS } from '../engine/controller'

/**
 * React bridge over the framework-free ExecutionController.
 *
 * Separation of concerns (see docs/architecture.md):
 * - algorithm execution: ExecutionEngine (pure, deterministic)
 * - playback timing: THIS hook's interval — the only timer in the app
 * - UI state: the controller snapshot, re-rendered via subscription
 *
 * The interval is cleared on pause, at end-of-run, and on unmount; the
 * engine itself never sees a timer and stepping manually is identical to
 * stepping under playback.
 */
export function useExecutionController(
  definition: AlgorithmDefinition<AlgorithmInput, AlgorithmState> | null,
  input: AlgorithmInput,
): {
  snapshot: ControllerSnapshot<AlgorithmState> | null
  isPlaying: boolean
  speed: PlaybackSpeed
  play: () => void
  pause: () => void
  togglePlay: () => void
  restart: () => void
  next: () => void
  previous: () => void
  jumpTo: (step: number) => void
  setSpeed: (speed: PlaybackSpeed) => void
} {
  const controller = useMemo(() => new ExecutionController(), [])
  const [tick, setTick] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [, setSpeedState] = useState<PlaybackSpeed>(1)
  const inputKey = JSON.stringify(input.values) + JSON.stringify(input.options ?? {})

  // Load (or reload) whenever the definition or input changes.
  useEffect(() => {
    if (definition) {
      controller.loadAlgorithm(
        definition as AlgorithmDefinition<AlgorithmInput, never>,
        input,
      )
      setTick((value) => value + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- inputKey covers input identity
  }, [controller, definition, inputKey])

  // Re-render on controller mutations.
  useEffect(() => {
    const subscription = controller.subscribe(() => {
      setTick((value) => value + 1)
      setIsPlaying(controller.isPlaying())
      setSpeedState(controller.getSpeed())
    })
    return () => subscription.unsubscribe()
  }, [controller])

  // The single presentation timer in the application.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isPlaying) {
      stopTimer()
      return
    }
    intervalRef.current = setInterval(() => {
      controller.tick()
      if (!controller.isPlaying()) {
        stopTimer()
      }
    }, controller.tickDelayMs())
    return stopTimer
  }, [controller, isPlaying, stopTimer, tick])

  const play = useCallback(() => {
    controller.start()
  }, [controller])

  const pause = useCallback(() => {
    controller.pause()
  }, [controller])

  const togglePlay = useCallback(() => {
    if (controller.isPlaying()) {
      controller.pause()
    } else {
      controller.start()
    }
  }, [controller])

  const restart = useCallback(() => {
    controller.reset()
  }, [controller])

  const next = useCallback(() => {
    controller.next()
  }, [controller])

  const previous = useCallback(() => {
    controller.previous()
  }, [controller])

  const jumpTo = useCallback(
    (step: number) => {
      controller.jumpTo(step)
    },
    [controller],
  )

  const setSpeed = useCallback(
    (speed: PlaybackSpeed) => {
      controller.setSpeed(speed)
    },
    [controller],
  )

  return {
    snapshot: controller.getSnapshot(),
    isPlaying,
    speed: controller.getSpeed(),
    play,
    pause,
    togglePlay,
    restart,
    next,
    previous,
    jumpTo,
    setSpeed,
  }
}

export { PLAYBACK_SPEEDS }
