import { RefreshCcw } from 'lucide-react'
import { RequestConfigurator } from './features/configurator/RequestConfigurator'
import { createRequestId } from './features/configurator/scenarios'
import { MetricsPanel } from './features/dashboard/MetricsPanel'
import { DecisionPanel } from './features/discretion/DecisionPanel'
import { FirewallFlow } from './features/firewall/FirewallFlow'
import { LedgerPanel } from './features/ledger/LedgerPanel'
import { useSimulationStore } from './store/simulationStore'

function RuleTable({
  title,
  rules,
}: {
  title: string
  rules: { ruleId: string; label: string; status: string; message: string }[]
}) {
  if (rules.length === 0) {
    return null
  }

  return (
    <div className="mt-3 rounded border border-slate-200 p-2">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <ul className="mt-1 space-y-1 text-sm">
        {rules.map((rule) => (
          <li key={rule.ruleId} className="rounded border border-slate-100 bg-slate-50 p-2">
            <p className="font-medium">
              {rule.label}: {rule.status}
            </p>
            <p className="text-slate-600">{rule.message}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function App() {
  const {
    state,
    announcement,
    currentRequest,
    processing,
    stage1Results,
    stage3Results,
    candidate,
    ledger,
    metrics,
    setRequest,
    runSimulation,
    resolveDiscretion,
    reset,
  } = useSimulationStore()

  const runDisabled = processing || state === 'VALIDATING_INPUT' || state === 'SYNTHESIZING' || state === 'VALIDATING_OUTPUT'

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900">
      <header className="border-b border-[#102A43] bg-[#102A43] px-6 py-5 text-white">
        <p className="text-xs font-bold tracking-[0.2em] text-[#F2C94C]">HIGH-VELOCITY ARCHITECTURE</p>
        <h1 className="mt-2 text-2xl font-bold">GDLS Three-Stage Firewall Simulation</h1>
        <p className="mt-1 text-sm">AI generates possibilities. Governance determines permissions.</p>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-4 p-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          This interactive simulation demonstrates deterministic governance controls around probabilistic
          AI outputs. It is for workshops and demonstrations, not production authorization.
        </section>

        <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr_1fr]">
          <RequestConfigurator
            request={currentRequest}
            onChange={setRequest}
            onRun={runSimulation}
            disabled={runDisabled}
            stateLabel={state}
            onScenario={(request) => setRequest({ ...request, requestId: createRequestId() })}
          />

          <div className="space-y-4">
            <FirewallFlow state={state} />
            <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Live Decision Details</h2>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
                  disabled={processing}
                >
                  <RefreshCcw size={14} /> Reset
                </button>
              </div>
              {candidate ? (
                <div className="mt-2 text-sm text-slate-700">
                  <p>Recommendation: {candidate.recommendation}</p>
                  <p>Requested amount: {candidate.requestedAmount.toLocaleString()}</p>
                  <p>Proposed amount: {candidate.proposedAmount.toLocaleString()}</p>
                  <p>Confidence: {candidate.confidence.toFixed(2)}</p>
                  <p>Risk: {candidate.risk.toFixed(2)}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Run a scenario to generate synthesis output.</p>
              )}
              <RuleTable title="Stage 1 results" rules={stage1Results} />
              <RuleTable title="Stage 3 results" rules={stage3Results} />
            </section>
          </div>

          <DecisionPanel
            state={state}
            stage1Results={stage1Results}
            stage3Results={stage3Results}
            onDecision={resolveDiscretion}
            citations={candidate?.citations ?? []}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <MetricsPanel metrics={metrics} />
          <LedgerPanel ledger={ledger} />
        </div>
      </main>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}

export default App
