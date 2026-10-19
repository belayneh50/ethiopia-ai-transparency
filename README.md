# ግልጽ ግዥ · Ethiopia AI Transparency

A bilingual Amharic–English **synthetic local procurement demonstration**. Human reviewers interpret explainable workflow signals; the application does not determine fraud, approve procurement, or establish anyone's real identity.

## Current architecture

| Component | Responsibility |
| --- | --- |
| `apps/public-portal` · React/Vite · port 5173 | Login, record forms, comparisons, human reviews, AI guidance, and saved change history |
| `apps/api` · NestJS · port 3001 | JWT authentication, database-backed role checks, validation, record operations, audit events, authenticated Gemini endpoints |
| `packages/database` · Prisma/PostgreSQL · port 5432 | Shared users, procurement records, reviews, comparable listings, and audit history |
| `packages/shared-types` | Shared AI contracts, output adapters, prompts, fallback rules, and demo-account definitions |

**PostgreSQL is the source of truth for procurement records, reviews, and comparables.** The portal loads them after login and refreshes on window focus or with **Refresh records**. A save must be confirmed by the API. The portal no longer writes these records to localStorage or silently falls back to a private browser dataset when the database is unavailable.

Browser storage still holds simulated vendor registrations. Authentication and the mock Fayda checkpoint use sessionStorage. Threshold settings are shared database entities; vendor/bid simulations are not.

## Setup and resuming this checkout

Requirements: Node.js 20+ with Corepack/pnpm, and PostgreSQL 14+ (the supplied Docker Compose service is one option). Use a current supported Node.js release for local work.

For an existing checkout, preserve its env files and database. **Do not use a database reset, remove Docker volumes, or overwrite existing credentials.** Stop only the project's known API/dev server before regenerating Prisma on Windows; a running API may lock its query-engine DLL.

```text
corepack pnpm install
corepack pnpm --filter @ethiopia-ai/shared-types build
docker compose up -d postgres
corepack pnpm --filter @ethiopia-ai/database generate
corepack pnpm db:push
corepack pnpm dev
```

The schema update adds quantity, unit, approval/payment dates, creator, and version columns. `db:push` applies the schema without an intentional reset; do not approve a data-loss/reset prompt if an unrelated schema drift is detected. Existing records remain in place. No automatic procurement seed or browser import runs on startup.

For a genuinely fresh checkout, `corepack pnpm setup` creates only missing env files from `.env.example`, starts PostgreSQL, generates the Prisma client, pushes the schema, and creates missing synthetic accounts. The user seed preserves existing accounts: it does not reset their passwords, roles, or activation state.

The API reads the repository-root `.env` and then `apps/api/.env`; process environment variables take precedence. Prisma commands run in `packages/database` and read that package's `.env`. Ensure `DATABASE_URL` resolves to the **same intended database** in both places. This milestone does not rewrite existing env files. An already customized demo account may no longer use its documented initial password.

Open [the local portal](http://localhost:5173). Synthetic account names are `admin.demo`, `recorder.demo`, `reviewer.demo`, and `viewer.demo`. Initial demo passwords are documented in `packages/shared-types/index.ts` and shown by the demo login helper. They are for local synthetic data only.

## Roles enforced by the API

| Operation | Admin | Recorder | Reviewer | Viewer |
| --- | --- | --- | --- | --- |
| Read shared records and public review status | Yes | Yes | Yes | Yes |
| Create records | Yes | Yes | No | No |
| Edit underlying records | All records | Own created records | No | No |
| Read reviewer notes / saved audit history | Yes | No | Yes | No |
| Read comparable listings | Yes | No | Yes | Yes |
| Add/remove comparables; save reviews; sign off audit reports | Yes | No | Yes | No |
| Request Gemini audit/guidance | Yes | No | Yes | No |
| Import browser/file snapshots | Yes | No | No | No |

Backend `governor` maps to Recorder, and `public` maps to Viewer. JWT validation reloads the user from the database, so role enforcement uses the current server record. Request bodies cannot select their actor or override permissions. Basic record responses redact internal notes, reviewer identity/date, and, for Recorder, comparables. Threshold changes are an Admin-only **browser demo preference**, not a server policy or security control.

## Preserve and migrate browser data

1. Sign in as Admin. The workspace opens without an additional identity prompt.
2. Choose **Import browser copy / samples**. It reads the original record/comparable storage keys; if no browser copy exists, it imports the starter sample dataset. The old browser copy is not changed or erased. Invalid snapshots produce an error rather than substituting data.
3. The result lists imported and skipped IDs. **An existing record ID is skipped completely**, including its review and comparables. A duplicate never overwrites a newer database record. Review the retained original snapshot separately if it contains differences you want to reconcile.
4. **Export & Import Audit Session** also accepts a saved JSON snapshot. Import is Admin-only, validated, and limited to 500 records and five comparables per record per file. Exports reflect the current user's permitted database view.

Import runs in a transaction. A failed batch does not leave partial records behind. Historical review statuses/notes/dates are preserved as imported data, with no newly claimed reviewer identity. The import event attributes the import to the signed-in Admin and marks historical assessments as unverified. Raw legacy identity fields are not stored as new sign-off evidence. Keep original files/browser copies until you have reviewed skipped IDs and verified the database contents. Browser data lost during the Windows reset cannot be reconstructed by this import feature.

## Shared updates and audit history

Signal thresholds are shared PostgreSQL settings. Every authenticated role reads the same values; only Admin can update them. Each update and its before/after values are written atomically to the audit trail. The portal falls back to documented defaults only while the local API is unavailable and no longer stores threshold settings in the browser.

Record creation/editing, review changes, comparable additions/removals, snapshot imports, and explicit report sign-offs write their corresponding audit events **in the same PostgreSQL transaction** as the change. If the event cannot be written, the change rolls back.

Events contain the authenticated actor ID, record/entity/action, server timestamp, and before/after values appropriate to the operation. **Saved change history** in each record detail is available to Admin and Reviewer, with pagination and expandable values. Imported history is identified as imported; it is not retroactively attributed to a verified officer.

Edits use a record version and serializable transactions. If another user changed the record, the API returns `409`: refresh, review the new values, and retry deliberately. Recorder ownership is checked on the server. Completed duration calculations use the payment date when supplied; imported snapshots retain their recorded duration. Threshold-based display signals remain deterministic local demo calculations.

This is a durable local audit trail, **not immutable or legally binding evidence**. Database administrators can change the database, and backups/retention/tamper-evident storage are not provided. There is no bulk destructive reset control in the portal.

## Gemini: reuse the existing playground key

Keep the existing key. No replacement, rotation, deletion, or credential rewrite is required by this milestone.

The backend uses `GEMINI_API_KEY` in the root `.env` (or the server process environment). `GEMINI_MODEL` optionally selects the model available to that key; otherwise the shared model default applies. Both browser flows call authenticated Nest endpoints:

- `POST /api/v1/ai/audit` — structured workflow transparency assessment.
- `GET /api/v1/settings/thresholds` — read the shared signal thresholds (all authenticated roles).
- `PATCH /api/v1/settings/thresholds` — update shared thresholds (Admin only; writes an atomic audit event).
- `POST /api/v1/ai/guidance` — neutral reviewer questions with manually supplied market references.

The Vite dev/preview server only forwards `/api` to Nest. It no longer calls Gemini itself. The browser does not send an API key. An existing legacy `VITE_GEMINI_API_KEY` entry is left untouched and unused; Vite exposes only deliberately public `PUBLIC_` variables. Never move the provider request back into browser code.

Requests use structured JSON schemas and validated English/Amharic outputs. Missing configuration, provider rate limits, network failure, or invalid output produce labeled fallback content. Authentication/role failures are not proof that the provider works. The offline score is a demo heuristic: start at 60, subtract 10 per supplied signal (up to 30), 6 for one or fewer bids, and 5 for 90+ days open. It is not a calibrated probability, confidence estimate, fraud score, or decision. Human review and source-document checks remain necessary.

To make **one** live synthetic check through the running authenticated API:

```text
node scripts/smoke-gemini.cjs
```

The script uses the documented Admin demo login, sends at most one provider request, prints no keys/tokens/generated record data, and creates no database record. Success requires `source=gemini` and a bilingual structured response. Fallback output explicitly fails live verification. If the existing Admin password was customized, use the portal with the correct login instead. A provider/model rejection must be resolved against the existing configuration; fallback must not be described as live success.

## Fayda KYC demonstration

Fayda remains an explicitly labeled mock. Only the supplied synthetic success identifier is accepted; no real FIN should be entered. The service simulates failure cases and returns a clearly unsigned mock token. It does not contact NIDP, perform real biometric/OTP verification, or provide a compliant OIDC identity service.

The portal requests the demo checkpoint when a user saves a new or edited procurement record, changes Admin thresholds, signs off a human review/report, or uses simulated vendor registration/bid submission. It does not block normal login or browsing. A successful confirmation is reused while the user remains active; twenty minutes of inactivity or logout clears it without discarding an open form. The next sensitive save requests confirmation again. Failed verification cannot retain an earlier successful vendor identity. Stored verification and new sign-off references use a synthetic subject reference rather than a raw FIN.

**The Fayda checkpoint is a browser demonstration, not server-side identity assurance.** Actual data authorization comes from the API's authenticated roles. An AI audit is not automatically signed off: an authorized reviewer must explicitly acknowledge the result. Vendor registration and bidding remain local simulations; identity verification alone would not establish ownership, exclude shell companies, or detect conflicts of interest.

## Interface behavior

The portal keeps related dialogs visually consistent through a shared centered modal shell with a dimmed backdrop, bounded viewport height, keyboard focus handling, and one active modal at a time. The bilingual **Add sample record** form uses a wider desktop layout (up to 780px) and collapses to a single column on mobile while retaining internal scrolling.

On screens up to 600px wide, the desktop toolbar becomes a compact header showing the project identity, role, and mock eKYC status. Records, Method, Session, Thresholds, eKYC, Vendor registration, language controls, and Logout remain available in an accessible slide-down menu. The menu exposes its state through `aria-expanded`, closes on Escape or outside input, returns focus to its opener, and closes before launching another dialog.

Saved change history is filtered to the current database record and ordered newest first using server timestamps plus a stable ID tie-breaker. The compact modal pager shows two entries at a time, reports the current page and total event count, disables boundaries accurately, and preserves the record filter while moving between pages.

## Validation and current limits

```text
corepack pnpm test:unit
corepack pnpm test
corepack pnpm build
```

`test:unit` runs API tests without PostgreSQL plus the portal tests. The full API test command provisions and drops a dedicated test database; it must never target the development database. Added integration cases cover two users reading the same saved record, reviewer persistence, actor spoofing, forbidden actions, Recorder ownership, optimistic conflicts, comparable changes, duplicate imports, and rollback when an audit event fails.

Verified for this milestone:

- The additive Prisma schema was applied to the existing local PostgreSQL database without a reset or reseed, and the Nest API and Vite portal were started against it.
- API role/unit checks and portal tests passed, including the focused Topbar tests. API and portal TypeScript compilation passed.
- Browser checks confirmed Admin login, the synthetic Fayda checkpoint and auto-close, centered shared modals, the wider Add Record form at desktop and mobile widths, the compact mobile menu at 319px and 390px, and audit-history Next/Previous behavior with correct boundary states.
- Audit pagination was checked against an existing three-event record: page sizes were 2 and 1, all three event IDs were unique, and the database record filter remained unchanged.
- One authenticated synthetic Gemini request completed through Nest using the existing key and `gemini-2.5-flash`. The structured bilingual result returned `source=gemini`; no database record was created and no key or token was printed or committed.
- The shared-threshold API and portal integration compile, and the API unit suite (13 tests) and portal suite (65 tests) pass. Applying the additive table and running its database-backed RBAC test require PostgreSQL/Docker to be running.

All data and identities in this repository are synthetic local-demo material. The application is not a production procurement system, live Fayda/NIDP integration, fraud detector, authorization substitute, or source of immutable/legal evidence. Production use would require managed secrets, hardened authentication, migrations and backups, tamper-evident audit retention, observability, security review, real identity-provider integration, and applicable Ethiopian legal and procurement controls.
