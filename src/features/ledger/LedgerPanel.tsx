import type { LedgerRecord } from '../../types/gdls'

interface Props {
  ledger: LedgerRecord[]
}

export function LedgerPanel({ ledger }: Props) {
  return (
    <section className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Governance Ledger</h2>
      <p className="text-xs text-slate-500">
        Append-only in-memory demonstration ledger with SHA-256 hash chaining.
      </p>

      <div className="mt-3 max-h-72 overflow-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2">Request</th>
              <th className="p-2">Disposition</th>
              <th className="p-2">Path</th>
              <th className="p-2">Hash</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((record) => (
              <tr key={`${record.requestId}-${record.currentRecordHash}`} className="border-t border-slate-200 align-top">
                <td className="p-2">
                  <p className="font-medium">{record.requestId}</p>
                  <p>{record.timestamp}</p>
                  <p>{record.requestType}</p>
                </td>
                <td className="p-2">{record.finalDisposition}</td>
                <td className="p-2">{record.routingPath}</td>
                <td className="p-2">
                  <p>Prev: {record.previousRecordHash.slice(0, 10)}...</p>
                  <p>Curr: {record.currentRecordHash.slice(0, 10)}...</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
