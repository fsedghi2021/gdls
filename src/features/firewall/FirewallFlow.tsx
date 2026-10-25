import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react'
import type { WorkflowState } from '../../types/gdls'

interface Props {
  state: WorkflowState
}

const nodes: Node[] = [
  { id: 'input', position: { x: 10, y: 120 }, data: { label: 'Enterprise Input' }, type: 'default' },
  { id: 's1', position: { x: 210, y: 120 }, data: { label: 'Stage 1: Pre-Synthesis DPG' }, type: 'default' },
  { id: 's2', position: { x: 450, y: 120 }, data: { label: 'Stage 2: Sandboxed SGS' }, type: 'default' },
  { id: 's3', position: { x: 690, y: 120 }, data: { label: 'Stage 3: Post-Synthesis DPG' }, type: 'default' },
  { id: 'path-a', position: { x: 930, y: 60 }, data: { label: 'Path A: Autonomous Execution' }, type: 'default' },
  { id: 'path-b', position: { x: 930, y: 180 }, data: { label: 'Path B: Contextual Discretion Fork' }, type: 'default' },
  { id: 'ledger', position: { x: 1170, y: 120 }, data: { label: 'Governance Ledger' }, type: 'default' },
]

const baseEdges: Edge[] = [
  { id: 'e1', source: 'input', target: 's1' },
  { id: 'e2', source: 's1', target: 's2' },
  { id: 'e3', source: 's2', target: 's3' },
  { id: 'e4', source: 's3', target: 'path-a' },
  { id: 'e5', source: 's3', target: 'path-b' },
  { id: 'e6', source: 'path-a', target: 'ledger' },
  { id: 'e7', source: 'path-b', target: 'ledger' },
]

const stateToEdge = (state: WorkflowState): string => {
  if (state === 'VALIDATING_INPUT') return 'e1'
  if (state === 'SYNTHESIZING') return 'e2'
  if (state === 'VALIDATING_OUTPUT') return 'e3'
  if (state === 'AUTONOMOUS_SUCCESS') return 'e4'
  if (state === 'DISCRETION_REQUIRED' || state === 'HUMAN_RESOLVED' || state === 'ESCALATED') return 'e5'
  if (state === 'PRE_GATE_REJECTED') return 'e1'
  return ''
}

const stateColor = (state: WorkflowState): string => {
  if (state === 'AUTONOMOUS_SUCCESS' || state === 'HUMAN_RESOLVED') return '#27AE60'
  if (state === 'DISCRETION_REQUIRED' || state === 'ESCALATED') return '#F2994A'
  if (state === 'PRE_GATE_REJECTED') return '#C0392B'
  return '#F2C94C'
}

export function FirewallFlow({ state }: Props) {
  const activeEdge = stateToEdge(state)
  const color = stateColor(state)

  const edges = baseEdges.map((edge) => {
    const isActive = edge.id === activeEdge || ((state === 'AUTONOMOUS_SUCCESS' || state === 'HUMAN_RESOLVED') && edge.id === 'e6') || ((state === 'DISCRETION_REQUIRED' || state === 'ESCALATED') && edge.id === 'e7')

    return {
      ...edge,
      animated: isActive,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: {
        stroke: isActive ? color : '#94a3b8',
        strokeWidth: isActive ? 3 : 1.5,
      },
      label: isActive ? 'active' : undefined,
    }
  })

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Three-Stage Firewall Architecture</h2>
      <p className="mb-2 text-sm text-slate-600">Animated edge indicates active simulation segment.</p>
      <div className="h-[320px] w-full rounded border border-slate-200">
        <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </section>
  )
}
