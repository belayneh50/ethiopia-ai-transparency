# ግልጽ ግዥ · Ethiopia AI Transparency Prototype

A bilingual Amharic–English local demonstration for explainable procurement review. Sign-in is real (JWT + role gates against a local API + Postgres); the procurement records you review remain synthetic demo data in the browser.

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
- **Demo credentials only**: The four synthetic accounts and their documented passwords exist for reproducible demos. This is not production authentication — do not put real or confidential data in this app.

---

## What runs where

This is a pnpm workspace:

| Piece | Where | Purpose | Port |
| --- | --- | --- | --- |
| Login / JWT API | `apps/api` (NestJS + Prisma) | `POST /api/v1/auth/login` issues JWTs; role-gated endpoints (`records`, `reviews`, `audit`, `auth/users`) | `:3001` |
| Demo portal | `apps/public-portal` (Vite + React) | Bilingual review UI; records/review state is client-side demo data in `localStorage` | `:5173` |
| Database | `packages/database` (Prisma schema + seed) | PostgreSQL; schema in `schema.prisma`, four demo users in `prisma/seed.ts` | `:5432` |
| Shared types | `packages/shared-types` | Role/enum constants shared by API and portal | — |

Signing in is the one thing the portal delegates to the API. Without the API running **and** the database seeded, the login screen shows `Network error` or `Login failed`.

## Local Development & Testing

### Prerequisites

- Node.js 20+ with corepack enabled (`corepack enable`), pnpm.
- **Docker** (Desktop or Engine) for the bundled PostgreSQL — or any Postgres 14+ you already run, with `DATABASE_URL` adjusted accordingly in the env files below.

### From a clean checkout

Run these from the repository root (they work in Windows Command Prompt/PowerShell and in Linux/macOS shells):

```text
corepack pnpm install     # 1. install workspace dependencies
corepack pnpm setup       # 2. one-time: env files + Postgres + Prisma client/schema + demo users
corepack pnpm dev         # 3. start the API (:3001) and the portal (:5173)
```

Then open [http://localhost:5173](http://localhost:5173) and sign in with a synthetic demo account. The login page's "Demo accounts" panel lists the usernames; passwords are documented next to them in `apps/public-portal/src/auth/demoAccounts.ts` and `packages/database/prisma/seed.ts` (demo credentials, not secrets):

| Username | Role |
| --- | --- |
| `admin.demo` | Admin |
| `recorder.demo` | Recorder (data entry) |
| `reviewer.demo` | Reviewer |
| `viewer.demo` | Read-only viewer |

Press `Ctrl+C` to stop the servers.

### What `corepack pnpm setup` does (idempotent)

1. Creates the three gitignored env files (`.env`, `apps/api/.env`, `packages/database/.env`) from `.env.example` if they are missing — a fresh clone has none, and both the Prisma CLI and the API need `DATABASE_URL`. Edit them if you are not using the bundled Postgres.
2. `docker compose up -d postgres`.
3. `prisma generate` (builds the Prisma client).
4. `prisma db push` (syncs tables from `packages/database/schema.prisma`).
5. `prisma db seed` (upserts the four demo users above).

To run those steps manually instead (e.g. Docker-less), see the root `package.json` (`setup`, `db:push`, `db:migrate`, `db:studio`).

> **Windows note:** do not run `pnpm setup` (or `prisma generate`) while `pnpm dev` is running — the API holds the Prisma query-engine DLL open and generate fails with `EPERM`. Stop the servers, run setup, restart.

#### One-click launchers

After `corepack pnpm setup` has run once, `start-local.cmd` (Windows) and `start-local.sh` (Linux) start `pnpm dev` and open the portal in the default browser when it is ready.

### Troubleshooting

- **Login shows "Network error" or "Login failed":** the API must be up on `:3001` and the database seeded — run `corepack pnpm setup` then `corepack pnpm dev`. Verify the API with `curl http://localhost:3001/api/v1/records` (an anonymous call should return `401`, not hang or refuse).
- **Port overrides:** the shell's environment beats `.env`. dotenv never overwrites an already-exported variable, so if your terminal or dev harness exports `PORT` (some export `PORT=0` for "any port"), the `.env` `PORT` is ignored. The API pins itself to `:3001` regardless (`Number(PORT) || 3001` in `apps/api/src/main.ts`) so the Vite proxy always finds it — but unset a shell `PORT` if you need a different port. `JWT_SECRET`, `CORS_ORIGIN`, and `GEMINI_API_KEY` behave the same way: exported values win over `.env`.
- **`prisma generate` fails with `EPERM` (Windows):** a dev server is holding the query engine — stop it first (see above).

### Run unit tests / build

```text
corepack pnpm test       # portal (Vitest) + API (Jest)
corepack pnpm build      # nest build + tsc/vite build
```

---

## Key Features & Enhancements

### 1. Role-based demo login
- Bilingual (Amharic–English) login screen with masked password + show/hide eye toggle, full keyboard support, and `prefers-reduced-motion` handling.
- Four synthetic roles (`admin`, `recorder`, `reviewer`, `viewer`) mapped to a UI permission matrix in `apps/public-portal/src/auth/roles.ts` and enforced server-side by `RolesGuard` in `apps/api`.
- Passwords are never persisted (token + user only), cleared after failed login/logout.

### 2. Visual Price Benchmark Gauge (`PriceBenchmarkChart`)
- Displays an intuitive linear distribution gauge comparing the observed market range (`Low` to `High`) with the `Median`.
- Visually pins the record's calculated unit price relative to the median, color-coding variances and highlighting whether unit prices fall outside observed comparables.
- Provides accessible bilingual descriptions and formulas for human review.

### 3. Local Session Persistence & Audit Data Management
- Automatically preserves reviewer assessments, custom notes, and added sample records in `localStorage` across page reloads.
- **Session Data Modal**:
  - **Export JSON**: Download a complete audit snapshot with records, statuses, notes, and market comparisons.
  - **Export CSV**: Export records and review assessments formatted for spreadsheet auditing.
  - **Import JSON**: Restore a previous audit session file directly into the browser.
  - **Reset to Defaults**: Clear all local changes and revert to initial sample data with a single click.

### 4. Modular Component Layout
- The portal lives under `apps/public-portal/src/components/` with single-responsibility pieces: `Topbar.tsx`, `SummaryMetrics.tsx`, `RecordTable.tsx`, `ReviewSummaryBar.tsx`, `RecordDetailModal.tsx`, `HumanReviewPanel.tsx`, `MarketReferencePanel.tsx`, `PriceBenchmarkChart.tsx`, `GeminiGuidancePanel.tsx`, `AddRecordModal.tsx`, `ExportAuditModal.tsx`, plus reusable `Dual.tsx` and `ShieldNotice.tsx`.

### 5. Automated Testing Suite
- Powered by **Vitest** for fast unit testing of calculations, schemas, and guardrails:
  - `marketReference.test.ts`: Deterministic median calculations (odd/even), unit price division, and quantity regex extraction.
  - `geminiResponseAdapter.test.ts`: JSON parsing, candidate extraction, and regex rejection of prohibited accusatory words or risk scores.
  - `reviewFilter.test.ts`: Status filter predicates and bilingual status mappings.

---

## Optional Gemini Guidance Configuration

1. From the repository root, copy `.env.example` to `.env.local` (Vite loads repo-root env files; the proxy reads `GEMINI_API_KEY` from there).
2. Set a real `GEMINI_API_KEY` in `.env.local`.
3. The key is read only by the local Vite server proxy in `apps/public-portal/vite.config.ts` and is never exposed to browser bundles.
4. If Gemini is not configured or offline, the interface automatically falls back to safe local review questions.

> **Never** put a real key in `.env.example` — that file is committed to git. (A real-looking key was committed there historically; if you ever copied it, rotate it. `.env*` files other than `.env.example` are gitignored.)

### Gemini troubleshooting note

The local proxy previously targeted `gemini-1.5-flash`, which is no longer available on the current Gemini API and therefore returned `404 Not Found`. The repair is intentionally centralized:

- `apps/public-portal/src/geminiModel.ts` selects `gemini-3.6-flash` and sets a 60-second request timeout. Keep future model changes in this file instead of hard-coding model names in the proxy.
- `apps/public-portal/vite.config.ts` reads the model constants and applies the timeout to the server-side Gemini request. Do not move `GEMINI_API_KEY` into client code or a `VITE_`-prefixed variable.
- `apps/public-portal/src/geminiResponseAdapter.ts` accepts harmless negated text such as “does not provide a risk score,” while still rejecting an actual risk score or rating. This prevents a valid safe disclaimer from being mistaken for prohibited output.
- Never print or commit the API-key value. Diagnose configuration by reporting only whether the key is present and by logging sanitized upstream status/error information.

After changing the Gemini integration, verify it from the repository root:

```bash
corepack pnpm test
corepack pnpm build
corepack pnpm dev
```

Then submit one synthetic record through **AI Guidance**. A successful request returns an overview, bilingual review questions, and a limitations statement. If it fails, check the local proxy response first: `404` usually indicates an unavailable model name, while a timeout indicates network latency or an upstream request that needs more time.

---

## Manual Market-Reference Workflow Details

1. Open any synthetic record and add reviewer-supplied comparable listings in its Human Review panel (`SYN-ET-2402` includes one fictional `example.com` comparison solely for demonstration).
2. Comparable prices are entered as unit prices. The browser deterministically sorts them and computes Low, Median, High, Difference, and Percentage Variance.
3. When the synthetic record label ends with an explicit quantity such as `(20)`, the app calculates `record unit price = total value ÷ quantity` and benchmarks it against the median unit price.
4. If no quantity is specified, the system does not guess, ensuring human reviewers verify the unit basis directly.

---

## Repository Status

- Branch `feature/login-and-rbac` adds the login screen, four synthetic roles, the JWT backend (NestJS + Prisma/PostgreSQL) with role-gated endpoints, and the seeded demo users.
- The review portal itself remains a client-side synthetic demo: records live in the browser's `localStorage`; only sign-in is delegated to the API.
- Known follow-ups: gate the portal's Gemini proxy by role, add API test coverage for the role matrix, and normalize line endings (`.gitattributes`).
