import type { RequestInput, SynthesisCandidate } from '../types/gdls'

const DEFAULT_DELAY_MS = 300

const wait = async (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })

const recommendationByRisk = (risk: number): string => {
  if (risk <= 0.3) {
    return 'Proceed with autonomous execution path.'
  }

  if (risk <= 0.7) {
    return 'Proceed with caution and monitor variance controls.'
  }

  return 'Route for discretionary review due to elevated risk profile.'
}

export const runSynthesis = async (
  input: RequestInput,
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<SynthesisCandidate> => {
  const start = performance.now()
  await wait(delayMs)

  const confidence = input.toggles.confidenceFailure
    ? Math.min(input.confidenceScore, 0.84)
    : input.confidenceScore
  const citationCount = input.toggles.missingCitation ? 0 : input.citationCount

  const variancePercent = input.toggles.excessiveVariance
    ? Math.max(Math.abs(input.proposedVariancePercent), 11)
    : input.proposedVariancePercent

  const proposedAmount = Number(
    (input.requestedAmount * (1 + variancePercent / 100)).toFixed(2),
  )

  const citations = Array.from({ length: citationCount }, (_, index) => {
    return `SIM-EVID-${input.requestType.replaceAll(' ', '-').toUpperCase()}-${index + 1}`
  })

  return {
    recommendation: recommendationByRisk(input.riskScore),
    rationale: `Deterministic synthesis matched ${input.requestType} controls and produced a bounded recommendation.`,
    requestedAmount: input.requestedAmount,
    proposedAmount,
    confidence,
    risk: input.riskScore,
    citations,
    groundingPass: !input.toggles.schemaViolation,
    policyViolation: input.toggles.policyViolation,
    generationTimeMs: Math.max(Math.round(performance.now() - start), delayMs),
  }
}
