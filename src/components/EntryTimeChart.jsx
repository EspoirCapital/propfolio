export function EntryTimeChart({ profile, plotHeight = 170 }) {
  if (!profile || profile.withTime === 0) {
    return (
      <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
        <div className="pd-label mb-1">Entry Time · trades by hour</div>
        <p className="text-sm" style={{ color: "var(--slate)" }}>
          No trades with entry times yet. Log an entry time (HH:MM) on a trade to see when your trades open.
        </p>
      </div>
    );
  }

  const { hours, peak, withTime, total } = profile;
  const maxN = Math.max(...hours.map((h) => h.n), 1);
  const barArea = plotHeight - 26;
  const maxBar = barArea - 18;
  const peakLabel = peak ? `${peak.label}-${String(peak.hour + 1).padStart(2, "0")}:00` : "";

  return (
    <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
      <div className="pd-label mb-4">
        Entry Time · {peak ? `peak ${peakLabel} (${peak.n} trade${peak.n === 1 ? "" : "s"})` : "trades by hour"}
      </div>
      <div className="flex" style={{ position: "relative", height: plotHeight }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, height: 1, background: "var(--line)" }} />
        {hours.map((h) => {
          const barH = h.n > 0 ? Math.max((h.n / maxN) * maxBar, 3) : 0;
          const isPeak = peak && h.hour === peak.hour;
          const barColor = isPeak ? "var(--brass)" : "var(--slate)";
          return (
            <div key={h.hour} className="flex-1" style={{ position: "relative", height: plotHeight }}
              title={`${h.label}-${String(h.hour + 1).padStart(2, "0")}: ${h.n} trade${h.n === 1 ? "" : "s"}`}>
              {h.n > 0 && (
                <div className="pd-mono" style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 9, color: barColor, bottom: 22 + barH + 2 }}>
                  {h.n}
                </div>
              )}
              <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 22, width: "70%", maxWidth: 14, height: barH, background: barColor, opacity: isPeak ? 1 : 0.5, borderRadius: 2 }} />
            </div>
          );
        })}
      </div>
      <div className="flex">
        {hours.map((h, i) => (
          <div key={h.hour} className="flex-1 text-center">
            <div className="pd-mono" style={{ fontSize: 8, color: "var(--slate)" }}>{i % 3 === 0 ? h.hour.slice(0, 2) : ""}</div>
          </div>
        ))}
      </div>
      <div className="pd-mono text-xs mt-1" style={{ color: "var(--sand-dim)" }}>
        {withTime} of {total} trade{total === 1 ? "" : "s"} have entry times · each bar is a full hour
      </div>
    </div>
  );
}
