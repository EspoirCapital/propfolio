import { formatEv } from "../utils";

const PLOT_H = 120;
const MAX_BAR = PLOT_H / 2 - 22;

export function DayOfWeekChart({ days }) {
  const hasData = days.some((d) => d.n > 0);
  const maxAbs = hasData
    ? Math.max(...days.map((d) => (d.n > 0 ? Math.abs(d.avg) : 0)), 0.5)
    : 1;
  const half = PLOT_H / 2;

  return (
    <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
      <div className="pd-label mb-4">Day of Week · avg R per trade</div>
      {!hasData ? (
        <p className="text-sm" style={{ color: "var(--slate)" }}>No trades with risk yet.</p>
      ) : (
        <>
          <div className="flex" style={{ position: "relative", height: PLOT_H }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "var(--line)" }} />
            {days.map((d) => {
              const barH = d.n > 0 ? Math.max((Math.abs(d.avg) / maxAbs) * MAX_BAR, 3) : 0;
              const color = d.avg !== null && d.avg < 0 ? "var(--brick)" : "var(--sage)";
              return (
                <div key={d.day} className="flex-1" style={{ position: "relative", height: PLOT_H }}
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
                <div className="pd-mono" style={{ fontSize: 9, color: d.n > 0 ? "var(--slate)" : "var(--line)" }}>{d.n > 0 ? d.n : "·"}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
