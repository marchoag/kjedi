export class UnsupportedFileError extends Error {
  readonly code = "unsupported_file";
  constructor(message = "Only PDF and DOCX files are supported.") {
    super(message);
    this.name = "UnsupportedFileError";
  }
}

export class ImageOnlyPdfError extends Error {
  readonly code = "image_only_pdf";
  constructor(
    message = "This appears to be a scanned PDF. OCR it externally and re-upload.",
  ) {
    super(message);
    this.name = "ImageOnlyPdfError";
  }
}

export class DocumentTooLargeError extends Error {
  readonly code = "document_too_large";
  constructor(message = "Document exceeds the maximum size for this app.") {
    super(message);
    this.name = "DocumentTooLargeError";
  }
}

export class ApiKeyMissingError extends Error {
  readonly code = "api_key_missing";
  constructor(message = "ANTHROPIC_API_KEY is not configured on the server.") {
    super(message);
    this.name = "ApiKeyMissingError";
  }
}

export type AppErrorCode =
  | "unsupported_file"
  | "image_only_pdf"
  | "document_too_large"
  | "api_key_missing"
  | "extraction_failed";

export function errorPayload(err: unknown): {
  code: AppErrorCode;
  message: string;
} {
  if (
    err instanceof UnsupportedFileError ||
    err instanceof ImageOnlyPdfError ||
    err instanceof DocumentTooLargeError ||
    err instanceof ApiKeyMissingError
  ) {
    return { code: err.code, message: err.message };
  }
  return {
    code: "extraction_failed",
    message: err instanceof Error ? err.message : String(err),
  };
}
