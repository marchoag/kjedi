#!/usr/bin/env node
// Extract DOCX templates from templates/raw/ into a single text blob at
// lib/templates.generated.txt. Skips .doc, .webloc, .DS_Store, and other
// non-DOCX files. Re-run via `npm run templates` whenever templates change.
//
// After running this, RESTART the dev server — lib/templates.ts reads the
// generated file at module load and Next won't pick up changes to a .txt
// file via hot-reload.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import mammoth from "mammoth";
import TurndownService from "turndown";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, "..", "templates", "raw");
const OUT_FILE = join(__dirname, "..", "lib", "templates.generated.txt");

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});
// Same escape disable as lib/extract-docx.ts — preserves legal section
// numbering ("1.", "2.1", "(a)") instead of mangling to "1\.", "2\.1".
turndown.escape = (text) => text;

async function extractDocx(path) {
  const buffer = await readFile(path);
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return turndown.turndown(html).trim();
}

async function main() {
  let entries;
  try {
    entries = await readdir(RAW_DIR);
  } catch (err) {
    console.error(`Cannot read ${RAW_DIR}: ${err.message}`);
    console.error(
      "Drop your template DOCX files into templates/raw/ and try again.",
    );
    process.exit(1);
  }

  const docxFiles = entries
    .filter((name) => extname(name).toLowerCase() === ".docx")
    .sort();

  const skipped = entries.filter(
    (name) => extname(name).toLowerCase() !== ".docx" && !name.startsWith("."),
  );

  if (docxFiles.length === 0) {
    console.error(`No .docx files found in ${RAW_DIR}.`);
    if (skipped.length > 0) {
      console.error(
        `Skipped (not .docx): ${skipped.join(", ")} — only DOCX is supported.`,
      );
    }
    process.exit(1);
  }

  console.log(`Extracting ${docxFiles.length} DOCX template(s)…`);
  if (skipped.length > 0) {
    console.log(`Skipping (not .docx): ${skipped.join(", ")}`);
  }

  const sections = [];
  for (const filename of docxFiles) {
    const path = join(RAW_DIR, filename);
    process.stdout.write(`  ${filename}… `);
    try {
      const text = await extractDocx(path);
      sections.push(`### TEMPLATE: ${filename}\n\n${text}`);
      console.log(`${text.length.toLocaleString()} chars`);
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
    }
  }

  const blob = sections.join("\n\n---\n\n");
  await writeFile(OUT_FILE, blob, "utf8");

  const roughTokens = Math.round(blob.length / 4);
  console.log(
    `\nWrote ${blob.length.toLocaleString()} chars (~${roughTokens.toLocaleString()} tokens) to ${OUT_FILE}`,
  );

  // Cost guidance at common thresholds (Opus 4.7 pricing)
  const firstCallCost = (roughTokens / 1_000_000) * 5;
  const cachedCallCost = (roughTokens / 1_000_000) * 0.5;
  console.log(
    `Approx incremental cost per memo: $${firstCallCost.toFixed(3)} first call, $${cachedCallCost.toFixed(4)} cached follow-up.`,
  );

  if (roughTokens > 50_000) {
    console.warn(
      `\n⚠ Templates are large (~${roughTokens.toLocaleString()} tokens). Consider filtering templates/raw/ to fewer / shorter files, or curate into a tighter reference lens before shipping.`,
    );
  }

  console.log(`\nNext: restart the dev server so lib/templates.ts re-reads the generated file.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
