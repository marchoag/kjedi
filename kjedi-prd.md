# Contract Review Web App — PRD

## Context

Marc is a solo lawyer evaluating Claude for confidential legal-contract review. He already has an Anthropic API key under his law-firm account governed by Commercial Terms (no training, 30-day retention, DPA-eligible). The polished consumer/Teams UIs are unattractive for solo use (Teams' 5-seat minimum ≈ $1,500/yr; Claude.ai Pro/Max sits under Consumer Terms).

The goal is a **tiny, local-only Next.js app** that lets him drop a PDF or DOCX contract in, chat about it, and generate a red/yellow/green risk memo — while persisting **nothing** anywhere on disk, in browser storage, or in any third-party service besides Anthropic itself. This is the minimum viable "bring-your-own-key" replacement for the Claude.ai UI, scoped to legal-document review.

This PRD is intended to be handed off to a fresh Claude Code session in a new project directory.

---

## Scope

### In scope (v1)
- Single-page Next.js app, runs on `localhost` only
- Upload one digital PDF or DOCX at a time
- Extract text in-memory (no disk writes)
- Chat with Claude about the document (streaming)
- One-click "Generate Review Memo" producing a 🔴/🟡/🟢 risk memo
- Clear/reset button (also implicit on refresh)

### Out of scope (v1)
- Auth, accounts, multi-user
- Multi-document compare / redline-vs-template
- Scanned-PDF OCR (detect and error out instead)
- Conversation export to file (memo is copyable from UI)
- Production deployment / hosting
- Mobile layout polish

---

## Functional requirements

### F1. Document upload
- Drag-and-drop + file picker
- Accept `.pdf` and `.docx`
- Reject anything else with a clear message
- If a PDF is detected as image-only (no extractable text), show: *"This appears to be a scanned PDF. OCR it externally and re-upload."*

### F2. Text extraction
- PDF: `pdfjs-dist` (or `pdf-parse`) — extract text, preserve paragraph breaks
- DOCX: `mammoth` — extract as Markdown (preserves headings, lists, basic structure)
- Done server-side in a Route Handler, response returns extracted text to the client
- No writes to `/tmp`, `./uploads`, or anywhere else on the filesystem

### F3. Chat
- Standard message list + input box
- Streaming responses (Anthropic SDK `stream: true`)
- System prompt establishes legal-review context (see Output Format below)
- Document text is included once at the top of the conversation, **with prompt-cache breakpoint** so follow-up turns don't re-bill the full document
- "Clear conversation" button → wipes in-memory state, doesn't reload the doc
- "New document" button → wipes everything including the doc

### F4. Generate Review Memo (button + chat command)
- Button in the UI labeled **"Generate Review Memo 📋"**
- Sends a fixed prompt: *"Produce a contract review memo using the red/yellow/green format defined in your system prompt. Cover the entire document."*
- Same output format also produced if user types "memo" / "give me a redyellowgreen memo" / similar in chat — the system prompt teaches the model the format

### F5. Status / privacy indicators
- Header strip: "🔒 Local only · No storage · Model: Opus 4.7"
- Token-counter footer (rough estimate; pulled from API response `usage`) so user can see cost accruing

---

## Non-functional requirements — Security & Privacy

These are the point of the app. Treat as hard requirements.

### Storage
- **No `localStorage`, `sessionStorage`, `IndexedDB`, or cookies** beyond Next.js framework defaults. Audit with devtools → Application tab; should be empty.
- **No server-side persistence**: no DB, no file writes, no logs of document content or prompts. Console logging of document text is forbidden.
- **No analytics, telemetry, error reporting, or third-party scripts** (no Vercel Analytics, no Sentry, no Google Fonts loaded remotely — use `next/font` locally or system fonts).

### Network
- Outbound network calls only to `api.anthropic.com`. Verify no other origins via devtools Network tab.
- Server binds to `127.0.0.1` only (not `0.0.0.0`) — uses `next dev -H 127.0.0.1`
- No CDN, no remote font/image loading

### Secrets
- `ANTHROPIC_API_KEY` in `.env.local` (gitignored by Next.js default — verify)
- Key read server-side only, **never** sent to the browser. All Anthropic API calls happen in a Next.js Route Handler.
- `.gitignore` includes `.env*` explicitly

### Document handling
- Uploaded file → parsed to text in memory → discarded. File buffer is never written to disk.
- Extracted text lives only in:
  - React state in the browser tab (cleared on refresh/close)
  - The in-flight request body to Anthropic
  - Anthropic's 30-day retention (governed by Commercial Terms)

### Build hygiene
- No `"use server"` actions that take the full document — keep the document client-side and pass via fetch body, so the document text is never in a hydration payload that could be cached
- Production build optional; dev mode is fine for personal use

---

## Output format — Review Memo

The system prompt should specify this format so both the button and ad-hoc chat requests produce it consistently.

```markdown
# 📋 Contract Review Memo

**Document:** {filename}
**Date:** {today}
**Reviewer:** Claude (Opus 4.7)

## 🚦 Summary
{2–3 sentence executive summary: overall risk posture, top concerns}

## 🔴 Red Flags (material risk — recommend changes before signing)
- **[Section X.Y, "clause title"]** — {what it says} → {why it's a problem} → {suggested redline}
- ...

## 🟡 Yellow Flags (worth attention — negotiate if leverage allows)
- **[Section X.Y]** — {issue} → {suggested approach}
- ...

## 🟢 Green (standard / favorable / acceptable as-is)
- {brief note on key provisions that are fine}
- ...

## 📌 Open Questions for the Client
- {things the lawyer should confirm with the client before redlining}

## ⚖️ Governing Law / Jurisdiction Note
- {if non-obvious or unfavorable}
```

Tone: practical, plain-English, no hedging boilerplate. Cite section numbers/headings when referenceable.

---

## Tech stack

- **Next.js 15** (App Router), TypeScript
- **npm** as the package manager
- **@anthropic-ai/sdk** — streaming, prompt caching
- **pdfjs-dist** — PDF text extraction (more robust than `pdf-parse`)
- **mammoth** — DOCX → Markdown
- **react-markdown** + **remark-gfm** — render Claude's Markdown output (tables, lists)
- **Tailwind CSS** — styling (default Next.js setup)
- No state library — `useState` is enough
- No DB, no ORM, no auth lib

---

## Architecture

### File layout
```
contract-review/
├── .env.local                  # ANTHROPIC_API_KEY=... (gitignored)
├── .env.example                # ANTHROPIC_API_KEY=
├── .gitignore                  # ensure .env* covered
├── app/
│   ├── layout.tsx              # shell, fonts, header strip
│   ├── page.tsx                # main UI (upload + chat)
│   ├── api/
│   │   ├── extract/route.ts    # POST file → returns extracted text
│   │   └── chat/route.ts       # POST messages → streams Anthropic response
│   └── globals.css
├── lib/
│   ├── anthropic.ts            # SDK client (server-only)
│   ├── extract-pdf.ts          # pdfjs wrapper
│   ├── extract-docx.ts         # mammoth wrapper
│   └── system-prompt.ts        # the legal-review system prompt + memo format spec
├── components/
│   ├── Uploader.tsx            # drag-drop zone
│   ├── ChatMessages.tsx        # message list with Markdown rendering
│   ├── ChatInput.tsx           # textarea + send
│   ├── MemoButton.tsx          # "Generate Review Memo" trigger
│   └── PrivacyBanner.tsx       # 🔒 header strip
├── package.json
└── README.md                   # how to run, security notes
```

### Data flow
1. User drops file → `<Uploader>` → POST `/api/extract` with FormData
2. Route handler parses in memory → returns `{ text, filename }`
3. Client stores `{ text, filename, messages: [] }` in React state
4. On send: client POSTs `{ documentText, messages, action: 'chat'|'memo' }` to `/api/chat`
5. Route handler builds Anthropic request:
   - **System** = legal-review system prompt (from `lib/system-prompt.ts`)
   - **Messages** = `[{ role: 'user', content: [{ type: 'text', text: documentText, cache_control: { type: 'ephemeral' }}] }, ...conversationHistory]`
   - Streams response back via `ReadableStream`
6. Client renders streaming chunks via `react-markdown`

### Prompt caching
- Document text gets `cache_control: { type: 'ephemeral' }` → cached for 5 min
- First turn pays full cost; follow-ups on the same doc are ~90% cheaper on the document tokens
- System prompt is small enough to skip caching, but can be cached too if it grows

### Critical files to author
- `lib/system-prompt.ts` — gets the model into the right persona (see below) and defines the memo format. The quality of this file determines the quality of everything else.
- `app/api/chat/route.ts` — correct streaming + caching setup
- `lib/extract-pdf.ts` — must detect image-only PDFs and throw a typed error the UI can catch

### System-prompt persona (starting point — Marc will refine)

> You are a **senior California tech-transactions attorney** acting as Marc's review partner. You are not a generic legal AI — you are the kind of senior associate or partner who reviews a contract with skepticism, pushes back hard, and leaves no stones unturned.
>
> Your job is to **guide Marc** through the document: flag issues he might miss, explain *why* a clause matters in the context of California law and tech-industry norms, propose concrete redline language, and ask sharp clarifying questions when the business context isn't clear. Cite section numbers/headings whenever you reference the document.
>
> Be direct. Skip hedging boilerplate ("I'm not a lawyer," "consult an attorney"). Marc *is* the attorney — talk to him as a peer. If a clause is fine, say so in one line. If it's a problem, say what the problem is, the magnitude of the risk, and what to do about it.
>
> When asked for a review memo (button click or "memo" / "give me a redyellowgreen memo" in chat), produce output in the format below verbatim.
>
> {memo format spec — see "Output format" section above}
>
> Default assumptions (override if the user tells you otherwise):
> - Governing law: California
> - Industry: technology / SaaS / venture-backed
> - Whose side: ask if not stated, but assume Marc is representing the **company** (not the counterparty) until told otherwise

---

## Verification

After build, before using on a real contract:

1. **Sanity**:
   - `pnpm dev` (or `npm`) — app loads at `http://127.0.0.1:3000`
   - Upload a sample digital PDF NDA → text extracts → memo button works → output matches the format spec
   - Upload a DOCX → same
   - Upload a `.txt` → rejected with clear error
   - Upload a scanned PDF → "appears to be scanned" error

2. **Privacy audit** (do this every time before client work):
   - DevTools → Application → Storage → all categories empty (Local/Session/IndexedDB/Cookies)
   - DevTools → Network → filter to non-`api.anthropic.com` → should be empty (other than initial Next.js HMR/asset traffic on localhost)
   - `grep -r "console.log" app/ lib/ components/` → no logging of document text or prompts
   - `cat .gitignore` → includes `.env*`
   - `ls -la /tmp | grep -i contract` after a session → no leftover files

3. **Cost sanity**:
   - Run a memo on a 20-page contract → check Anthropic Console → Analytics → Cost
   - Ask 3 follow-up questions → confirm cached-input tokens show up (much cheaper than input tokens)

4. **Failure modes**:
   - Pull `ANTHROPIC_API_KEY` from `.env.local` → app shows clear "API key not set" error, doesn't crash
   - Send a huge document (>200k tokens) → graceful error, not silent failure

---

## Future (explicitly not v1)

- Compare-against-template ("here's our standard NDA, redline theirs against it")
- Multi-doc context (closing checklist across the data room)
- Per-matter `CLAUDE.md`-style persistent context (would require relaxing the "no storage" rule — opt-in only)
- Export memo to DOCX/PDF for the matter file
- OCR for scanned PDFs (in-browser tesseract.js if cloud OCR remains off-limits)
- Authentication if it ever leaves localhost (it shouldn't)

---

## Decisions

- ✅ API key handling: `.env.local`
- ✅ Default model: Opus 4.7
- ✅ OCR: deferred (error on scanned PDFs)
- ✅ Memo trigger: button + chat command
- ✅ Package manager: npm
- ✅ Persona: senior California tech-transactions attorney, pushes back hard, no hedging
- ⏭ Project directory: Marc will set up the new Claude Code project himself
