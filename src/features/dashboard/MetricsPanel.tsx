import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Metrics {
  totalRequests: number
  autonomousCount: number
  discretionCount: number
  rejectionCount: number
  avgGenerationMs: number
  avgReviewMs: number
}

interface Props {
  metrics: Metrics
}

const toRate = (count: number, total: number): string => {
  if (total === 0) return '0.0%'
  return `${((count / total) * 100).toFixed(1)}%`
}

export function MetricsPanel({ metrics }: Props) {
  const wallIndex = metrics.avgGenerationMs > 0 ? metrics.avgReviewMs / metrics.avgGenerationMs : 0

  const data = {
    labels: ['Autonomous', 'Discretion', 'Rejected'],
    datasets: [
      {
        data: [metrics.autonomousCount, metrics.discretionCount, metrics.rejectionCount],
        backgroundColor: ['#27AE60', '#F2994A', '#C0392B'],
      },
    ],
  }

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Simulation Metrics Dashboard</h2>
      <p className="text-xs text-slate-500">Simulation metrics only; not measured business outcomes.</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
        <p>Total requests: {metrics.totalRequests}</p>
        <p>Autonomous execution rate: {toRate(metrics.autonomousCount, metrics.totalRequests)}</p>
        <p>Discretion Fork rate: {toRate(metrics.discretionCount, metrics.totalRequests)}</p>
        <p>Policy rejection rate: {toRate(metrics.rejectionCount, metrics.totalRequests)}</p>
        <p>Average simulated generation time: {metrics.avgGenerationMs.toFixed(1)} ms</p>
        <p>Average simulated review time: {metrics.avgReviewMs.toFixed(1)} ms</p>
        <p>Verification Wall Index: {wallIndex.toFixed(2)}</p>
      </div>
      <div className="mx-auto mt-4 max-w-56">
        <Doughnut data={data} options={{ plugins: { legend: { position: 'bottom' } } }} />
      </div>
    </section>
  )
}
