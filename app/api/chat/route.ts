import type Anthropic from "@anthropic-ai/sdk";

import { anthropic, MODEL_ID } from "@/lib/anthropic";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

interface ClientMessage {
  role: "user" | "assistant";
  text: string;
}

interface ChatRequestBody {
  documentText?: string;
  messages?: ClientMessage[];
}

const MAX_DOCUMENT_CHARS = 750_000; // ~190k tokens at ~4 chars/token

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_request", "Request body must be JSON.");
  }

  const documentText = body.documentText?.trim();
  const messages = body.messages;

  if (!documentText) {
    return jsonError(400, "invalid_request", "documentText is required.");
  }
  if (documentText.length > MAX_DOCUMENT_CHARS) {
    return jsonError(
      400,
      "document_too_large",
      `Document exceeds the ~190k-token gate (${documentText.length.toLocaleString()} chars > ${MAX_DOCUMENT_CHARS.toLocaleString()}).`,
    );
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError(
      400,
      "invalid_request",
      "messages must be a non-empty array.",
    );
  }
  if (messages[0].role !== "user") {
    return jsonError(
      400,
      "invalid_request",
      "The first message must be from the user.",
    );
  }
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") {
      return jsonError(
        400,
        "invalid_request",
        "Each message must have role 'user' or 'assistant'.",
      );
    }
    if (typeof m.text !== "string" || m.text.trim() === "") {
      return jsonError(
        400,
        "invalid_request",
        "Each message must have non-empty text.",
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const apiMessages: Anthropic.MessageParam[] = messages.map((m, i) => {
    if (i === 0) {
      // First user turn: document (cache_control breakpoint) + date + question.
      // Caching the prefix `system + document` saves ~90% on the document
      // tokens for follow-up turns within the 5-minute TTL.
      return {
        role: "user",
        content: [
          {
            type: "text",
            text: documentText,
            cache_control: { type: "ephemeral" },
          },
          { type: "text", text: `Today's date: ${today}.` },
          { type: "text", text: m.text },
        ],
      };
    }
    return { role: m.role, content: m.text };
  });

  const stream = anthropic.messages.stream({
    model: MODEL_ID,
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    system: SYSTEM_PROMPT,
    messages: apiMessages,
  });

  const encoder = new TextEncoder();
  const writeEvent = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    obj: unknown,
  ) => {
    controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
  };

  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            writeEvent(controller, { type: "text", text: event.delta.text });
          }
        }
        const final = await stream.finalMessage();
        const u = final.usage;
        writeEvent(controller, {
          type: "usage",
          input: u.input_tokens,
          cacheCreate: u.cache_creation_input_tokens ?? 0,
          cacheRead: u.cache_read_input_tokens ?? 0,
          output: u.output_tokens,
          stopReason: final.stop_reason,
        });
        writeEvent(controller, { type: "done" });
      } catch (err) {
        writeEvent(controller, {
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(body$, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}

function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}
