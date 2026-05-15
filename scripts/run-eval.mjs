#!/usr/bin/env node
// Eval harness for the system prompt.
// Reads each .md file from prompts/eval/ (excluding expected-format.md), POSTs
// it to /api/chat with the canonical memo prompt, and prints the streamed
// memo plus usage. Use this to grade format adherence and substance against
// prompts/eval/expected-format.md while iterating on lib/system-prompt.ts.
//
// Usage:
//   node scripts/run-eval.mjs                 # run all eval contracts
//   node scripts/run-eval.mjs nda-sample      # run one (basename, with or without .md)
//   BASE_URL=http://127.0.0.1:3001 node scripts/run-eval.mjs   # override server

import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVAL_DIR = join(__dirname, "..", "prompts", "eval");
const OUT_DIR = join(EVAL_DIR, "out");
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3000";

const MEMO_PROMPT =
  "Produce a contract review memo using the red/yellow/green format defined in your system prompt. Cover the entire document.\n\nDisregard prior conversational digressions; produce a clean memo on the document as written, incorporating any factual clarifications the user has made.";

async function listContracts() {
  const all = await readdir(EVAL_DIR);
  return all
    .filter(
      (f) =>
        f.endsWith(".md") &&
        f !== "expected-format.md" &&
        !f.startsWith("_"),
    )
    .sort();
}

async function runOne(filename) {
  const docPath = join(EVAL_DIR, filename);
  const documentText = await readFile(docPath, "utf8");
  const t0 = performance.now();

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      documentText,
      messages: [{ role: "user", text: MEMO_PROMPT }],
    }),
  });

  if (!res.ok || !res.body) {
    const err = await res.text();
    return { filename, ok: false, error: `HTTP ${res.status}: ${err}` };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let memo = "";
  let usage = null;
  let streamError = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        const evt = JSON.parse(line);
        if (evt.type === "text") memo += evt.text;
        else if (evt.type === "usage") usage = evt;
        else if (evt.type === "error") streamError = evt.message;
      } catch {
        // ignore
      }
    }
  }

  const elapsedMs = Math.round(performance.now() - t0);
  return { filename, ok: !streamError, error: streamError, memo, usage, elapsedMs };
}

function fmtUsage(u) {
  if (!u) return "(no usage)";
  return `input=${u.input} cache_create=${u.cacheCreate} cache_read=${u.cacheRead} output=${u.output} stop=${u.stopReason ?? "?"}`;
}

async function main() {
  const arg = process.argv[2];
  let targets;
  if (arg) {
    const stem = arg.endsWith(".md") ? arg : `${arg}.md`;
    targets = [stem];
  } else {
    targets = await listContracts();
  }

  if (targets.length === 0) {
    console.error(`No eval contracts found in ${EVAL_DIR}`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  console.log(`Running eval against ${BASE_URL}/api/chat`);
  console.log(`Targets: ${targets.join(", ")}\n`);

  const totals = { input: 0, cacheCreate: 0, cacheRead: 0, output: 0 };

  for (const filename of targets) {
    process.stdout.write(`[${filename}] running… `);
    const r = await runOne(filename);
    if (!r.ok) {
      console.log(`FAIL — ${r.error}`);
      continue;
    }
    console.log(`done (${r.elapsedMs} ms) ${fmtUsage(r.usage)}`);
    if (r.usage) {
      totals.input += r.usage.input;
      totals.cacheCreate += r.usage.cacheCreate;
      totals.cacheRead += r.usage.cacheRead;
      totals.output += r.usage.output;
    }
    const outPath = join(OUT_DIR, filename.replace(/\.md$/, ".memo.md"));
    await writeFile(outPath, r.memo, "utf8");
    console.log(`  → ${outPath}`);
  }

  console.log(
    `\nTotals: input=${totals.input} cache_create=${totals.cacheCreate} cache_read=${totals.cacheRead} output=${totals.output}`,
  );
  // Rough cost estimate at Opus 4.7 pricing
  const cost =
    (totals.input * 5 +
      totals.cacheCreate * 6.25 +
      totals.cacheRead * 0.5 +
      totals.output * 25) /
    1_000_000;
  console.log(`Approx cost: $${cost.toFixed(4)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
