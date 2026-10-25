import type { RequestInput, RuleResult, SynthesisCandidate } from '../types/gdls'
import { ROLE_CEILINGS } from '../types/gdls'

export const MIN_CONFIDENCE = 0.85
export const MAX_ABS_VARIANCE_PERCENT = 10

const status = (pass: boolean): 'PASS' | 'FAIL' => (pass ? 'PASS' : 'FAIL')

const formatBool = (value: boolean): string => (value ? 'true' : 'false')

const formatPercent = (value: number): string => `${value.toFixed(2)}%`

export const validateProjectCode = (projectCode: string): boolean => projectCode.startsWith('PRJ-')

export const validateRationale = (rationale: string): boolean => rationale.trim().length >= 12

export const evaluateStage1 = (input: RequestInput): RuleResult[] => {
  const schemaValid = !input.toggles.schemaViolation
  const projectCodeValid = validateProjectCode(input.projectCode) && !input.toggles.invalidProjectCode
  const requestedAmountPositive = input.requestedAmount > 0
  const roleCeiling = ROLE_CEILINGS[input.userRole]
  const withinCeiling = input.requestedAmount <= roleCeiling && !input.toggles.authorityCeilingExceeded

  return [
    {
      ruleId: 'S1-RBAC',
      label: 'RBAC permission',
      status: status(!input.toggles.rbacViolation),
      message: input.toggles.rbacViolation
        ? 'User role is not permitted to submit this request.'
        : 'Role check passed.',
      expectedValue: 'No RBAC violation',
      observedValue: input.toggles.rbacViolation ? 'Violation detected' : 'No violation',
    },
    {
      ruleId: 'S1-SCHEMA',
      label: 'Schema validation',
      status: status(schemaValid),
      message: schemaValid ? 'Input schema is valid.' : 'Required fields failed schema checks.',
      expectedValue: 'Valid schema',
      observedValue: schemaValid ? 'Valid' : 'Invalid',
    },
    {
      ruleId: 'S1-PROJECT',
      label: 'Project code format',
      status: status(projectCodeValid),
      message: projectCodeValid ? 'Project code format is valid.' : 'Project code must begin with PRJ-.',
      expectedValue: 'Prefix PRJ-',
      observedValue: input.projectCode,
    },
    {
      ruleId: 'S1-AMOUNT-POSITIVE',
      label: 'Positive requested amount',
      status: status(requestedAmountPositive),
      message: requestedAmountPositive ? 'Requested amount is positive.' : 'Amount must be greater than zero.',
      expectedValue: '> 0',
      observedValue: String(input.requestedAmount),
    },
    {
      ruleId: 'S1-CEILING',
      label: 'Role authorization ceiling',
      status: status(withinCeiling),
      message: withinCeiling
        ? 'Requested amount is within role ceiling.'
        : 'Requested amount exceeds authorized ceiling.',
      expectedValue: `<= ${roleCeiling}`,
      observedValue: String(input.requestedAmount),
    },
  ]
}

export const computeVariancePercent = (requestedAmount: number, proposedAmount: number): number => {
  if (requestedAmount === 0) {
    return 0
  }

  return ((proposedAmount - requestedAmount) / Math.abs(requestedAmount)) * 100
}

export const evaluateStage3 = (candidate: SynthesisCandidate): RuleResult[] => {
  const variance = Math.abs(computeVariancePercent(candidate.requestedAmount, candidate.proposedAmount))

  return [
    {
      ruleId: 'S3-CONFIDENCE',
      label: 'Confidence threshold',
      status: status(candidate.confidence >= MIN_CONFIDENCE),
      message:
        candidate.confidence >= MIN_CONFIDENCE
          ? 'Confidence meets threshold.'
          : 'Confidence is below the minimum threshold.',
      expectedValue: `>= ${MIN_CONFIDENCE}`,
      observedValue: candidate.confidence.toFixed(2),
    },
    {
      ruleId: 'S3-CITATIONS',
      label: 'Citation availability',
      status: status(candidate.citations.length > 0),
      message:
        candidate.citations.length > 0
          ? 'At least one citation is present.'
          : 'No citations were provided by synthesis.',
      expectedValue: '>= 1 citation',
      observedValue: String(candidate.citations.length),
    },
    {
      ruleId: 'S3-GROUNDING',
      label: 'Grounding verification',
      status: status(candidate.groundingPass),
      message: candidate.groundingPass ? 'Grounding check passed.' : 'Grounding verification failed.',
      expectedValue: formatBool(true),
      observedValue: formatBool(candidate.groundingPass),
    },
    {
      ruleId: 'S3-VARIANCE',
      label: 'Amount variance',
      status: status(variance <= MAX_ABS_VARIANCE_PERCENT),
      message:
        variance <= MAX_ABS_VARIANCE_PERCENT
          ? 'Proposed amount variance is within allowed range.'
          : 'Proposed amount variance exceeds allowed limit.',
      expectedValue: `<= ${MAX_ABS_VARIANCE_PERCENT}%`,
      observedValue: formatPercent(variance),
    },
    {
      ruleId: 'S3-POLICY',
      label: 'Policy compliance',
      status: status(!candidate.policyViolation),
      message: candidate.policyViolation ? 'Explicit policy violation detected.' : 'No explicit policy violation.',
      expectedValue: 'No policy violation',
      observedValue: candidate.policyViolation ? 'Violation detected' : 'No violation',
    },
  ]
}

export const allRulesPassed = (results: RuleResult[]): boolean =>
  results.every((result) => result.status === 'PASS')
