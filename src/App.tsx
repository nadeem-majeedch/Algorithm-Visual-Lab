import { useCallback, useMemo, useState } from 'react'

import { getRegisteredAlgorithm } from './algorithms/registry'
import { AlgorithmSelector } from './components/AlgorithmSelector/AlgorithmSelector'
import { AlgorithmWorkspace } from './components/AlgorithmWorkspace/AlgorithmWorkspace'
import { AppShell } from './components/AppShell/AppShell'
import { ArrayInput } from './components/ArrayInput/ArrayInput'
import { ArrayVisualizer } from './components/ArrayVisualizer/ArrayVisualizer'
import { ComplexityPanel } from './components/ComplexityPanel/ComplexityPanel'
import { HistoryTimeline } from './components/HistoryTimeline/HistoryTimeline'
import { HeapTree } from './components/HeapTree/HeapTree'
import { PlaybackControls } from './components/PlaybackControls/PlaybackControls'
import { PseudocodePanel } from './components/PseudocodePanel/PseudocodePanel'
import { Sidebar } from './components/Sidebar/Sidebar'
import { StepInspector } from './components/StepInspector/StepInspector'
import { VisualizationPanel } from './components/VisualizationPanel/VisualizationPanel'
import {
  algorithmCategories,
  algorithmLearningInfo,
} from './features/catalog/algorithmCatalog'
import { extractSortViewModel } from './features/visualization/sortViewModel'
import { GraphView } from './components/GraphView/GraphView'
import { fixtureUndirected } from './tests/helpers/graphFixtures'
import { useExecutionController } from './hooks/useExecutionController'
import { useHashRoute } from './hooks/useHashRoute'
import { findAlgorithm } from './models/catalog'

/**
 * Application root: hash route → registry lookup → ExecutionController.
 *
 * The deterministic engine owns execution; this component owns
 * presentation only — it reads immutable snapshots and forwards user
 * intent (play, step, seek, array changes) to the controller.
 */
export function App() {
  const [route, navigate] = useHashRoute()
  const selection = useMemo(
    () => findAlgorithm(algorithmCategories, route),
    [route],
  )
  const definition = useMemo(() => getRegisteredAlgorithm(route), [route])
  const [values, setValues] = useState<number[]>([42, 7, 19, 88, 3, 56, 23, 71])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const {
    snapshot,
    isPlaying,
    speed,
    togglePlay,
    restart,
    next,
    previous,
    jumpTo,
    setSpeed,
  } = useExecutionController(definition, { values })

  const step = snapshot?.engine?.step ?? null
  const view = extractSortViewModel(step)
  const heapState = step?.state as
    | {
        heapSize?: number
        parent?: number | null
        child?: number | null
        largest?: number | null
      }
    | undefined
  const currentStep = snapshot?.currentStep ?? null
  const totalSteps = snapshot?.totalSteps ?? null

  const handleApplyArray = useCallback((next: number[]) => {
    setValues(next)
  }, [])

  const handleSelectAlgorithm = useCallback(
    (algorithmId: string) => {
      navigate(algorithmId)
    },
    [navigate],
  )

  const learningInfo = selection
    ? algorithmLearningInfo[selection.algorithm.id] ?? null
    : null

  return (
    <AppShell
      sidebar={
        <Sidebar
          activeAlgorithmId={selection?.algorithm.id ?? ''}
          onSelectAlgorithm={handleSelectAlgorithm}
        />
      }
      status={
        definition
          ? `${selection?.algorithm.label ?? 'Algorithm'} — ${totalSteps ?? 0} deterministic steps loaded.`
          : selection
            ? `${selection.algorithm.label} is not implemented yet — engine lands in a later phase.`
            : 'No algorithm selected — pick one from the sidebar or the selector.'
      }
    >
      {route === 'graph-demo' ? (
        <section className="panel" aria-label="Graph demo">
          <h3 className="panel-title">Graph infrastructure demo</h3>
          <GraphView
            graph={fixtureUndirected()}
            highlight={{ selectedNode }}
            onSelectNode={(id) => setSelectedNode((current) => (current === id ? null : id))}
          />
        </section>
      ) : (
      <AlgorithmWorkspace
        title={selection ? selection.algorithm.label : 'Algorithm Visual Lab'}
        categoryLabel={
          selection
            ? selection.category.label
            : 'Choose an algorithm to inspect its workspace'
        }
        visualization={
          definition && view ? (
            <section className="panel" aria-label="Visualization">
              <h3 className="panel-title">Visualization</h3>
              <ArrayVisualizer
                values={view.values}
                highlights={step?.highlights ?? []}
                sortedFrom={view.sortedFrom ?? undefined}
                sortedTo={view.sortedTo ?? undefined}
                buffer={view.buffer}
              />
              {route === 'heap-sort' && heapState?.heapSize !== undefined ? (
                <HeapTree
                  values={view.values}
                  heapSize={heapState.heapSize}
                  parent={heapState.parent ?? null}
                  child={heapState.child ?? null}
                  largest={heapState.largest ?? null}
                />
              ) : null}
            </section>
          ) : (
            <VisualizationPanel algorithm={selection?.algorithm ?? null} />
          )
        }
        inspector={
          <div className="workspace-column">
            <StepInspector
              step={step}
              currentStep={currentStep ?? 0}
              totalSteps={totalSteps ?? 0}
            />
            {learningInfo ? (
              <ComplexityPanel learningInfo={learningInfo} />
            ) : null}
          </div>
        }
        timeline={
          <div className="workspace-column">
            <HistoryTimeline
              totalSteps={totalSteps}
              currentStep={currentStep}
              onSeek={jumpTo}
            />
            {learningInfo ? (
              <PseudocodePanel lines={learningInfo.pseudocode} />
            ) : null}
          </div>
        }
        controls={
          <div className="workspace-column">
            <PlaybackControls
              isPlaying={isPlaying}
              speed={speed}
              currentStep={currentStep}
              totalSteps={totalSteps}
              onTogglePlay={togglePlay}
              onPrevious={previous}
              onNext={next}
              onRestart={restart}
              onSpeedChange={setSpeed}
            />
            <AlgorithmSelector
              selectedAlgorithmId={selection?.algorithm.id ?? ''}
              onSelectAlgorithm={handleSelectAlgorithm}
            />
            <ArrayInput onApply={handleApplyArray} disabled={isPlaying} />
          </div>
        }
      />
      )}
    </AppShell>
  )
}
