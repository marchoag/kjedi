# Eval Rubric — Memo Format Adherence

Every memo Claude produces (in response to the memo button or "memo" command) must satisfy this checklist. Run `npm run eval` and grade outputs against it.

## A. Format adherence (must pass all)

- [ ] Output starts with `# 📋 Contract Review Memo` (exact, including emoji)
- [ ] **Document:** line is present and accurate
- [ ] **Date:** line is present (today's date in ISO format)
- [ ] **Reviewer:** line is present (`Claude (Opus 4.7)`)
- [ ] All six sections present, in order, with correct emoji and headings:
  1. `## 🚦 Summary`
  2. `## 🔴 Red Flags (material risk — recommend changes before signing)`
  3. `## 🟡 Yellow Flags (worth attention — negotiate if leverage allows)`
  4. `## 🟢 Green (standard / favorable / acceptable as-is)`
  5. `## 📌 Open Questions for the Client`
  6. `## ⚖️ Governing Law / Jurisdiction Note`
- [ ] No preamble before the memo (no "Sure, here's the memo…")
- [ ] No commentary after the memo
- [ ] Section numbers/headings cited when referencing specific clauses

## B. Substance — issue identification

The eval contracts have **planted issues**. The model must surface the right severity for each.

### `nda-sample.md`

| # | Issue | Expected severity |
|---|---|---|
| 1 | 10-year term (Section 4) — too long for typical NDA, especially for an investor-evaluation NDA | 🔴 Red |
| 2 | Confidentiality obligations survive **in perpetuity** (Section 4) — uncommon, no carve-outs | 🔴 Red |
| 3 | Definition of Confidential Information has **no carve-outs** (Section 2) for publicly known, independently developed, or rightfully received | 🔴 Red |
| 4 | Indemnification is **uncapped and one-way only** — Receiving Party indemnifies, no reciprocity (Section 5) | 🔴 Red |
| 5 | Non-solicit is 3 years post-term (Section 7) — long for an NDA context | 🟡 Yellow |
| 6 | Governing law is New York (Section 11) — flag if Marc represents the California-domiciled Acme | 🟡 Yellow / Open Q |
| 7 | Equitable relief without bond is **mutual** (Section 6) — standard | 🟢 Green |

### `saas-msa-sample.md`

| # | Issue | Expected severity |
|---|---|---|
| 1 | **Uncapped IP indemnification by Vendor** (Section 8.1) — favorable to Customer (this contract represents Customer); flag as 🟢 Green or 🟡 (because uncapped is unusual; verify it's intentional, not a typo) | 🟢 Green or 🟡 |
| 2 | **Auto-renewal with 120-day notice + 15% price hike with no consent** (Section 4.2) | 🔴 Red |
| 3 | **SLA has no objective remedy** (Section 5.2) — credits at Vendor's sole discretion | 🔴 Red |
| 4 | **DPA referenced but not attached** (Section 6.2) — must execute concurrently or carve out | 🟡 Yellow |
| 5 | **Aggregated data carve-out** (Section 6.3) — common but worth noting | 🟡 Yellow |
| 6 | **Feedback assignment** (Section 7.2) — broad; standard but worth flagging | 🟡 Yellow |
| 7 | Governing law California, San Francisco venue (Section 11) — favorable to Acme | 🟢 Green |

### `employment-offer-sample.md`

| # | Issue | Expected severity |
|---|---|---|
| 1 | **Non-compete (Section 6)** — **categorically unenforceable in California** under Bus. & Prof. Code § 16600; recent 2024 Labor Code amendments make even attempting to enforce a violation | 🔴 Red |
| 2 | **IP assignment is overbroad (Section 5)** — purports to assign inventions made on personal time, off Company resources, outside scope; violates California Labor Code § 2870 | 🔴 Red |
| 3 | **18-month non-solicit of customers** (Section 7(b)) — California courts increasingly hostile to customer non-solicits (Edwards v. Arthur Andersen line) | 🔴 Red |
| 4 | **Employee non-solicit** (Section 7(a)) — also weakened in CA post-Edwards | 🟡 Yellow |
| 5 | 1-year cliff vesting (Section 1.2) — standard but flag for negotiation | 🟢 Green |
| 6 | 3-month severance (Section 4) — light for senior engineer; negotiate | 🟡 Yellow |
| 7 | Definition of "Cause" (Section 4) — narrow, employee-favorable | 🟢 Green |

## C. Tone and voice

- [ ] Direct, peer-to-peer (no "I'm not a lawyer", no "consult an attorney")
- [ ] Plain English; cites section numbers
- [ ] Suggests concrete redlines for red flags
- [ ] Does not pad with disclaimers

## How to grade

For each contract:
1. Run `npm run eval -- <contract-filename>` (or run all with `npm run eval`)
2. Read the output
3. Tick the format checklist (A) → must be 100%
4. Tick the substance checklist (B) → target ≥80% of high-severity items caught at the right severity
5. Tick tone checklist (C)

If any planted Red issue is missed entirely, the system prompt needs revision.
