export function DisclaimerFooter() {
  return (
    <div className="chrome border-t border-divider-soft px-4 py-2 text-[11.5px]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-fg-secondary">
        <span className="font-medium tracking-tight">
          Output is not legal advice. Use of Kjedi does not create an
          attorney-client relationship.
        </span>
        <a
          href="https://github.com/marchoag/kjedi#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium transition-colors hover:text-accent"
        >
          Read more
        </a>
      </div>
    </div>
  );
}
