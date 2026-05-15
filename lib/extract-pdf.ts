import "server-only";

import { extractText } from "unpdf";

const MIN_CHARS_PER_PAGE = 50;
const SAMPLE_PAGES_FOR_PROBE = 3;

export interface PdfProbeResult {
  pageCount: number;
  warning?: string;
}

// Lightweight probe that runs at upload time. Anthropic's native PDF handler
// does the real extraction (text + per-page image rendering) server-side; we
// only need to characterize the file enough to warn the user if it looks
// scanned. We never ship the extracted text anywhere — it's discarded after
// the probe.
export async function probePdf(bytes: Uint8Array): Promise<PdfProbeResult> {
  const { totalPages, text } = await extractText(bytes, { mergePages: false });
  const sample = text.slice(0, SAMPLE_PAGES_FOR_PROBE);
  const totalSampleChars = sample.reduce((sum, page) => sum + page.length, 0);
  const avgCharsPerPage =
    sample.length > 0 ? totalSampleChars / sample.length : 0;

  if (avgCharsPerPage >= MIN_CHARS_PER_PAGE) {
    return { pageCount: totalPages };
  }

  return {
    pageCount: totalPages,
    warning:
      "This PDF appears to be scanned (no text layer detected). Claude can still read it via vision, but expect higher cost (~2× per page) and slightly lower accuracy than a text-layer PDF. Consider OCRing it first for best results.",
  };
}
