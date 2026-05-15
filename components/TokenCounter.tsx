"use client";

export interface UsageTotals {
  input: number;
  cacheCreate: number;
  cacheRead: number;
  output: number;
}

interface TokenCounterProps {
  usage: UsageTotals;
}

const fmt = (n: number) => n.toLocaleString();

export function TokenCounter({ usage }: TokenCounterProps) {
  const cached = usage.cacheRead > 0;
  return (
    <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-1.5 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono">
        <span>
          input <strong>{fmt(usage.input)}</strong> · cache write{" "}
          <strong>{fmt(usage.cacheCreate)}</strong> · cache read{" "}
          <strong>{fmt(usage.cacheRead)}</strong> · output{" "}
          <strong>{fmt(usage.output)}</strong>
        </span>
        <span
          className={
            cached
              ? "text-green-700 dark:text-green-400"
              : "text-zinc-500 dark:text-zinc-500"
          }
        >
          {cached ? "✓ cache hit" : "no cache hit yet"}
        </span>
      </div>
    </div>
  );
}
