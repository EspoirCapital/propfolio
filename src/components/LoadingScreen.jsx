import { useState, useEffect } from "react";
import { BrandMark } from "./BrandMark";

const STATUS_LABELS = [
  "Loading your ledger",
  "Pulling accounts",
  "Settling trades",
  "Reconciling payouts",
];

export function LoadingScreen() {
  const [label, setLabel] = useState(STATUS_LABELS[0]);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % STATUS_LABELS.length;
      setLabel(STATUS_LABELS[i]);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

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
