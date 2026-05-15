import { extractDocxText } from "@/lib/extract-docx";
import { probePdf } from "@/lib/extract-pdf";
import { UnsupportedFileError, errorPayload } from "@/lib/errors";

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function POST(request: Request) {
  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new UnsupportedFileError(
        "Request must be multipart/form-data with a 'file' field.",
      );
    }
    const entry = form.get("file");
    if (!(entry instanceof File)) {
      throw new UnsupportedFileError("No file uploaded.");
    }

    const filename = entry.name || "untitled";
    const lower = filename.toLowerCase();
    const isPdf = entry.type === PDF_MIME || lower.endsWith(".pdf");
    const isDocx = entry.type === DOCX_MIME || lower.endsWith(".docx");

    if (!isPdf && !isDocx) {
      throw new UnsupportedFileError();
    }

    const bytes = new Uint8Array(await entry.arrayBuffer());

    if (isPdf) {
      // PDF: probe only — return metadata + optional scanned warning.
      // The actual document goes to Anthropic via the chat route as a base64
      // document block; we don't extract text on this side.
      const probe = await probePdf(bytes);
      return Response.json({
        kind: "pdf" as const,
        filename,
        pageCount: probe.pageCount,
        warning: probe.warning,
      });
    }

    // DOCX: extract to markdown server-side (Anthropic's native handler is
    // PDF-only; mammoth → turndown produces clean text the model handles well).
    const { text } = await extractDocxText(bytes);
    return Response.json({
      kind: "docx" as const,
      filename,
      text,
    });
  } catch (err) {
    const { code, message } = errorPayload(err);
    const status = code === "extraction_failed" ? 500 : 400;
    return Response.json({ error: { code, message } }, { status });
  }
}
