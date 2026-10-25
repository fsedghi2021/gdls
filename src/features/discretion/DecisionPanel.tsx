import { useMemo, useState } from 'react'
import type { RuleResult, UserRole, WorkflowState } from '../../types/gdls'
import { validateRationale } from '../../utils/rules'

interface Props {
  state: WorkflowState
  stage1Results: RuleResult[]
  stage3Results: RuleResult[]
  onDecision: (reviewerRole: UserRole, decision: 'APPROVE_OVERRIDE' | 'REJECT' | 'ESCALATE', rationale: string) => Promise<boolean>
  citations: string[]
}

export function DecisionPanel({ state, stage1Results, stage3Results, onDecision, citations }: Props) {
  const [reviewerRole, setReviewerRole] = useState<UserRole>('Manager')
  const [rationale, setRationale] = useState('')
  const [error, setError] = useState('')

  const failedRules = useMemo(
    () => [...stage1Results, ...stage3Results].filter((result) => result.status === 'FAIL'),
    [stage1Results, stage3Results],
  )

  const handleDecision = async (decision: 'APPROVE_OVERRIDE' | 'REJECT' | 'ESCALATE') => {
    if (decision !== 'ESCALATE' && !validateRationale(rationale)) {
      setError('Rationale must be at least 12 characters for approve/reject decisions.')
      return
    }

    const success = await onDecision(reviewerRole, decision, rationale)

    if (!success) {
      setError('Decision could not be recorded for the current workflow state.')
      return
    }

    setError('')
    setRationale('')
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Decision and Exception Review</h2>
      <p className="mt-1 text-sm text-slate-600">State: {state}</p>

      {failedRules.length > 0 ? (
        <div className="mt-3 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">Failed controls</h3>
          {failedRules.map((rule) => (
            <article key={rule.ruleId} className="rounded border border-orange-300 bg-orange-50 p-2 text-sm">
              <p className="font-medium text-orange-900">{rule.label}</p>
              <p className="text-orange-800">Expected: {rule.expectedValue}</p>
              <p className="text-orange-800">Observed: {rule.observedValue}</p>
              <p className="text-orange-700">{rule.message}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">No failed rules for this request.</p>
      )}

      <div className="mt-3 rounded border border-slate-200 p-2 text-sm">
        <p className="font-medium text-slate-800">Fork details</p>
        <p>Fork ID: FORK-{new Date().getFullYear()}</p>
        <p>Citations: {citations.length ? citations.join(', ') : 'None provided'}</p>
      </div>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Reviewer role
        <select
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
          value={reviewerRole}
          onChange={(event) => setReviewerRole(event.target.value as UserRole)}
        >
          <option value="Analyst">Analyst</option>
          <option value="Manager">Manager</option>
          <option value="Executive">Executive</option>
        </select>
      </label>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Human rationale
        <textarea
          className="mt-1 h-20 w-full rounded border border-slate-300 px-2 py-1"
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
          placeholder="Minimum 12 characters for approve or reject"
        />
      </label>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-green-600 px-3 py-1 text-sm font-semibold text-white disabled:bg-slate-400"
          onClick={() => handleDecision('APPROVE_OVERRIDE')}
          disabled={state !== 'DISCRETION_REQUIRED'}
        >
          Approve Override
        </button>
        <button
          type="button"
          className="rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white disabled:bg-slate-400"
          onClick={() => handleDecision('REJECT')}
          disabled={state !== 'DISCRETION_REQUIRED'}
        >
          Reject
        </button>
        <button
          type="button"
          className="rounded bg-orange-500 px-3 py-1 text-sm font-semibold text-white disabled:bg-slate-400"
          onClick={() => handleDecision('ESCALATE')}
          disabled={state !== 'DISCRETION_REQUIRED'}
        >
          Escalate
        </button>
      </div>
    </section>
  )
}
