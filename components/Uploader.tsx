"use client";

import { useCallback, useRef, useState } from "react";

export interface ExtractedDocument {
  filename: string;
  text: string;
  pageCount?: number;
  warning?: string;
}

interface UploaderProps {
  onExtracted: (doc: ExtractedDocument) => void;
}

export function Uploader({ onExtracted }: UploaderProps) {
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
          setError(json?.error?.message ?? "Failed to extract document.");
          return;
        }
        onExtracted({
          filename: json.filename,
          text: json.text,
          pageCount: json.pageCount,
          warning: json.warning,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [onExtracted],
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-stretch gap-4 px-4 py-12">
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-8 py-16 text-center transition-colors ${
          dragOver
            ? "border-zinc-900 bg-zinc-100 dark:border-zinc-200 dark:bg-zinc-900"
            : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {busy ? "Extracting…" : "Drop a contract here"}
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
