# CLAUDE.md

Context for AI coding assistants working in this repo. **Read this first.**

## What this is

Tickys AI Dashboard — a **local, single-user** observability dashboard that runs a real email-assistant agent over the user's Gmail. Two-pane UI: left = skills explorer + SKILL.md editor (Monaco) / email reader; right = tabbed **Telemetry / Raw Data / Results**. A Node/Express backend streams the agent run over **Server-Sent Events**.

It is architected as a **generic multi-agent shell** — email is the first agent _module_; the shell knows nothing about email.

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
- **Shell delegation:** the SSE runner (`src/features/telemetry/hooks/useAgentRunner.ts`) dispatches generic frames (`log`/`context`/`done`) and delegates the rest to `activeModule.ingest`; `TelemetryPanel` builds its tabs from the module; `ControlPlane` hands the center pane to `module.DetailView`.

### The email agent (first module)

`src/features/agents/email-assistant/`: `module.ts`, `emailSlice.ts` (Redux state key **`email`**: `rawEmails` / `activeResult` / `selectedEmail`), `api.ts` (`trashEmails` + `fetchEmailBody`), `components/` (cleanup widget, reader, inbox preview, rows).

### To add a new agent

1. Create `src/features/agents/<name>/` with a `module.ts` (+ optionally a slice, components, api).
2. Register it in `src/app/registerAgents.ts` — **one line**. Its `id` must match the SKILL.md `name`.

No shell edits needed.

## Backend (`server/`, Express 5, ESM, tsx)

- `server.ts` — routes. `auth.ts` — Google OAuth. `gmail.ts` — fetch unread / trash / message body. `ai.ts` — Gemini categorization (with retry, see below). `agentRunner.ts` — orchestrates a run and streams frames. `agentStream.ts` — the SSE contract. `tokenStore.ts` — OAuth refresh token persistence.
- Endpoints: `POST /api/agent/run` (SSE) · `GET /api/agent/message/:id` · `POST /api/agent/trash` · `GET /api/auth/status` · `POST /api/auth/disconnect` · `/api/auth/google[/callback]`.
- **Gemini calls auto-retry** on transient overload (503 / 429 / 500) with exponential backoff (`server/ai.ts`); each retry is surfaced to the SSE log so the UI shows "Gemini is busy — retrying…" instead of freezing.
- **SSE robustness gotcha:** stream liveness is tracked via `res.on('close')`, NOT `req.on('close')` — the request `close` fires spuriously once Express consumes the POST body and would drop every frame after the first.

## Known tech debt / deferred

- **The SSE contract is still email-typed.** `AgentStreamEvent` (in both `server/agentStream.ts` and `src/features/telemetry/types.ts`) hardcodes `inbox_fetched` and `result: EmailResultPayload`, and the email payload types (`ParsedEmail`, `EmailResultPayload`, `FlaggedEmail`, `CleanupPriority`) still live in `telemetry/types.ts`. **Phase 3** = generalize to a `{ agentType, payload }` envelope and move those types into the module — do this only when a real second agent lands.
- **Email-specific run config lives in global settings.** `maxEmails` (emails per run) sits in `settingsSlice` and flows through the generic `AgentRunRequest`, even though it only applies to the email agent — move it behind per-agent run params when the envelope is generalized.
- **`server/agentStream.ts` and `src/features/telemetry/types.ts` must be kept in sync by hand** (no shared package yet).
