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
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-accent-hover active:scale-[0.97] disabled:cursor-default disabled:opacity-40"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 2.5h6l3.5 3.5v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" />
        <path d="M10 2.5v3.5h3.5" />
        <path d="M5.5 9.5h5M5.5 11.5h3.5" />
      </svg>
      Generate Memo
    </button>
  );
}
