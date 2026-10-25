# GDLS Three-Stage Firewall Simulation

Interactive executive demonstration of the **General Discretion Layers System (GDLS)**.

**HIGH-VELOCITY ARCHITECTURE**  
*AI generates possibilities. Governance determines permissions.*

## What this simulation shows

- Stage 1 deterministic pre-synthesis gate (RBAC/schema/project code/ceiling)
- Stage 2 sandboxed deterministic mock synthesis (no side effects)
- Stage 3 deterministic post-synthesis gate (confidence/citations/grounding/variance/policy)
- Autonomous routing when all controls pass
- Contextual Discretion Fork for failed post-synthesis controls
- Append-only in-memory governance ledger with SHA-256 hash chaining

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- React Flow (`@xyflow/react`)
- Zustand
- Chart.js + `react-chartjs-2`
- Vitest + React Testing Library

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
```

## Scripts

```bash
npm run dev
npm run test
npm run test:watch
npm run build
npm run preview
```

## Demo walkthrough

1. Choose **Low-risk valid request** and click **Run Simulation**.
2. Observe Stage 1 -> Stage 2 -> Stage 3 and autonomous routing.
3. Choose **Missing citation** and run again.
4. Confirm **Contextual Discretion Fork** routing.
5. Enter rationale and choose Approve/Reject/Escalate.
6. Review metrics and hash-chained ledger records.

## Assumptions and limitations

- Synthesis is a deterministic local mock service; no external AI calls.
- Ledger is append-only **in browser memory** for demonstration only.
- SHA-256 chaining is tamper-evident sequencing, not persistence or consensus.
- Thresholds/ceilings are illustrative simulation policy values.
- Dashboard values are simulation metrics, not business outcomes.

## Security boundaries in this simulation

- Synthesis service cannot execute transactions.
- Routing logic decides autonomous/discretion paths.
- Human override requires explicit decision and rationale for approve/reject.
- Failed controls remain visible in ledger entries.
- No external credentials or secrets are required.
