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

  // Scroll-follow behavior: only auto-scroll if the user is already near the
  // bottom. Once they scroll up, leave them alone until they manually scroll
  // back down. Clicking "Jump to bottom" re-engages follow mode.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
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

      // Lift assistantText out of the try so the catch (abort) branch can
      // preserve a partial response as a stopped-by-user message.
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
          setMessages((m) => [...m, { role: "assistant", text: assistantText }]);
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") {
          // Preserve the partial response so the user keeps what they got.
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
      <div className="flex flex-1 flex-col">
        <Uploader onLoaded={setDoc} />
      </div>
    );
  }

  const pageCount = doc.kind === "pdf" ? doc.pageCount : undefined;
  const warning = doc.kind === "pdf" ? doc.warning : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 truncate text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">{doc.filename}</span>
            <span className="ml-2 text-xs text-zinc-500">
              {doc.kind === "pdf" ? "PDF" : "DOCX"}
              {pageCount !== undefined && (
                <>
                  {" · "}
                  {pageCount} {pageCount === 1 ? "page" : "pages"}
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MemoButton
              disabled={streaming}
              onClick={() => void send(MEMO_PROMPT)}
            />
            <button
              onClick={clearConversation}
              disabled={streaming || messages.length === 0}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Clear chat
            </button>
            <button
              onClick={newDocument}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              New document
            </button>
          </div>
        </div>
      </div>

      {warning && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          <div className="mx-auto max-w-4xl">⚠ {warning}</div>
        </div>
      )}

      <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          {messages.length === 0 && !streaming && (
            <div className="px-4 py-12 text-center text-sm text-zinc-500">
              Document loaded. Ask a question or click <strong>Generate Review Memo</strong>.
            </div>
          )}
          <ChatMessages messages={messages} streamingText={streamingText} />
          {error && (
            <div className="mx-4 mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
        {!autoScroll && (
          <button
            onClick={jumpToBottom}
            className="sticky bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-zinc-300 bg-white/95 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-md backdrop-blur hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
