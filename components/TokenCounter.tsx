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
    <div className="chrome border-t border-divider-soft px-4 py-1.5">
      <div className="num mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-5 gap-y-1 font-mono text-[10.5px] text-fg-tertiary">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <Stat label="input" value={usage.input} />
          <Dot />
          <Stat label="cache write" value={usage.cacheCreate} />
          <Dot />
          <Stat label="cache read" value={usage.cacheRead} />
          <Dot />
          <Stat label="output" value={usage.output} />
        </div>
        <span
          className={`inline-flex items-center gap-1 ${
            cached ? "text-success" : "text-fg-tertiary"
          }`}
        >
          {cached ? "✓ cache hit" : "no cache hit yet"}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="opacity-60">{label}</span>{" "}
      <span className="font-semibold text-fg">{fmt(value)}</span>
    </span>
  );
}

function Dot() {
  return <span className="opacity-30">·</span>;
}
