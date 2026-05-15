# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Working principles

- The source of truth for v1 scope is `kjedi-prd.md` — read it before any non-trivial decision.
- Push back hard on PRD ambiguities before writing code.
- The privacy/security requirements in the PRD are hard requirements, not suggestions.

## What this project is

Currently a fresh `create-next-app` scaffold. The actual product is specified in `kjedi-prd.md`: a **local-only, single-user web app** for solo lawyer contract review (PDF/DOCX upload → in-memory text extraction → streaming chat with Claude → red/yellow/green review memo). Treat the PRD as the source of truth for product scope, security/privacy requirements, and architectural decisions before writing implementation code.

## Commands

- `npm run dev` — start dev server (default `0.0.0.0:3000`). Per PRD §Network, the contract-review app must bind to localhost only — use `next dev -H 127.0.0.1` once implementation begins.
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — ESLint (flat config, extends `eslint-config-next`)

No test runner is configured.

## Stack notes

- **Next.js 16 App Router** — see `AGENTS.md`. Always consult `node_modules/next/dist/docs/` (organized as `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`) before using any Next API; training data for v15 and earlier will mislead.
- **Tailwind CSS v4** via `@tailwindcss/postcss` — CSS-first config in `app/globals.css` using `@theme inline`. There is no `tailwind.config.*` file; do not create one.
- **TypeScript** — `strict: true`, path alias `@/*` → repo root.
- **React 19**.

## Hard constraints from the PRD (apply once implementation starts)

These are non-negotiable per `kjedi-prd.md` — the app exists *because* of these constraints:

- No client storage (`localStorage` / `sessionStorage` / `IndexedDB` / cookies beyond Next defaults), no server persistence (no DB, no file writes, no logging of document content or prompts).
- Outbound network only to `api.anthropic.com`. No analytics, no Sentry, no remote fonts (use `next/font` locally), no third-party scripts.
- `ANTHROPIC_API_KEY` is read server-side only (Route Handlers); never shipped to the client or included in a Server Action payload that touches the document.
- Document bytes parsed in memory and discarded — never written to `/tmp`, `./uploads`, or anywhere on disk.
- Default model: Opus 4.7. Document text gets a prompt-cache breakpoint (`cache_control: { type: 'ephemeral' }`) so follow-up turns don't re-bill.
