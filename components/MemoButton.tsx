"use client";

export const MEMO_PROMPT =
  "Produce a contract review memo using the red/yellow/green format defined in your system prompt. Cover the entire document.\n\nDisregard prior conversational digressions; produce a clean memo on the document as written, incorporating any factual clarifications the user has made.";

interface MemoButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function MemoButton({ disabled, onClick }: MemoButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      <span aria-hidden>📋</span>
      Generate Review Memo
    </button>
  );
}
