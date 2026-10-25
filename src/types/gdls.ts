export type RequestType =
  | 'Capital Allocation'
  | 'Procurement Approval'
  | 'Contract Review'
  | 'Budget Transfer'
  | 'Risk Assessment'

export type UserRole = 'Analyst' | 'Manager' | 'Executive'

export type WorkflowState =
  | 'IDLE'
  | 'VALIDATING_INPUT'
  | 'PRE_GATE_REJECTED'
  | 'SYNTHESIZING'
  | 'VALIDATING_OUTPUT'
  | 'AUTONOMOUS_SUCCESS'
  | 'DISCRETION_REQUIRED'
  | 'HUMAN_RESOLVED'
  | 'ESCALATED'

export type RoutingPath =
  | 'REJECTED_BY_POLICY'
  | 'AUTONOMOUS_SUCCESS'
  | 'DISCRETION_FORK_REQUIRED'
  | 'ESCALATED'

export type HumanDecision = 'APPROVE_OVERRIDE' | 'REJECT' | 'ESCALATE'

export interface ViolationToggles {
  rbacViolation: boolean
  schemaViolation: boolean
  invalidProjectCode: boolean
  authorityCeilingExceeded: boolean
  policyViolation: boolean
  confidenceFailure: boolean
  excessiveVariance: boolean
  missingCitation: boolean
}

export interface RequestInput {
  requestId: string
  requestType: RequestType
  userRole: UserRole
  requestedAmount: number
  projectCode: string
  riskScore: number
  confidenceScore: number
  proposedVariancePercent: number
  citationCount: number
  toggles: ViolationToggles
}

export interface RuleResult {
  ruleId: string
  label: string
  status: 'PASS' | 'FAIL'
  message: string
  expectedValue: string
  observedValue: string
}

export interface SynthesisCandidate {
  recommendation: string
  rationale: string
  requestedAmount: number
  proposedAmount: number
  confidence: number
  risk: number
  citations: string[]
  groundingPass: boolean
  policyViolation: boolean
  generationTimeMs: number
}

export interface HumanReview {
  reviewerRole: UserRole
  decision: HumanDecision
  rationale: string
  timestamp: string
}

export interface LedgerRecord {
  requestId: string
  timestamp: string
  requestType: RequestType
  userRole: UserRole
  stage1Results: RuleResult[]
  candidateSynthesis?: SynthesisCandidate
  stage3Results?: RuleResult[]
  routingPath: RoutingPath
  humanDecision?: HumanReview
  finalDisposition: WorkflowState
  previousRecordHash: string
  currentRecordHash: string
}

export interface SimulationResult {
  state: WorkflowState
  stage1Results: RuleResult[]
  candidate?: SynthesisCandidate
  stage3Results?: RuleResult[]
  routingPath: RoutingPath
}

export const ROLE_CEILINGS: Record<UserRole, number> = {
  Analyst: 25_000,
  Manager: 100_000,
  Executive: 1_000_000,
}

export const REQUEST_TYPES: RequestType[] = [
  'Capital Allocation',
  'Procurement Approval',
  'Contract Review',
  'Budget Transfer',
  'Risk Assessment',
]

export const INITIAL_TOGGLES: ViolationToggles = {
  rbacViolation: false,
  schemaViolation: false,
  invalidProjectCode: false,
  authorityCeilingExceeded: false,
  policyViolation: false,
  confidenceFailure: false,
  excessiveVariance: false,
  missingCitation: false,
}
