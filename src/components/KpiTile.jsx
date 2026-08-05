import { useEffect, useState } from "react";

function useCountUp(target, duration = 800, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target === undefined || !Number.isFinite(target)) {
      setVal(target ?? 0);
      return;
    }
    let raf;
    let start;
    let timeout;
    const tick = (now) => {
      if (start === undefined) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    timeout = setTimeout(() => { raf = requestAnimationFrame(tick); }, delay);
    return () => { clearTimeout(timeout); if (raf) cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return val;
}

export function KpiTile({ label, value, sub, accent, animate, fmt, delay = 0 }) {
  const n = useCountUp(animate, 800, delay);
  const shown = animate !== undefined ? fmt(n) : value;
  return (
    <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
      <div className="pd-label mb-2">{label}</div>
      <div className="pd-mono text-2xl font-medium" style={{ color: accent || "var(--sand)" }}>{shown}</div>
      {sub && <div className="pd-mono text-xs mt-1" style={{ color: "var(--slate)" }}>{sub}</div>}
    </div>
  );
}