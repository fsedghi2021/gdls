import { describe, expect, it } from 'vitest'
import { SCENARIOS, createBaseRequest } from '../features/configurator/scenarios'
import type { LedgerRecord } from '../types/gdls'
import { ROLE_CEILINGS } from '../types/gdls'
import { buildRecordHashInput, sha256 } from '../utils/hash'
import {
  MAX_ABS_VARIANCE_PERCENT,
  MIN_CONFIDENCE,
  allRulesPassed,
  evaluateStage1,
  evaluateStage3,
  validateProjectCode,
  validateRationale,
} from '../utils/rules'
import { runSimulationForInput } from '../utils/simulation'

describe('stage 1 rules', () => {
  it('enforces role ceilings', () => {
    const request = {
      ...createBaseRequest(),
      requestedAmount: ROLE_CEILINGS.Analyst + 1,
      toggles: { ...createBaseRequest().toggles, authorityCeilingExceeded: true },
    }

    const results = evaluateStage1(request)
    const ceilingRule = results.find((rule) => rule.ruleId === 'S1-CEILING')

    expect(ceilingRule?.status).toBe('FAIL')
  })

  it('validates project code prefix', () => {
    expect(validateProjectCode('PRJ-123')).toBe(true)
    expect(validateProjectCode('ABC-123')).toBe(false)
  })
})

describe('stage 3 rules', () => {
  it('applies confidence threshold', () => {
    const request = createBaseRequest()
    const candidate = {
      recommendation: 'x',
      rationale: 'x',
      requestedAmount: request.requestedAmount,
      proposedAmount: request.requestedAmount,
      confidence: MIN_CONFIDENCE - 0.01,
      risk: 0.2,
      citations: ['c1'],
      groundingPass: true,
      policyViolation: false,
      generationTimeMs: 10,
    }

    const results = evaluateStage3(candidate)
    expect(results.find((rule) => rule.ruleId === 'S3-CONFIDENCE')?.status).toBe('FAIL')
  })

  it('requires at least one citation', () => {
    const request = createBaseRequest()
    const candidate = {
      recommendation: 'x',
      rationale: 'x',
      requestedAmount: request.requestedAmount,
      proposedAmount: request.requestedAmount,
      confidence: 0.9,
      risk: 0.2,
      citations: [],
      groundingPass: true,
      policyViolation: false,
      generationTimeMs: 10,
    }

    const results = evaluateStage3(candidate)
    expect(results.find((rule) => rule.ruleId === 'S3-CITATIONS')?.status).toBe('FAIL')
  })

  it('enforces ten-percent variance boundary', () => {
    const request = createBaseRequest()
    const passCandidate = {
      recommendation: 'x',
      rationale: 'x',
      requestedAmount: request.requestedAmount,
      proposedAmount: request.requestedAmount * (1 + MAX_ABS_VARIANCE_PERCENT / 100),
      confidence: 0.9,
      risk: 0.2,
      citations: ['c1'],
      groundingPass: true,
      policyViolation: false,
      generationTimeMs: 10,
    }

    const failCandidate = {
      ...passCandidate,
      proposedAmount: request.requestedAmount * (1 + (MAX_ABS_VARIANCE_PERCENT + 0.01) / 100),
    }

    expect(evaluateStage3(passCandidate).find((rule) => rule.ruleId === 'S3-VARIANCE')?.status).toBe('PASS')
    expect(evaluateStage3(failCandidate).find((rule) => rule.ruleId === 'S3-VARIANCE')?.status).toBe('FAIL')
  })
})

describe('scenario routing', () => {
  it('routes each preset scenario correctly', async () => {
    const expected: Record<string, 'REJECTED_BY_POLICY' | 'AUTONOMOUS_SUCCESS' | 'DISCRETION_FORK_REQUIRED'> = {
      'low-risk-valid': 'AUTONOMOUS_SUCCESS',
      'authority-exceeded': 'REJECTED_BY_POLICY',
      'missing-citation': 'DISCRETION_FORK_REQUIRED',
      'low-confidence': 'DISCRETION_FORK_REQUIRED',
      'excessive-variance': 'DISCRETION_FORK_REQUIRED',
      'validated-manager': 'AUTONOMOUS_SUCCESS',
    }

    for (const scenario of SCENARIOS) {
      const result = await runSimulationForInput(scenario.build(), 0)
      expect(result.routingPath).toBe(expected[scenario.id])

      if (result.routingPath === 'AUTONOMOUS_SUCCESS') {
        expect(allRulesPassed(result.stage1Results)).toBe(true)
        expect(allRulesPassed(result.stage3Results ?? [])).toBe(true)
      }
    }
  })
})

describe('rationale and ledger hash chain', () => {
  it('requires minimum rationale length', () => {
    expect(validateRationale('too short')).toBe(false)
    expect(validateRationale('valid rationale text')).toBe(true)
  })

  it('chains ledger hashes using prior record hash', async () => {
    const baseRequest = createBaseRequest()

    const firstBase: Omit<LedgerRecord, 'currentRecordHash'> = {
      requestId: baseRequest.requestId,
      timestamp: '2026-01-01T00:00:00.000Z',
      requestType: baseRequest.requestType,
      userRole: baseRequest.userRole,
      stage1Results: [],
      routingPath: 'AUTONOMOUS_SUCCESS',
      finalDisposition: 'AUTONOMOUS_SUCCESS',
      previousRecordHash: 'GENESIS',
    }

    const firstHash = await sha256(buildRecordHashInput(firstBase))

    const secondBase: Omit<LedgerRecord, 'currentRecordHash'> = {
      ...firstBase,
      requestId: `${baseRequest.requestId}-2`,
      previousRecordHash: firstHash,
    }

    const secondHash = await sha256(buildRecordHashInput(secondBase))

    expect(firstHash).not.toEqual(secondHash)
    expect(secondBase.previousRecordHash).toEqual(firstHash)
  })
})
