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
    <div className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-4xl items-end gap-2">
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
          placeholder="Ask about the document. Cmd+Enter to send."
          disabled={disabled && !streaming}
          className="min-h-[40px] flex-1 resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {streaming ? (
          <button
            onClick={onAbort}
            className="h-10 rounded-md bg-zinc-200 px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={send}
            disabled={!text.trim() || disabled}
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
