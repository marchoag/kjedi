"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingText?: string | null;
}

// Scroll behavior is now managed by the parent (app/page.tsx) which owns the
// scroll container. This component only renders.
export function ChatMessages({ messages, streamingText }: ChatMessagesProps) {
  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {messages.map((m, i) => (
        <Bubble key={i} role={m.role} text={m.text} />
      ))}
      {streamingText !== null && streamingText !== undefined && (
        <Bubble role="assistant" text={streamingText} streaming />
      )}
    </div>
  );
}

function Bubble({
  role,
  text,
  streaming,
}: {
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-zinc-900 px-4 py-2 text-sm text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="group flex flex-col items-start gap-1">
      <div className="prose prose-zinc prose-sm dark:prose-invert max-w-none w-full prose-h1:text-2xl prose-h1:mb-3 prose-h1:mt-0 prose-h2:text-base prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-2 prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:font-semibold prose-blockquote:border-l-zinc-300 prose-blockquote:text-zinc-600 dark:prose-blockquote:border-l-zinc-700 dark:prose-blockquote:text-zinc-400">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        {streaming && (
          <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-zinc-500" />
        )}
      </div>
      {!streaming && text && <CopyButton text={text} />}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore — clipboard API requires secure context, which localhost qualifies for
        }
      }}
      className="text-xs text-zinc-500 opacity-0 transition-opacity hover:text-zinc-900 group-hover:opacity-100 dark:hover:text-zinc-100"
      aria-label="Copy message"
    >
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}
