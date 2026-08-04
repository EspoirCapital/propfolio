import { useState, useEffect } from "react";
import { BrandMark } from "./BrandMark";

const STATUS_LABELS = [
  "Loading your ledger",
  "Pulling accounts",
  "Settling trades",
  "Reconciling payouts",
  "Casting the day's equity",
  "Reconciling open positions",
];

export function LoadingScreen() {
  const [label, setLabel] = useState(() => STATUS_LABELS[Math.floor(Math.random() * STATUS_LABELS.length)]);

  useEffect(() => {
    let last = STATUS_LABELS.indexOf(label);
    const timer = setInterval(() => {
      let next;
      do {
        next = Math.floor(Math.random() * STATUS_LABELS.length);
      } while (next === last);
      last = next;
      setLabel(STATUS_LABELS[next]);
    }, 1200);
    return () => clearInterval(timer);
  }, [label]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: "var(--ink)" }} role="status" aria-live="polite">
      <BrandMark style={{ width: 180, height: 42, opacity: 0.95 }} />
      <div className="pd-loading-track" aria-hidden="true">
        <span className="pd-loading-sweep" />
      </div>
      <div className="pd-mono text-xs" style={{ color: "var(--slate)", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}
