"use client";

import { useCallback, useRef, useState } from "react";

export type LoadedDocument =
  | { kind: "docx"; filename: string; text: string }
  | {
      kind: "pdf";
      filename: string;
      base64: string;
      pageCount: number;
      warning?: string;
    };

interface UploaderProps {
  onLoaded: (doc: LoadedDocument) => void;
}

export function Uploader({ onLoaded }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/extract", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? "Failed to process document.");
          return;
        }

        if (json.kind === "pdf") {
          const base64 = await fileToBase64(file);
          onLoaded({
            kind: "pdf",
            filename: json.filename,
            base64,
            pageCount: json.pageCount,
            warning: json.warning,
          });
        } else if (json.kind === "docx") {
          onLoaded({
            kind: "docx",
            filename: json.filename,
            text: json.text,
          });
        } else {
          setError(`Unexpected response kind: ${json.kind}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [onLoaded],
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-stretch gap-4 px-6 py-16">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-[18px] border px-8 py-20 text-center transition-all duration-200 ${
          dragOver
            ? "border-accent bg-[color-mix(in_srgb,var(--color-accent),transparent_94%)]"
            : "border-divider bg-subtle hover:border-fg-tertiary"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
        style={{ borderStyle: "dashed", borderWidth: "1.5px" }}
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg shadow-sm transition-transform duration-200 group-hover:scale-105">
          <svg
            className="h-7 w-7 text-fg-secondary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M9 13h6M9 17h4" strokeWidth="1.2" />
          </svg>
        </div>
        <p className="text-[17px] font-semibold tracking-tight text-fg">
          {busy ? "Loading…" : "Drop a contract"}
        </p>
        <p className="mt-1.5 text-[13px] text-fg-secondary">
          or click to choose a PDF or DOCX
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      {error && (
        <div className="rounded-[12px] border border-divider-soft bg-subtle px-4 py-3 text-[13px] text-danger">
          {error}
        </div>
      )}
      <p className="text-center text-[12px] leading-relaxed text-fg-tertiary">
        Tuned for California <span className="font-medium text-fg-secondary">AI &amp; SaaS</span> tech-transactions practice. Not optimized for real estate, M&amp;A, securities, or litigation.
      </p>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}
