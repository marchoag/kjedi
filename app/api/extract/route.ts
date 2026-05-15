import { extractDocxText } from "@/lib/extract-docx";
import { extractPdfText } from "@/lib/extract-pdf";
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

    const result = isPdf
      ? await extractPdfText(bytes)
      : { ...(await extractDocxText(bytes)), pageCount: undefined as number | undefined, warning: undefined as string | undefined };

    return Response.json({
      filename,
      text: result.text,
      pageCount: "pageCount" in result ? result.pageCount : undefined,
      warning: "warning" in result ? result.warning : undefined,
    });
  } catch (err) {
    const { code, message } = errorPayload(err);
    const status = code === "extraction_failed" ? 500 : 400;
    return Response.json({ error: { code, message } }, { status });
  }
}
