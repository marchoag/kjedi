# Manual Regression Test Fixtures

Drop manually-curated test fixtures (PDFs, DOCX) into this directory. **Everything except this README is gitignored** — no client documents reach the public repo.

## When to add a fixture

Whenever a real document exposes a bug that synthetic eval samples didn't catch, add it here so future refactors can be tested against the same trigger. The synthetic eval set in `prompts/eval/` covers format adherence and substance on hand-crafted contracts; this directory covers the messier real-world cases (unusual PDF layouts, complex DOCX structure, edge-case formatting).

## Convention

For each fixture, add an entry below documenting:

- **What it is** — anonymized description (contract type, ~page count, key features)
- **What bug it caught** — the specific failure mode this fixture proved exists
- **Expected behavior after fix** — what the model should produce now that the bug is fixed

This keeps regressions debuggable by future-you (or future-Claude) without needing to re-derive the failure mode from memory.

## How to test against a fixture

1. Drop the file into `test-fixtures/`.
2. Start the app: `npm run dev`.
3. Upload the fixture via the UI at `http://127.0.0.1:3000`.
4. Click **Generate Review Memo** (or chat as relevant to the bug).
5. Verify the memo matches the **Expected behavior after fix** entry below.

## Fixtures

### `[your-fixture-name].pdf`

- **What it is:** [brief description, no client-identifying info — e.g., "AI vendor SaaS MSA, ~25 pages, includes nested numbered sections (1.1.a.i style), running header with party names, page-N-of-M footer"]
- **What it caught:** [bug fingerprint — e.g., "Off-by-one section number errors when KJedi was using extracted text from `pdfjs-dist` instead of native PDF document blocks. The model confused page-number footers with section numbers, especially around page transitions."]
- **Expected after fix:** [what the model should produce now — e.g., "Section numbers cited correctly through the entire memo, including cross-references between sections. No conflation of page numbers with section numbers."]
- **Fixed in:** [commit SHA or PR — fill in once landed]

(Add new entries here as fixtures accumulate. Keep the entry-stub above as a template for future additions.)
