# Tickys AI Dashboard

A local, single-user observability dashboard that runs a real **email-assistant AI agent** over your Gmail. It streams the agent's execution live, shows the raw fetched inbox, and presents a **color-coded, human-in-the-loop cleanup verdict** you can act on (trash / keep) — plus a built-in reader to open any message in the center pane.

It's built as a **generic multi-agent shell**: the email assistant is the first agent _module_, and adding another agent is "write a module + register it" — no shell changes.

> ⚠️ **Personal / internal tool.** Runs entirely on `localhost`; it is not deployed, hardened, or multi-user. Design choices favor convenience over production hardening.

## Stack

- **Frontend:** React 19, Vite 8, TypeScript (strict), Redux Toolkit, Tailwind CSS v4, Monaco Editor. Linted with oxlint.
- **Backend:** Node + Express 5 (ESM, run with `tsx`), Server-Sent Events. Gemini via `@google/genai`; Gmail via `googleapis` (OAuth 2.0).

## Layout

```
src/
  app/            Redux store, typed hooks, registerAgents (agent composition root)
  components/     layout shell (DashboardLayout, TopBar) + UI primitives
  features/
    agents/       AgentModule contract + registry + generic ResultsHost
      email-assistant/   the first agent: slice, module, api, components
    auth/         Google connect / disconnect
    settings/     BYOK Gemini key + model choice (persisted to localStorage)
    skills/       SKILL.md explorer + Monaco editor (ControlPlane / center pane)
    telemetry/    generic run state (log / context / isStreaming) + SSE runner + panel
  lib/            small helpers
server/           Express SSE backend (see CLAUDE.md for the file map)
skills/
  email-assistant/SKILL.md   the agent's instructions (app data, shown in the editor)
```

## Setup

**1. Install dependencies** (frontend and backend are separate packages):

```bash
npm install
npm install --prefix server
```

**2. Google OAuth** (needed for Gmail access):

- In the [Google Cloud Console](https://console.cloud.google.com/), create OAuth 2.0 **Web application** credentials.
- Add the authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
- Copy `server/.env.example` → `server/.env` and fill in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. (`.env` is gitignored — never commit real secrets.)

**3. Gemini API key (Bring-Your-Own-Key):** get a free key at [Google AI Studio](https://aistudio.google.com/apikey). You paste it into the dashboard's **Settings** (gear icon) at runtime — it's saved in your browser's localStorage and sent per request. It's never committed and never stored on the server.

## Run

Two processes:

```bash
# terminal 1 — backend (http://localhost:3001)
npm run dev --prefix server

# terminal 2 — frontend (http://localhost:5173)
npm run dev
```

Then open `http://localhost:5173`, click **Connect Google Workspace**, paste your Gemini key in **Settings**, select the **email-assistant** skill, and hit **Run Agent**.

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| root | `npm run dev` | Vite dev server (frontend) |
| root | `npm run build` | `tsc -b && vite build` — also the frontend typecheck |
| root | `npm run lint` | oxlint |
| `server/` | `npm run dev` | `tsx watch` (auto-reload backend) |
| `server/` | `npm run typecheck` | `tsc --noEmit` |

## How it works

1. The frontend `POST`s to `/api/agent/run` with the BYOK key in the `x-ai-provider-key` header.
2. The backend fetches unread Gmail (OAuth), sends it to Gemini for categorization, and streams **Server-Sent Events** back: `log`, `context`, `inbox_fetched`, `result`, `done`.
3. The UI renders the live log, the raw inbox, and a priority-tiered cleanup verdict.
4. **Human-in-the-loop:** you approve deletions, and `/api/agent/trash` moves those messages to the Gmail trash (recoverable).

## For contributors & AI assistants

**[CLAUDE.md](./CLAUDE.md)** is the primary context file — architecture (the agent-module seam), conventions, commands, security constraints, and how to add a new agent. Read it before making changes.

## Security notes

- The BYOK Gemini key lives in browser localStorage — acceptable here because the app renders no raw HTML (no `dangerouslySetInnerHTML`, so the XSS surface is minimal), the key is metered/revocable, and it is **not** Google-account access.
- The Google OAuth **refresh token** is stored server-side in `server/tokens.json` (gitignored) — this is the sensitive credential, and it never reaches the browser.
- Email bodies are reduced to **plain text** server-side before being sent to the client.
