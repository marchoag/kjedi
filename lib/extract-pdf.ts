import "server-only";

import { extractText } from "unpdf";

import { ImageOnlyPdfError } from "@/lib/errors";

const MIN_CHARS_PER_PAGE = 50;
const MULTI_PAGE_THRESHOLD = 3;

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  warning?: string;
}

export async function extractPdfText(
  bytes: Uint8Array,
): Promise<PdfExtractionResult> {
  const { totalPages, text } = await extractText(bytes, { mergePages: false });
  const merged = text.join("\n\n").trim();
  const totalChars = merged.length;
  const charsPerPage = totalPages > 0 ? totalChars / totalPages : 0;

  if (charsPerPage < MIN_CHARS_PER_PAGE) {
    if (totalPages >= MULTI_PAGE_THRESHOLD) {
      throw new ImageOnlyPdfError();
    }
    return {
      text: merged,
      pageCount: totalPages,
      warning:
        "Very little text was extracted from this PDF. Results may be poor; consider OCRing it first.",
    };
  }

  return { text: merged, pageCount: totalPages };
}
