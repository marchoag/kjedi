"use client";

import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  disabled: boolean;
  onSend: (text: string) => void;
  onAbort: () => void;
  streaming: boolean;
}

export function ChatInput({
  disabled,
  onSend,
  onAbort,
  streaming,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="chrome border-t border-divider-soft px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-end gap-2.5">
        <div className="flex-1 rounded-[20px] border border-divider bg-bg px-4 py-2 shadow-sm transition-colors focus-within:border-accent">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Message Claude — ⌘↩ to send"
            disabled={disabled && !streaming}
            className="block w-full resize-none bg-transparent text-[15px] leading-relaxed text-fg outline-none placeholder:text-fg-tertiary disabled:opacity-60"
          />
        </div>
        {streaming ? (
          <button
            onClick={onAbort}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-subtle text-fg transition-all hover:bg-divider active:scale-95"
            aria-label="Stop"
            title="Stop"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="4" y="4" width="8" height="8" rx="1.5" />
            </svg>
          </button>
        ) : (
          <button
            onClick={send}
            disabled={!text.trim() || disabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-sm transition-all hover:bg-accent-hover active:scale-95 disabled:cursor-default disabled:bg-divider disabled:shadow-none"
            aria-label="Send"
            title="Send"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
