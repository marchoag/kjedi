import "server-only";

import mammoth from "mammoth";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

// Legal contracts use section numbering like "1.", "2.1", "(a)" extensively.
// Turndown's default escape mangles these into "1\.", "2\.1", "\(a\)" to
// disambiguate from markdown syntax. The downstream consumer (Claude) reads
// the text directly; markdown ambiguity isn't worth losing clean section labels.
turndown.escape = (text: string) => text;

export interface DocxExtractionResult {
  text: string;
}

export async function extractDocxText(
  bytes: Uint8Array,
): Promise<DocxExtractionResult> {
  const buffer = Buffer.from(bytes);
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const markdown = turndown.turndown(html).trim();
  return { text: markdown };
}
