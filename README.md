# Tickys AI Dashboard

A local, single-user observability dashboard that runs real **AI agents** over your Gmail. It streams each agent's execution live and presents a **human-in-the-loop result** you can act on. Two agents ship today:

- **Email cleanup** — categorizes unread mail into color-coded delete-priority tiers (trash / keep), with a built-in reader to open any message in the center pane.
- **Receipts & Subscriptions** — scans your purchases and extracts a grouped table of receipts and recurring subscriptions (with an estimated monthly total).

It's built as a **generic multi-agent shell**: each agent is a self-contained _module_, and adding another is "write a module + a runner, then register them" — no shell changes. See [CLAUDE.md](./CLAUDE.md) for the architecture and the add-an-agent recipe.

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
      email-assistant/     agent: slice, module, api, components, types
      receipts/            agent: slice, module, result table, types
    auth/         Google connect / disconnect
    settings/     BYOK Gemini key + model choice (persisted to localStorage)
    skills/       SKILL.md explorer + Monaco editor (ControlPlane / center pane)
    telemetry/    generic run state (log / context / isStreaming) + SSE runner + panel
  lib/            small helpers
server/           Express SSE backend + agent registry (see CLAUDE.md for the file map)
skills/
  email-assistant/SKILL.md      each agent's editable instructions (shown in the editor)
  receipts-assistant/SKILL.md
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

Then open `http://localhost:5173`, click **Connect Google Workspace**, paste your Gemini key in **Settings**, pick a skill in the explorer (**email-assistant** or **receipts-assistant** — each is its own agent), and hit **Run Agent**.

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| root | `npm run dev` | Vite dev server (frontend) |
| root | `npm run build` | `tsc -b && vite build` — also the frontend typecheck |
| root | `npm run lint` | oxlint |
| `server/` | `npm run dev` | `tsx watch` (auto-reload backend) |
| `server/` | `npm run typecheck` | `tsc --noEmit` |

## How it works

1. The frontend `POST`s to `/api/agent/run` (BYOK key in the `x-ai-provider-key` header, plus the selected skill).
2. The backend dispatches to the runner registered for that skill, fetches the relevant Gmail (OAuth), sends it to Gemini, and streams **generic Server-Sent Events** back: `log`, `context`, `data`, `result`, `done`. Each agent module validates the payloads it cares about.
3. The UI renders the live log and the agent's structured result (email → a priority-tiered cleanup verdict; receipts → a subscriptions/receipts table).
4. **Human-in-the-loop:** for the email agent, you approve deletions and `/api/agent/trash` moves those messages to the Gmail trash (recoverable).

## For contributors & AI assistants

**[CLAUDE.md](./CLAUDE.md)** is the primary context file — architecture (the agent-module seam), conventions, commands, security constraints, and how to add a new agent. Read it before making changes.

## Security notes

- The BYOK Gemini key lives in browser localStorage — acceptable here because the app renders no raw HTML (no `dangerouslySetInnerHTML`, so the XSS surface is minimal), the key is metered/revocable, and it is **not** Google-account access.
- The Google OAuth **refresh token** is stored server-side in `server/tokens.json` (gitignored) — this is the sensitive credential, and it never reaches the browser.
- Email bodies are reduced to **plain text** server-side before being sent to the client.
