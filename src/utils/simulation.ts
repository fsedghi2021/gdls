import { runSynthesis } from '../services/synthesis'
import type { RequestInput, SimulationResult } from '../types/gdls'
import { allRulesPassed, evaluateStage1, evaluateStage3 } from './rules'

export const runSimulationForInput = async (
  input: RequestInput,
  delayMs?: number,
): Promise<SimulationResult> => {
  const stage1Results = evaluateStage1(input)

  if (!allRulesPassed(stage1Results)) {
    return {
      state: 'PRE_GATE_REJECTED',
      stage1Results,
      routingPath: 'REJECTED_BY_POLICY',
    }
  }

  const candidate = await runSynthesis(input, delayMs)
  const stage3Results = evaluateStage3(candidate)

  if (allRulesPassed(stage3Results)) {
    return {
      state: 'AUTONOMOUS_SUCCESS',
      stage1Results,
      candidate,
      stage3Results,
      routingPath: 'AUTONOMOUS_SUCCESS',
    }
  }

  return {
    state: 'DISCRETION_REQUIRED',
    stage1Results,
    candidate,
    stage3Results,
    routingPath: 'DISCRETION_FORK_REQUIRED',
  }
}
