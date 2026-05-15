import "server-only";

import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

export const MODEL_ID = "claude-opus-4-7" as const;
