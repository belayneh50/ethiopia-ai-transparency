# ግልጽ ግዥ · Ethiopia AI Transparency Prototype

A lightweight bilingual Amharic–English local demonstration for explainable procurement review.

---

## Safeguards & Principles

- **Synthetic Data Exclusively**: Uses synthetic procurement records. No real people, suppliers, agencies, biometric data, or government-confidential data are included.
- **Three Explainable Review Signals**:
  1. Unusually high comparative price (`> 1,500,000 ETB`)
  2. Repeated supplier wins across sample buyers (`≥ 2 wins`)
  3. Overdue approval or payment delays (`> 30 days open`)
- **Prompts, Not Verdicts**: Every signal states that it is for authorized human review only and is **not proof of wrongdoing**.
- **No Black-Box Risk Scoring**: The prototype does not produce numerical "fraud scores", accusations, or automated decisions.
- **Controlled Gemini Integration**: Optional Gemini guidance sends only disclosed synthetic record fields after explicit reviewer confirmation. The response adapter uses strict regular expressions to reject accusatory language, bias claims, or automated recommendations.
- **Manual Market-Reference Workflow**: An authorized reviewer may enter up to five comparable listings with specification, condition, ETB price, source URL, observation date, and an optional note. The app never scrapes or automatically collects marketplace data.

---

## Key Features & Enhancements

### 1. Visual Price Benchmark Gauge (`PriceBenchmarkChart`)
- Displays an intuitive linear distribution gauge comparing the observed market range (`Low` to `High`) with the `Median`.
- Visually pins the record's calculated unit price relative to the median, color-coding variances and highlighting whether unit prices fall outside observed comparables.
- Provides accessible bilingual descriptions and formulas for human review.

### 2. Local Session Persistence & Audit Data Management
- Automatically preserves reviewer assessments, custom notes, and added sample records in `localStorage` across page reloads.
- **Session Data Modal**:
  - **Export JSON**: Download a complete audit snapshot with records, statuses, notes, and market comparisons.
  - **Export CSV**: Export records and review assessments formatted for spreadsheet auditing.
  - **Import JSON**: Restore a previous audit session file directly into the browser.
  - **Reset to Defaults**: Clear all local changes and revert to initial sample data with a single click.

### 3. Modular Architecture
- Codebase is organized into clean, single-responsibility components:
  - `Topbar.tsx`: Navigation, session data trigger, and language selector.
  - `SummaryMetrics.tsx`: High-level metrics counters.
  - `RecordTable.tsx`: Search, multi-criteria filtering, and clickable table rows.
  - `ReviewSummaryBar.tsx`: Interactive human review status filters and live counts.
  - `RecordDetailModal.tsx`: Comprehensive audit inspector combining signals, human review, market references, and AI guidance.
  - `HumanReviewPanel.tsx`: Review status selection and session notes.
  - `MarketReferencePanel.tsx`: Comparable listings entry and statistical summaries.
  - `PriceBenchmarkChart.tsx`: Visual price range gauge.
  - `GeminiGuidancePanel.tsx`: Safe Gemini review requests with fallback questions.
  - `AddRecordModal.tsx`: Synthetic record creator with real-time bilingual validation.
  - `ExportAuditModal.tsx`: Audit session JSON/CSV export and import.
  - `Dual.tsx` & `ShieldNotice.tsx`: Reusable bilingual and safeguard elements.

### 4. Automated Testing Suite
- Powered by **Vitest** for fast, reliable unit testing of calculations, schemas, and guardrails:
  - `marketReference.test.ts`: Deterministic median calculations (odd/even), unit price division, and quantity regex extraction.
  - `geminiResponseAdapter.test.ts`: JSON parsing, candidate extraction, and regex rejection of prohibited accusatory words or risk scores.
  - `reviewFilter.test.ts`: Status filter predicates and bilingual status mappings.

---

## Local Development & Testing

### Installation & Run

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

### Run Unit Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

The production assets will be built in `dist/`.

---

## Optional Gemini Guidance Configuration

1. Copy `.env.example` to `.env.local`.
2. Set `GEMINI_API_KEY` in `.env.local`.
3. The key is read only by the local Vite server proxy in `vite.config.ts` and is never exposed to browser bundles.
4. If Gemini is not configured or offline, the interface automatically falls back to safe local review questions.

---

## Manual Market-Reference Workflow Details

1. Open any synthetic record and add reviewer-supplied comparable listings in its Human Review panel (`SYN-ET-2402` includes one fictional `example.com` comparison solely for demonstration).
2. Comparable prices are entered as unit prices. The browser deterministically sorts them and computes Low, Median, High, Difference, and Percentage Variance.
3. When the synthetic record label ends with an explicit quantity such as `(20)`, the app calculates `record unit price = total value ÷ quantity` and benchmarks it against the median unit price.
4. If no quantity is specified, the system does not guess, ensuring human reviewers verify the unit basis directly.

---

## Recent Workspace Changes

- Moved demo fixtures into `src/fixtures.ts` to separate data from UI code.
- Added `.env.example` placeholder (create `.env.local` from it) to configure `PORT`, `CORS_ORIGIN`, and `GEMINI_API_KEY`.

Next: I can move Gemini requests server-side and add a seed script for Prisma. Say which you'd like next.
