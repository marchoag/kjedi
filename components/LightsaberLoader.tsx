"use client";

import { useEffect, useState } from "react";

const STATUS_TEXTS = [
  "Considering…",
  "Reviewing the document…",
  "Construing the agreement…",
  "Examining clauses…",
  "Heretofore deliberating…",
  "Pursuant to the matter…",
  "Whereas the contract states…",
  "Notwithstanding the foregoing…",
];

export function LightsaberLoader() {
  const [textIdx, setTextIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTextIdx((i) => (i + 1) % STATUS_TEXTS.length);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="flex w-full flex-col items-center gap-4 py-6"
      aria-label="Working"
    >
      <div className="lightsaber" aria-hidden="true">
        <span className="hilt" />
        <span className="blade" />
      </div>
      <span className="font-sans text-[14px] text-fg-secondary">
        {STATUS_TEXTS[textIdx]}
      </span>
    </div>
  );
}
