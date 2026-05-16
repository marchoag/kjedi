"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { LightsaberLoader } from "@/components/LightsaberLoader";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingText?: string | null;
}

// Scroll behavior is managed by the parent (app/page.tsx) which owns the
// scroll container. This component only renders.
export function ChatMessages({ messages, streamingText }: ChatMessagesProps) {
  return (
    <div className="flex flex-col gap-7 px-6 py-8">
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
    // iMessage-style: rounded blue pill, white text, right-aligned, max ~75%.
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] whitespace-pre-wrap rounded-[20px] rounded-br-[6px] bg-accent px-4 py-2.5 text-[15px] leading-snug text-white shadow-sm">
          {text}
        </div>
      </div>
    );
  }
  // Initial wait state (streaming started but no tokens yet) — show the
  // lightsaber loader centered instead of an empty prose bubble.
  if (streaming && !text) {
    return (
      <article className="flex w-full flex-col items-center">
        <LightsaberLoader />
      </article>
    );
  }
  // Assistant: document-style serif prose, no bubble. Headings and structural
  // marks stay sans for editorial contrast; the body and lists are serif.
  return (
    <article className="group flex w-full flex-col items-start gap-2">
      <div
        className="prose prose-zinc max-w-none w-full
          font-serif text-[16.5px] leading-[1.7] text-fg
          dark:prose-invert
          prose-headings:font-sans prose-headings:tracking-tight prose-headings:text-fg
          prose-h1:text-[26px] prose-h1:font-bold prose-h1:mt-0 prose-h1:mb-4 prose-h1:leading-tight
          prose-h2:text-[18px] prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3
          prose-h3:text-[15px] prose-h3:font-semibold prose-h3:mt-5 prose-h3:mb-2
          prose-p:my-3
          prose-ul:my-3 prose-ol:my-3
          prose-li:my-2 prose-li:pl-1 prose-li:marker:text-fg-tertiary
          prose-strong:font-sans prose-strong:font-semibold prose-strong:text-fg
          prose-em:font-sans prose-em:not-italic prose-em:text-[13.5px] prose-em:text-fg-secondary
          prose-code:font-mono prose-code:text-[14px] prose-code:bg-subtle prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
          prose-blockquote:border-l-2 prose-blockquote:border-divider prose-blockquote:pl-4 prose-blockquote:not-italic prose-blockquote:text-fg-secondary prose-blockquote:font-normal
          prose-hr:border-divider-soft prose-hr:my-6
          prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        {streaming && (
          <span
            className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] animate-pulse bg-fg-tertiary align-middle"
            aria-hidden="true"
          />
        )}
      </div>
      {!streaming && text && <CopyButton text={text} />}
    </article>
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
          // localhost qualifies as a secure context; clipboard API should work
        }
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-fg-tertiary opacity-0 transition-all hover:bg-subtle hover:text-fg group-hover:opacity-100"
      aria-label="Copy message"
    >
      {copied ? (
        <>
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 6.5l2.5 2.5 4.5-5" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <path d="M8.5 2H3a1 1 0 0 0-1 1v5.5" strokeLinecap="round" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}
