# CLAUDE.md

Context for AI coding assistants working in this repo. **Read this first.**

## What this is

Tickys AI Dashboard — a **local, single-user** observability dashboard that runs a real email-assistant agent over the user's Gmail. Two-pane UI: left = skills explorer + SKILL.md editor (Monaco) / email reader; right = tabbed **Telemetry / Raw Data / Results**. A Node/Express backend streams the agent run over **Server-Sent Events**.

It is architected as a **generic multi-agent shell** — **email** and **receipts** are the first two agent _modules_; the shell knows nothing about any specific agent. Selecting a skill in the explorer switches the whole app to that agent.

## ⚠️ Critical constraints

- **NEVER trigger `POST /api/agent/run` yourself** (curl/Bash/etc.). When Google is connected it reads the user's **real unread Gmail** and sends it to Gemini. Verify backend logic with headless/dummy tests using a fake `userId`; leave real runs to the user and ask them to paste results. Safe to hit yourself: `GET /api/auth/status`, typecheck, build, lint.
- **No secrets in git.** `server/.env` and `server/tokens.json` are gitignored. The Gemini key is **BYOK** (browser localStorage + `x-ai-provider-key` header) — never on the server, never logged.
- **No `dangerouslySetInnerHTML`.** All email content (subjects, senders, bodies) is rendered as escaped text; bodies are reduced to plain text server-side. Keep it that way — the localStorage key relies on a closed XSS surface.

## Commands

- Frontend: `npm run dev` (:5173) · `npm run build` (`tsc -b && vite build` — also the typecheck) · `npm run lint` (oxlint)
- Backend: `npm run dev --prefix server` (tsx watch, :3001) · `npm run typecheck --prefix server`
- **Finish every change** with `npm run build` + `npm run lint`, and `npm run typecheck --prefix server` for backend changes. All must be clean.

## Conventions

- TypeScript **strict** + `noUncheckedIndexedAccess`. **No `any`** — narrow `unknown`.
- **Feature-based** structure under `src/features/<name>/` (components/, slice, api, `index.ts` barrel).
- Redux Toolkit: typed hooks `useAppDispatch` / `useAppSelector` (`src/app/hooks`); each slice owns its selectors.
- Tailwind v4, dark **zinc/violet** theme. Reference code as clickable `file.ts:line` links.
- oxlint `react/only-export-components`: don't mix a component export with non-component exports in one file.

## Architecture: the agent-module seam

The shell (run / log / context / editor / tabs) is generic; everything agent-specific lives behind an `AgentModule`.

- `src/features/agents/AgentModule.ts` — the contract: `ResultView`, `hasResult`, `tabs?`, `DetailView?`/`hasDetail?`, `reset?`, `ingest`. **Predicates are plain selectors, not hooks**, so the shell makes one stable `useAppSelector` regardless of which module is active (avoids rules-of-hooks hazards).
- `src/features/agents/registry.ts` — `registerAgentModule`, `getAgentModule(id)`, `resetAllAgentModules(dispatch)`.
- `src/features/agents/useActiveModule.ts` — resolves the module by the selected skill's `name`.
- `src/features/agents/components/ResultsHost.tsx` — generic Results tab; renders the active module's `ResultView`.
- **Shell delegation:** the SSE contract is **generic** — `{ type:'data', key, payload }` and `{ type:'result', payload }` with `unknown` payloads. The runner (`src/features/telemetry/hooks/useAgentRunner.ts`) handles `log`/`context`/`done` and delegates `data`/`result` to `activeModule.ingest` (which validates its own payload); `TelemetryPanel` builds tabs from the module; `ControlPlane` hands the center pane to `module.DetailView`.

### The agent modules

- **email-assistant** (`src/features/agents/email-assistant/`): `module.ts`, `emailSlice.ts` (state key **`email`**), `api.ts` (`trashEmails` + `fetchEmailBody`), `components/` (cleanup widget, reader, inbox preview, rows), `types.ts`. Has a Raw Data tab + a center-pane reader (`DetailView`).
- **receipts-assistant** (`src/features/agents/receipts/`): `module.ts`, `receiptsSlice.ts` (state key **`receipts`**), `components/ReceiptsResultView.tsx` (grouped Subscriptions/Receipts table), `types.ts`. Read-only; no tabs or `DetailView` — proof the shell handles a module that opts out of those.

### To add a new agent

The `id` must match the SKILL.md `name` on both sides. **No shell edits needed.**

1. **Frontend:** create `src/features/agents/<name>/` with a `module.ts` (+ slice/components as needed); register it in `src/app/registerAgents.ts` and add its reducer to `src/app/store.ts`. Add `skills/<name>/SKILL.md` + a skill entry in `src/features/skills/mockData.ts`.
2. **Backend:** write a runner with the `AgentRunner` signature that streams `data`/`result` frames; register it in `server/agents.ts` under the same id.

## Backend (`server/`, Express 5, ESM, tsx)

- `server.ts` — routes; `/api/agent/run` dispatches to a runner via the registry. `agents.ts` — **backend agent registry** (skill id → runner). `agentStream.ts` — the **generic** SSE contract + `AgentRunner` type. `gmail.ts` — `fetchEmails(query)` / trash / message body (+ `ParsedEmail`). `retry.ts` — shared Gemini backoff. `ai.ts` + `agentRunner.ts` — email extraction + runner. `receipts.ts` + `receiptsRunner.ts` — receipts extraction + runner. `auth.ts` — OAuth. `tokenStore.ts` — token persistence.
- Endpoints: `POST /api/agent/run` (SSE) · `GET /api/agent/message/:id` · `POST /api/agent/trash` · `GET /api/auth/status` · `POST /api/auth/disconnect` · `/api/auth/google[/callback]`.
- **Each agent's prompt = its editable SKILL.md body + a fixed output contract.** `buildPrompt` (in `server/ai.ts` and `server/receipts.ts`) leads with the skill's instructions — sent live from the editor as `skillContent` (frontmatter stripped) — then appends the JSON output contract, so editing SKILL.md steers behavior while the schema keeps structured output valid. Skill edits persist to localStorage (`src/features/skills/persistence.ts`).
- **Gemini calls auto-retry** on transient overload (503 / 429 / 500) with exponential backoff (`server/retry.ts`, shared by both agents); each retry is surfaced to the SSE log so the UI shows "Gemini is busy — retrying…" instead of freezing.
- **SSE robustness gotcha:** stream liveness is tracked via `res.on('close')`, NOT `req.on('close')` — the request `close` fires spuriously once Express consumes the POST body and would drop every frame after the first.

## Known tech debt / deferred

- **Agent run config lives in global settings.** `maxEmails` (emails per run) sits in `settingsSlice` and rides the generic `AgentRunRequest`, and `AgentRunRequest` still has email-ish fields (`maxEmails`, `skillContent`) rather than a per-agent params bag. Fine for now; revisit if an agent needs very different run params.
- **`server/agentStream.ts` and `src/features/telemetry/types.ts` must be kept in sync by hand** (no shared package yet). Same for per-agent payload types (`.../email-assistant/types.ts` ↔ backend `ai.ts`/`gmail.ts`; `.../receipts/types.ts` ↔ backend `receipts.ts`).
