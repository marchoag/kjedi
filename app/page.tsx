"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/ChatInput";
import { ChatMessages, type ChatMessage } from "@/components/ChatMessages";
import { MemoButton, MEMO_PROMPT } from "@/components/MemoButton";
import { TokenCounter, type UsageTotals } from "@/components/TokenCounter";
import { Uploader, type LoadedDocument } from "@/components/Uploader";

const ZERO_USAGE: UsageTotals = {
  input: 0,
  cacheCreate: 0,
  cacheRead: 0,
  output: 0,
};

export default function Home() {
  const [doc, setDoc] = useState<LoadedDocument | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageTotals>(ZERO_USAGE);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      setAutoScroll(distanceFromBottom < 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, streamingText, autoScroll]);

  const jumpToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setAutoScroll(true);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!doc) return;
      setError(null);
      const nextMessages: ChatMessage[] = [
        ...messages,
        { role: "user", text },
      ];
      setMessages(nextMessages);
      setStreamingText("");

      const controller = new AbortController();
      abortRef.current = controller;

      const document =
        doc.kind === "pdf"
          ? { kind: "pdf" as const, base64: doc.base64 }
          : { kind: "docx" as const, text: doc.text };

      let assistantText = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            document,
            messages: nextMessages,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => ({}));
          setError(json?.error?.message ?? `HTTP ${res.status}`);
          setStreamingText(null);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            try {
              const evt = JSON.parse(line);
              if (evt.type === "text") {
                assistantText += evt.text;
                setStreamingText(assistantText);
              } else if (evt.type === "usage") {
                setUsage((prev) => ({
                  input: prev.input + (evt.input ?? 0),
                  cacheCreate: prev.cacheCreate + (evt.cacheCreate ?? 0),
                  cacheRead: prev.cacheRead + (evt.cacheRead ?? 0),
                  output: prev.output + (evt.output ?? 0),
                }));
              } else if (evt.type === "error") {
                setError(evt.message);
              }
            } catch {
              // ignore malformed line
            }
          }
        }

        if (assistantText) {
          setMessages((m) => [
            ...m,
            { role: "assistant", text: assistantText },
          ]);
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") {
          if (assistantText) {
            setMessages((m) => [
              ...m,
              {
                role: "assistant",
                text: `${assistantText}\n\n*[stopped by user]*`,
              },
            ]);
          }
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setStreamingText(null);
        abortRef.current = null;
      }
    },
    [doc, messages],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearConversation = useCallback(() => {
    abort();
    setMessages([]);
    setStreamingText(null);
    setUsage(ZERO_USAGE);
    setError(null);
  }, [abort]);

  const newDocument = useCallback(() => {
    abort();
    setDoc(null);
    setMessages([]);
    setStreamingText(null);
    setUsage(ZERO_USAGE);
    setError(null);
  }, [abort]);

  const streaming = streamingText !== null;

  if (!doc) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-bg-grouped">
        <Uploader onLoaded={setDoc} />
      </div>
    );
  }

  const pageCount = doc.kind === "pdf" ? doc.pageCount : undefined;
  const warning = doc.kind === "pdf" ? doc.warning : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Top toolbar — translucent vibrancy */}
      <div className="chrome sticky top-0 z-20 border-b border-divider-soft px-4 py-2">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-subtle text-fg-secondary">
              <svg
                className="h-4 w-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9.5 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5l-3.5-3.5z" />
                <path d="M9.5 1.5v3.5H13" />
                <path d="M5.5 8.5h5M5.5 10.5h3.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold tracking-tight text-fg">
                {doc.filename}
              </div>
              <div className="truncate text-[11px] text-fg-tertiary">
                {doc.kind === "pdf" ? "PDF" : "DOCX"}
                {pageCount !== undefined && (
                  <>
                    {" · "}
                    {pageCount} {pageCount === 1 ? "page" : "pages"}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <MemoButton
              disabled={streaming}
              onClick={() => void send(MEMO_PROMPT)}
            />
            <ToolbarButton
              onClick={clearConversation}
              disabled={streaming || messages.length === 0}
            >
              Clear chat
            </ToolbarButton>
            <ToolbarButton onClick={newDocument}>New doc</ToolbarButton>
          </div>
        </div>
      </div>

      {warning && (
        <div className="border-b border-divider-soft bg-[color-mix(in_srgb,var(--color-warn),transparent_90%)] px-4 py-2 text-[12px] text-warn">
          <div className="mx-auto max-w-5xl">⚠ {warning}</div>
        </div>
      )}

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          {messages.length === 0 && !streaming && (
            <div className="mx-6 mt-16 rounded-[16px] border border-divider-soft bg-subtle px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M8 4v8M4 8h8" />
                </svg>
              </div>
              <p className="text-[14px] text-fg-secondary">
                Document loaded. Ask a question or click{" "}
                <span className="font-semibold text-fg">Generate Memo</span>.
              </p>
            </div>
          )}
          <ChatMessages messages={messages} streamingText={streamingText} />
          {error && (
            <div className="mx-6 mb-6 rounded-[12px] border border-divider-soft bg-[color-mix(in_srgb,var(--color-danger),transparent_92%)] px-4 py-3 text-[13px] text-danger">
              {error}
            </div>
          )}
        </div>
        {!autoScroll && (
          <button
            onClick={jumpToBottom}
            className="chrome sticky bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-divider-soft px-3 py-1.5 text-[12px] font-medium text-fg shadow-sm hover:text-accent"
            aria-label="Jump to bottom"
          >
            ↓ Jump to bottom
          </button>
        )}
      </div>

      <TokenCounter usage={usage} />
      <ChatInput
        disabled={!doc || streaming}
        onSend={send}
        onAbort={abort}
        streaming={streaming}
      />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-fg-secondary transition-colors hover:bg-subtle hover:text-fg disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
