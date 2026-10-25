import { create } from 'zustand'
import { createBaseRequest } from '../features/configurator/scenarios'
import type {
  HumanDecision,
  HumanReview,
  LedgerRecord,
  RequestInput,
  RuleResult,
  SynthesisCandidate,
  UserRole,
  WorkflowState,
} from '../types/gdls'
import { buildRecordHashInput, sha256 } from '../utils/hash'
import { validateRationale } from '../utils/rules'
import { runSimulationForInput } from '../utils/simulation'

interface Metrics {
  totalRequests: number
  autonomousCount: number
  discretionCount: number
  rejectionCount: number
  avgGenerationMs: number
  avgReviewMs: number
}

interface SimulationStore {
  state: WorkflowState
  announcement: string
  currentRequest: RequestInput
  processing: boolean
  stage1Results: RuleResult[]
  stage3Results: RuleResult[]
  candidate?: SynthesisCandidate
  ledger: LedgerRecord[]
  metrics: Metrics
  discretionStartedAt?: number
  setRequest: (request: RequestInput) => void
  runSimulation: () => Promise<void>
  resolveDiscretion: (reviewerRole: UserRole, decision: HumanDecision, rationale: string) => Promise<boolean>
  reset: () => void
}

const initialMetrics: Metrics = {
  totalRequests: 0,
  autonomousCount: 0,
  discretionCount: 0,
  rejectionCount: 0,
  avgGenerationMs: 0,
  avgReviewMs: 0,
}

const addAverage = (currentAverage: number, currentCount: number, value: number): number => {
  if (currentCount <= 1) {
    return value
  }

  return (currentAverage * (currentCount - 1) + value) / currentCount
}

const buildLedgerRecord = async ({
  request,
  stage1Results,
  candidate,
  stage3Results,
  routingPath,
  finalDisposition,
  previousRecordHash,
  humanDecision,
}: {
  request: RequestInput
  stage1Results: RuleResult[]
  candidate?: SynthesisCandidate
  stage3Results?: RuleResult[]
  routingPath: LedgerRecord['routingPath']
  finalDisposition: WorkflowState
  previousRecordHash: string
  humanDecision?: HumanReview
}): Promise<LedgerRecord> => {
  const baseRecord: Omit<LedgerRecord, 'currentRecordHash'> = {
    requestId: request.requestId,
    timestamp: new Date().toISOString(),
    requestType: request.requestType,
    userRole: request.userRole,
    stage1Results,
    candidateSynthesis: candidate,
    stage3Results,
    routingPath,
    humanDecision,
    finalDisposition,
    previousRecordHash,
  }

  const currentRecordHash = await sha256(buildRecordHashInput(baseRecord))

  return {
    ...baseRecord,
    currentRecordHash,
  }
}

const defaultAnnouncement = 'Simulation is idle.'

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  state: 'IDLE',
  announcement: defaultAnnouncement,
  currentRequest: createBaseRequest(),
  processing: false,
  stage1Results: [],
  stage3Results: [],
  candidate: undefined,
  ledger: [],
  metrics: initialMetrics,
  discretionStartedAt: undefined,
  setRequest: (request) => {
    if (get().processing) {
      return
    }

    set({ currentRequest: request })
  },
  runSimulation: async () => {
    if (get().processing) {
      return
    }

    const request = get().currentRequest

    set({
      processing: true,
      state: 'VALIDATING_INPUT',
      announcement: `Validating ${request.requestId} at pre-synthesis gate.`,
      stage1Results: [],
      stage3Results: [],
      candidate: undefined,
      discretionStartedAt: undefined,
    })

    const result = await runSimulationForInput(request)

    if (result.state === 'PRE_GATE_REJECTED') {
      const previous = get().ledger.at(-1)?.currentRecordHash ?? 'GENESIS'
      const record = await buildLedgerRecord({
        request,
        stage1Results: result.stage1Results,
        routingPath: 'REJECTED_BY_POLICY',
        finalDisposition: 'PRE_GATE_REJECTED',
        previousRecordHash: previous,
      })

      set((state) => ({
        processing: false,
        state: 'PRE_GATE_REJECTED',
        announcement: `${request.requestId} rejected at Stage 1 policy gate.`,
        stage1Results: result.stage1Results,
        ledger: [...state.ledger, record],
        metrics: {
          ...state.metrics,
          totalRequests: state.metrics.totalRequests + 1,
          rejectionCount: state.metrics.rejectionCount + 1,
        },
      }))
      return
    }

    set({
      state: 'SYNTHESIZING',
      announcement: `Synthesizing candidate for ${request.requestId} in sandboxed SGS.`,
    })

    set({
      state: 'VALIDATING_OUTPUT',
      announcement: `Validating synthesized output for ${request.requestId} at post-synthesis gate.`,
      stage1Results: result.stage1Results,
      candidate: result.candidate,
      stage3Results: result.stage3Results ?? [],
    })

    const previous = get().ledger.at(-1)?.currentRecordHash ?? 'GENESIS'
    const isAutonomous = result.state === 'AUTONOMOUS_SUCCESS'
    const finalDisposition: WorkflowState = isAutonomous ? 'AUTONOMOUS_SUCCESS' : 'DISCRETION_REQUIRED'
    const routingPath = isAutonomous ? 'AUTONOMOUS_SUCCESS' : 'DISCRETION_FORK_REQUIRED'
    const record = await buildLedgerRecord({
      request,
      stage1Results: result.stage1Results,
      candidate: result.candidate,
      stage3Results: result.stage3Results,
      routingPath,
      finalDisposition,
      previousRecordHash: previous,
    })

    set((state) => {
      const totalRequests = state.metrics.totalRequests + 1
      const generationMs = result.candidate?.generationTimeMs ?? 0

      return {
        processing: false,
        state: finalDisposition,
        announcement: isAutonomous
          ? `${request.requestId} routed to autonomous execution.`
          : `${request.requestId} requires contextual discretion review.`,
        stage1Results: result.stage1Results,
        candidate: result.candidate,
        stage3Results: result.stage3Results ?? [],
        ledger: [...state.ledger, record],
        discretionStartedAt: isAutonomous ? undefined : performance.now(),
        metrics: {
          totalRequests,
          autonomousCount: state.metrics.autonomousCount + (isAutonomous ? 1 : 0),
          discretionCount: state.metrics.discretionCount + (isAutonomous ? 0 : 1),
          rejectionCount: state.metrics.rejectionCount,
          avgGenerationMs: addAverage(state.metrics.avgGenerationMs, totalRequests, generationMs),
          avgReviewMs: state.metrics.avgReviewMs,
        },
      }
    })
  },
  resolveDiscretion: async (reviewerRole, decision, rationale) => {
    const current = get()

    if (current.state !== 'DISCRETION_REQUIRED') {
      return false
    }

    if (decision !== 'ESCALATE' && !validateRationale(rationale)) {
      return false
    }

    const previous = current.ledger.at(-1)?.currentRecordHash ?? 'GENESIS'

    const humanDecision: HumanReview = {
      reviewerRole,
      decision,
      rationale,
      timestamp: new Date().toISOString(),
    }

    const finalDisposition: WorkflowState =
      decision === 'APPROVE_OVERRIDE' || decision === 'REJECT' ? 'HUMAN_RESOLVED' : 'ESCALATED'

    const routingPath = decision === 'ESCALATE' ? 'ESCALATED' : current.ledger.at(-1)?.routingPath ?? 'DISCRETION_FORK_REQUIRED'

    const record = await buildLedgerRecord({
      request: current.currentRequest,
      stage1Results: current.stage1Results,
      candidate: current.candidate,
      stage3Results: current.stage3Results,
      routingPath,
      finalDisposition,
      previousRecordHash: previous,
      humanDecision,
    })

    set((state) => {
      const reviewMs =
        decision === 'ESCALATE' || state.discretionStartedAt === undefined
          ? state.metrics.avgReviewMs
          : addAverage(
              state.metrics.avgReviewMs,
              state.metrics.discretionCount,
              Math.max(0, performance.now() - state.discretionStartedAt),
            )

      return {
        state: finalDisposition,
        processing: false,
        announcement:
          decision === 'ESCALATE'
            ? `${state.currentRequest.requestId} escalated after discretion review.`
            : `${state.currentRequest.requestId} resolved by human discretion decision.`,
        ledger: [...state.ledger, record],
        metrics: {
          ...state.metrics,
          avgReviewMs: reviewMs,
        },
      }
    })

    return true
  },
  reset: () => {
    if (get().processing) {
      return
    }

    set({
      state: 'IDLE',
      announcement: defaultAnnouncement,
      currentRequest: createBaseRequest(),
      stage1Results: [],
      stage3Results: [],
      candidate: undefined,
    })
  },
}))
