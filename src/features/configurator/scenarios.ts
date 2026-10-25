import type { RequestInput, UserRole } from '../../types/gdls'
import { INITIAL_TOGGLES } from '../../types/gdls'

let sequence = 1

export const createRequestId = (): string => {
  const id = `REQ-${String(sequence).padStart(4, '0')}`
  sequence += 1
  return id
}

export const createBaseRequest = (): RequestInput => ({
  requestId: createRequestId(),
  requestType: 'Capital Allocation',
  userRole: 'Analyst',
  requestedAmount: 20_000,
  projectCode: 'PRJ-ALPHA',
  riskScore: 0.2,
  confidenceScore: 0.91,
  proposedVariancePercent: 2,
  citationCount: 2,
  toggles: { ...INITIAL_TOGGLES },
})

const setRole = (request: RequestInput, role: UserRole): RequestInput => ({
  ...request,
  userRole: role,
})

export const SCENARIOS: Array<{ id: string; label: string; build: () => RequestInput }> = [
  {
    id: 'low-risk-valid',
    label: 'Low-risk valid request',
    build: () => createBaseRequest(),
  },
  {
    id: 'authority-exceeded',
    label: 'Authority exceeded',
    build: () => ({
      ...createBaseRequest(),
      requestedAmount: 30_000,
      toggles: { ...INITIAL_TOGGLES, authorityCeilingExceeded: true },
    }),
  },
  {
    id: 'missing-citation',
    label: 'Missing citation',
    build: () => ({
      ...createBaseRequest(),
      toggles: { ...INITIAL_TOGGLES, missingCitation: true },
      citationCount: 0,
    }),
  },
  {
    id: 'low-confidence',
    label: 'Low confidence',
    build: () => ({
      ...createBaseRequest(),
      confidenceScore: 0.82,
      toggles: { ...INITIAL_TOGGLES, confidenceFailure: true },
    }),
  },
  {
    id: 'excessive-variance',
    label: 'Excessive variance',
    build: () => ({
      ...createBaseRequest(),
      proposedVariancePercent: 15,
      toggles: { ...INITIAL_TOGGLES, excessiveVariance: true },
    }),
  },
  {
    id: 'validated-manager',
    label: 'Fully validated manager request',
    build: () =>
      setRole(
        {
          ...createBaseRequest(),
          requestType: 'Procurement Approval',
          requestedAmount: 90_000,
          projectCode: 'PRJ-GOV',
          confidenceScore: 0.9,
          citationCount: 3,
          riskScore: 0.35,
        },
        'Manager',
      ),
  },
]
