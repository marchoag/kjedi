# KJedi

**A privacy-preserving, local-only AI contract review tool for solo and small-firm California attorneys — tuned for AI and SaaS tech-transactions work.**

KJedi is a tiny Next.js app that runs on `localhost` and lets you drop a PDF or DOCX contract in, chat about it with Claude (Anthropic's API), and generate a structured red/yellow/green review memo. It persists nothing — no disk writes, no browser storage, no logs, no analytics, no third-party calls except to Anthropic's API.

It's the minimum viable "bring-your-own-key" replacement for Anthropic's consumer Claude.ai interface, scoped to legal-document review, designed for a professional confidentiality posture.

Built by [Marc Hoag](https://marchoag.com), California attorney and founder of [Hoag Law.ai](https://hoaglaw.ai) — a flat-rate fractional General Counsel practice for AI and SaaS startups. KJedi runs the same system prompt and workflow I use for my own client work.

---

## ⚠️ READ THIS FIRST

**This is a personal project. It is not a product, not legal advice, and not a substitute for your own professional judgment as an attorney.**

- KJedi is shared publicly for educational and professional-collegial purposes. There is no warranty, no support obligation, and no service relationship of any kind.
- Use of this tool does **not** create an attorney-client relationship with Marc Hoag or Hoag Law.ai.
- **You are responsible for your own confidentiality posture.** That includes verifying your Anthropic account terms (see below), running the privacy audit before each session of client work, and applying your own professional judgment to every output.
- AI output is a starting point for analysis, not a substitute for it. Treat the memo the way you'd treat a junior associate's first pass: read every line, verify every citation, and own every conclusion before any of it goes to a client.

---

## 🎯 Practice focus

The system prompt is tuned for **California AI and SaaS tech-transactions practice** — specifically:

- SaaS subscription agreements, MSAs, SOWs, DPAs, order forms
- **AI-specific addenda and clauses** in commercial agreements (training data rights, output ownership, IP indemnity for AI outputs, model substitution, accuracy disclaimers, prompt and output confidentiality, sub-processor and upstream-model-provider disclosure)
- Vendor agreements with AI components (OpenAI, Anthropic, AWS Bedrock, Google Vertex, model-provider terms)
- Privacy: CCPA/CPRA, GDPR, DPAs
- IP assignments, contractor and employee IP/confidentiality, NDAs
- Open-source compliance and AI training-data provenance

**Not tuned for:** real estate, M&A, securities/financing, litigation, regulated-industry compliance (healthcare, FinReg). KJedi will flag if a contract is outside its lane, but you'll get better results from a tool tuned for those areas. The system prompt at [`lib/system-prompt.ts`](lib/system-prompt.ts) is the place to fork if your practice differs.

---

## 🔐 The threat model KJedi is designed against

KJedi was built for one specific use case: **a California attorney reviewing confidential client contracts on a personal laptop, with a duty of confidentiality under California Rule of Professional Conduct 1.6 and a duty of competent technology use under Rule 1.1, Comment [1].**

The design choices flow directly from that threat model:

| Concern | Design choice |
|---|---|
| Document text persisting on disk | Parsed in memory only; never written to filesystem |
| Document text in browser storage | No `localStorage`, `sessionStorage`, `IndexedDB`, or cookies |
| Document text in logs | No `console.log` of prompt or document content |
| Document text leaking to third parties | No analytics, telemetry, error reporting, or third-party scripts |
| Document text used to train AI models | API access governed by Anthropic Commercial Terms (no training) — **you must verify this for your own account** |
| API key exposure | Read server-side only via `.env.local`; never sent to the browser |
| Remote access to your local server | Bound to `127.0.0.1` only, not `0.0.0.0` |

**What KJedi does NOT protect against:**

- A compromised local machine (malware, screen sharing, physical access)
- An incorrectly configured Anthropic account (e.g., Consumer Terms instead of Commercial Terms)
- Mistakes in your own use (sharing the localhost URL, screen-recording a session, copy-pasting outputs to insecure channels)
- Future changes to Anthropic's terms or infrastructure
- Bugs or regressions introduced by future dependency updates

---

## 🚨 CRITICAL: Anthropic account terms

**Before using KJedi for any client work, you must verify that your Anthropic API key is governed by Anthropic's Commercial Terms of Service, not Consumer Terms.** This is non-obvious and easy to get wrong.

- A personal account created at [console.anthropic.com](https://console.anthropic.com) for API access generally defaults to Commercial Terms once a payment method is added. Commercial Terms include: no training on your inputs/outputs, 30-day retention, eligibility for a Data Processing Addendum (DPA).
- A Claude.ai Pro or Max subscription is governed by **Consumer Terms**, which are materially different. Your API key under that account may or may not inherit the same protections — verify directly with Anthropic if you're unsure.
- For California attorneys handling confidential client information, executing Anthropic's DPA is automatically agreed to in the Commercial Terms.

**You — not me, not this README, not the tool — are responsible for verifying the terms applicable to your account.** Read the current Anthropic Commercial Terms at [anthropic.com/legal/commercial-terms](https://www.anthropic.com/legal/commercial-terms). They may have changed since this README was last updated.

---

## ✅ Privacy audit checklist — run before every client-work session

Don't skip this. The whole architecture is only as good as your verification that nothing has regressed.

1. **DevTools → Application → Storage**: confirm Local Storage, Session Storage, IndexedDB, and Cookies are all empty.
2. **DevTools → Network**: filter for non-`api.anthropic.com` traffic. Should be empty after page load.
3. **`grep -rn "console.log" app/ lib/ components/`**: confirm no logging of prompts or document content.
4. **`cat .gitignore`**: confirm `.env*` is covered.
5. **`ls -la /tmp | grep -i contract`** (or your OS equivalent): confirm no leftover temp files after a session.
6. **`git status`**: confirm `.env.local` is not staged or tracked.
7. **Browser**: use a clean window or profile, no extensions that could read page content, no screen sharing active.

If you've recently pulled new dependencies (`npm install`), re-run steps 1–5 before client work. Future updates to Next.js, the Anthropic SDK, or other packages could in theory introduce new telemetry or logging — verify.

---

## 🛠️ Setup

**Prerequisites:** Node.js 20+, an Anthropic API key, npm.

```bash
git clone https://github.com/marchoag/kjedi.git
cd kjedi
npm install
cp .env.example .env.local
# edit .env.local and add your ANTHROPIC_API_KEY
npm run dev
```

The app will be available at `http://localhost:XXXX where XXXX is some port number, with default usually 3000. (The dev server is bound to 127.0.0.1 only, so the app is not reachable from anywhere else on your network — only from your own machine.)

---

## 🎯 What KJedi does

1. **Drop a contract** (PDF or DOCX) on the upload zone.
2. **KJedi extracts text in memory** and loads it into a conversation with Claude.
3. **Chat about the contract** — ask questions, drill into specific clauses, push back on Claude's reads.
4. **Click "Generate Review Memo 📋"** to produce a structured red/yellow/green memo following a tested format.

The system prompt instructs Claude to act as a senior California tech-transactions attorney reviewing the document as a peer, with specific lenses for AI/SaaS contracts (training rights, output IP indemnity, sub-processor disclosure, etc.). See [`lib/system-prompt.ts`](lib/system-prompt.ts).

---

## 🧠 Suggested use

- **Yes:** First-pass review of a new contract before your own deep read. Catching issues you might miss. Generating a structured starting-point memo you'll edit and verify.
- **Yes:** Negotiating with yourself before negotiating with the other side — KJedi will push back on your assumptions if you let it.
- **No:** Final review without your own read. KJedi (like any LLM) confidently hallucinates citations, misreads cross-references, and occasionally invents clauses that aren't in the document.
- **Caveat — section conflations on long contracts.** Expect occasional section-number conflations on long contracts (20+ pages). LLMs reasoning over long documents sometimes confuse adjacent or similar sections. The citation-anchoring format (`**[§ X.Y, "Title"]** ("fragment...")`) is designed to make this easy to catch — if the anchoring fragment doesn't match the section number, the citation is wrong. This is a known LLM limitation on long-document reasoning, true of any LLM-generated legal analysis (including hosted SaaS products that hide it). Verify every citation before relying on it.
- **No:** Contracts outside California or outside tech-transactions practice without recalibrating the system prompt. KJedi will flag if a contract is outside its lane, but you should too.

---

## 🤷 What KJedi is NOT

- Not a SaaS product. There is no hosted version, no signup, no account.
- Not a substitute for malpractice insurance, ethics CLE, or your own professional judgment.
- Not a tool I support, warrant, or maintain on any schedule. PRs and issues welcome but responded to as time allows.
- Not connected to any of my client matters, client data, or firm infrastructure.

---

## 📝 License

MIT. Use it, fork it, modify it, ship your own version. Attribution appreciated but not required.

---

## 🔗 Related

- [Blog post: why I built KJedi instead of using a SaaS legal AI tool](#) *(link forthcoming)*
- [Hoag Law.ai](https://hoaglaw.ai) — my California fractional-GC practice
- [My App Portfolio](https://marchoag.com) — a collection of my various web and iOS apps
- [Marc Hoag on LinkedIn](https://linkedin.com/in/marchoag) | [@marc.hoag.ai.lawyer on TikTok](https://tiktok.com/@marc.hoag.ai.lawyer) | [@MarcHoag on X](https://x.com/marchoag)

---

## ⚖️ Final disclaimer

This software is provided "as is," without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement. In no event shall the author be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.

Nothing in this repository constitutes legal advice. Nothing in this repository creates an attorney-client relationship. If you are a non-lawyer and you are reviewing contracts for yourself or others, you should retain qualified counsel — full stop, not "consider retaining." If you are a lawyer, you are responsible for the professional and ethical use of any tool, including this one.

*This README was last updated May 15, 2026 Anthropic's terms, model capabilities, and pricing may have changed since.*
