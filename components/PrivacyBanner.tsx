export function PrivacyBanner() {
  return (
    <div className="chrome border-b border-divider-soft px-4 py-1.5 text-[11px] font-medium tracking-tight">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5 text-fg-secondary">
          <span className="text-[13px] font-semibold tracking-tight text-fg">
            Kjedi
          </span>
          <span className="text-[11px]">
            by{" "}
            <a
              href="https://marchoag.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-secondary transition-colors hover:text-accent"
            >
              Marc Hoag
            </a>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-fg-secondary">
          <svg
            className="h-3 w-3 shrink-0"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 1.5a3 3 0 0 0-3 3v2H4.5A1.5 1.5 0 0 0 3 8v5a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 13V8a1.5 1.5 0 0 0-1.5-1.5H11v-2a3 3 0 0 0-3-3Zm-2 5v-2a2 2 0 1 1 4 0v2H6Z"
            />
          </svg>
          <span>Local only · No storage · Opus 4.7</span>
        </div>
      </div>
    </div>
  );
}
