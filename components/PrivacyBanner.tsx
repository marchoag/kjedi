export function PrivacyBanner() {
  return (
    <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto flex max-w-4xl items-center gap-2">
        <span aria-hidden>🔒</span>
        <span>Local only · No storage · Model: Opus 4.7 · 127.0.0.1</span>
      </div>
    </div>
  );
}
