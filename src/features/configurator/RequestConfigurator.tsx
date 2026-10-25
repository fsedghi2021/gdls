import type { ChangeEvent } from 'react'
import { SCENARIOS } from './scenarios'
import type { RequestInput, UserRole, ViolationToggles } from '../../types/gdls'
import { REQUEST_TYPES, ROLE_CEILINGS } from '../../types/gdls'

interface Props {
  request: RequestInput
  onChange: (next: RequestInput) => void
  onRun: () => void
  disabled: boolean
  stateLabel: string
  onScenario: (request: RequestInput) => void
}

const toggleEntries: Array<{ key: keyof ViolationToggles; label: string }> = [
  { key: 'rbacViolation', label: 'RBAC violation' },
  { key: 'schemaViolation', label: 'Schema violation' },
  { key: 'invalidProjectCode', label: 'Invalid project code' },
  { key: 'authorityCeilingExceeded', label: 'Authority ceiling exceeded' },
  { key: 'policyViolation', label: 'Policy violation' },
  { key: 'confidenceFailure', label: 'Confidence failure' },
  { key: 'excessiveVariance', label: 'Excessive variance' },
  { key: 'missingCitation', label: 'Missing citation' },
]

export function RequestConfigurator({
  request,
  onChange,
  onRun,
  disabled,
  stateLabel,
  onScenario,
}: Props) {
  const updateField = <K extends keyof RequestInput>(key: K, value: RequestInput[K]) => {
    onChange({ ...request, [key]: value })
  }

  const onToggle = (event: ChangeEvent<HTMLInputElement>) => {
    const key = event.target.name as keyof ViolationToggles
    onChange({
      ...request,
      toggles: {
        ...request.toggles,
        [key]: event.target.checked,
      },
    })
  }

  const role = request.userRole as UserRole

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Request Configurator</h2>
      <p className="mt-1 text-sm text-slate-600">Current state: {stateLabel}</p>
      <p className="text-xs text-slate-500">Request ID: {request.requestId}</p>

      <div className="mt-3 space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Request type
          <select
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            value={request.requestType}
            onChange={(event) => updateField('requestType', event.target.value as RequestInput['requestType'])}
            disabled={disabled}
          >
            {REQUEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          User role
          <select
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            value={request.userRole}
            onChange={(event) => updateField('userRole', event.target.value as RequestInput['userRole'])}
            disabled={disabled}
          >
            {Object.keys(ROLE_CEILINGS).map((roleName) => (
              <option key={roleName} value={roleName}>
                {roleName} (ceiling {ROLE_CEILINGS[roleName as UserRole].toLocaleString()})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Requested amount
          <input
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            type="number"
            value={request.requestedAmount}
            onChange={(event) => updateField('requestedAmount', Number(event.target.value))}
            disabled={disabled}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Project code
          <input
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            value={request.projectCode}
            onChange={(event) => updateField('projectCode', event.target.value)}
            disabled={disabled}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700">
            Risk (0-1)
            <input
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={request.riskScore}
              onChange={(event) => updateField('riskScore', Number(event.target.value))}
              disabled={disabled}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Confidence (0-1)
            <input
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={request.confidenceScore}
              onChange={(event) => updateField('confidenceScore', Number(event.target.value))}
              disabled={disabled}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700">
            Variance %
            <input
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              type="number"
              step={0.1}
              value={request.proposedVariancePercent}
              onChange={(event) => updateField('proposedVariancePercent', Number(event.target.value))}
              disabled={disabled}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Citation count
            <input
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              type="number"
              min={0}
              value={request.citationCount}
              onChange={(event) => updateField('citationCount', Number(event.target.value))}
              disabled={disabled}
            />
          </label>
        </div>
      </div>

      <fieldset className="mt-4 rounded border border-slate-200 p-2">
        <legend className="px-1 text-sm font-medium">Violation toggles</legend>
        <div className="grid grid-cols-1 gap-1">
          {toggleEntries.map((entry) => (
            <label key={entry.key} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name={entry.key}
                checked={request.toggles[entry.key]}
                onChange={onToggle}
                disabled={disabled}
              />
              <span>{entry.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-700">Scenarios</p>
        <div className="mt-2 grid grid-cols-1 gap-2">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className="rounded border border-slate-300 bg-slate-100 px-2 py-1 text-left text-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => onScenario(scenario.build())}
              disabled={disabled}
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        onClick={onRun}
        disabled={disabled}
      >
        Run Simulation
      </button>
      <p className="mt-2 text-xs text-slate-500">Role ceiling for {role}: {ROLE_CEILINGS[role].toLocaleString()}</p>
    </section>
  )
}
