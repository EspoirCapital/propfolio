import { formatEv } from "../utils";

export function DayOfWeekChart({ days, plotHeight = 120 }) {
  const traded = days.filter((d) => d.n > 0);

  if (!traded.length) {
    return (
      <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
        <div className="pd-label mb-1">Day of Week · avg R per trade</div>
        <p className="text-sm" style={{ color: "var(--slate)" }}>No trades with risk yet.</p>
      </div>
    );
  }

  const maxAbs = Math.max(...traded.map((d) => Math.abs(d.avg)), 0.5);
  const half = plotHeight / 2;
  const maxBar = half - 22;

  return (
    <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
      <div className="pd-label mb-4">Day of Week · avg R per trade</div>
      <div className="flex" style={{ position: "relative", height: plotHeight }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "var(--line)" }} />
        {days.map((d) => {
          const barH = d.n > 0 ? Math.max((Math.abs(d.avg) / maxAbs) * maxBar, 3) : 0;
          const color = d.avg < 0 ? "var(--brick)" : "var(--sage)";
          return (
            <div key={d.day} className="flex-1" style={{ position: "relative", height: plotHeight }}
              title={d.n > 0 ? `${d.label}: ${formatEv(d.avg)} avg across ${d.n} trade${d.n !== 1 ? "s" : ""}` : `${d.label}: no trades`}>
              {d.n > 0 && (
                <>
                  <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: 14, height: barH, bottom: d.avg >= 0 ? half : undefined, top: d.avg < 0 ? half : undefined, background: color, borderRadius: 2 }} />
                  <div className="pd-mono" style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 10, color, top: d.avg >= 0 ? half - barH - 16 : half + barH + 2 }}>
                    {formatEv(d.avg)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex mt-1">
        {days.map((d) => (
          <div key={d.day} className="flex-1 text-center">
            <div className="pd-mono" style={{ fontSize: 10, color: "var(--sand-dim)" }}>{d.label}</div>
            <div className="pd-mono" style={{ fontSize: 9, color: "var(--slate)" }}>{d.n > 0 ? d.n : "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
