import { useEffect, useMemo, useRef, useState } from "react";

const C = {
  slate: "#9a8e7a",
  line: "#2a2f3a",
  brass: "#ce9f52",
  ledgerRaised: "#1f232e",
  ledger: "#191c24",
};

const sign = (v) => (v >= 0 ? "+" : "") + v.toFixed(Math.abs(v) >= 100 ? 0 : 2);

function niceStep(range, count) {
  const raw = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
}

function niceTicks(min, max, count = 4) {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const step = niceStep(max - min, count);
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}

export function EquityCurve({ data, height = 200, showAxes = true, title, size }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const mL = showAxes ? (size ? 56 : 70) : 6;
  const mR = showAxes ? 16 : 8;
  const mT = showAxes ? 16 : 8;
  const mB = showAxes ? 24 : 6;
  const plotW = Math.max(0, width - mL - mR);
  const plotH = Math.max(0, height - mT - mB);

  const { points, xTicks, yTicks, yMin, yMax, zeroY } = useMemo(() => {
    const pnls = data.map((d) => d.pnl);
    const yTicks = niceTicks(Math.min(0, ...pnls), Math.max(0, ...pnls), 4);
    const yMin = yTicks[0];
    const yMax = yTicks[yTicks.length - 1];
    const x = (i) => (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
    const y = (v) => mT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
    const points = data.map((d, i) => ({ x: x(i), y: y(d.pnl), date: d.date, pnl: d.pnl }));
    const n = Math.min(6, data.length);
    const idxs = [...new Set(Array.from({ length: n }, (_, k) => Math.round((k * (data.length - 1)) / (n - 1))))];
    const xTicks = idxs.map((i) => ({ x: x(i), label: data[i].date.slice(0, 5), date: data[i].date }));
    return { points, xTicks, yTicks, yMin, yMax, zeroY: y(0) };
  }, [data, plotW, plotH, mT]);

  if (width === 0) {
    return <div ref={wrapRef} style={{ height }} />;
  }

  const fmtY = (v) => (size ? `${sign((v / size) * 100)}%` : `$${Math.round(v).toLocaleString()}`);
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${zeroY.toFixed(1)} L${points[0].x.toFixed(1)},${zeroY.toFixed(1)} Z`
    : "";
  const hp = hover !== null ? points[hover] : null;

  const handleMove = (e) => {
    if (!svgRef.current || data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const idx = Math.round(((px - mL) / plotW) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const ttf = showAxes ? 12 : 11;

  return (
    <div ref={wrapRef} style={{ height, minHeight: height, background: C.ledger, border: `1px solid ${C.line}`, borderRadius: 8, display: "flex", flexDirection: "column", position: "relative", ...(title ? { padding: 16 } : {}) }}>
      {title && <div className="pd-label" style={{ marginBottom: 12 }}>{title}</div>}
      <svg
        ref={svgRef}
        width="100%"
        height={height - (title ? 44 : 0)}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={title || "Equity curve"}
      >
        {showAxes && yTicks.map((v) => (
          <g key={v}>
            <line x1={mL} x2={width - mR} y1={mT + plotH - ((v - yMin) / (yMax - yMin)) * plotH} y2={mT + plotH - ((v - yMin) / (yMax - yMin)) * plotH} stroke={C.line} strokeDasharray="3 3" />
            <text x={mL - 8} y={mT + plotH - ((v - yMin) / (yMax - yMin)) * plotH + 4} textAnchor="end" fontSize={11} fill={C.slate}>{fmtY(v)}</text>
          </g>
        ))}
        {showAxes && (
          <text x={10} y={mT + plotH / 2} transform={`rotate(-90 10 ${mT + plotH / 2})`} textAnchor="middle" fontSize={11} fill={C.slate}>
            {size ? "P&L (%)" : "P&L ($)"}
          </text>
        )}
        {showAxes && xTicks.map((t) => (
          <g key={t.date + t.x}>
            <line x1={t.x} x2={t.x} y1={mT + plotH} y2={mT + plotH + 4} stroke={C.line} />
            <text x={t.x} y={mT + plotH + 16} textAnchor="middle" fontSize={11} fill={C.slate}>{t.label}</text>
          </g>
        ))}
        {showAxes && (
          <text x={mL + plotW / 2} y={height - mB + 6} textAnchor="middle" fontSize={11} fill={C.slate}>Date</text>
        )}
        {areaPath && <path d={areaPath} fill={C.brass} fillOpacity={0.15} />}
        <path d={linePath} fill="none" stroke={C.brass} strokeWidth={showAxes ? 2 : 1.5} strokeLinejoin="round" />
        {hp && (
          <>
            <line x1={hp.x} x2={hp.x} y1={mT} y2={mT + plotH} stroke={C.brass} strokeOpacity={0.35} />
            <circle cx={hp.x} cy={hp.y} r={4} fill={C.brass} stroke={C.ledger} strokeWidth={1.5} />
          </>
        )}
      </svg>
      {hp && (
        <div style={{ position: "absolute", left: Math.min(Math.max(hp.x - 60, 4), width - 130), top: 8, background: C.ledgerRaised, border: `1px solid ${C.line}`, borderRadius: 6, padding: "6px 10px", pointerEvents: "none", fontSize: ttf }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>
            {size ? `${sign((hp.pnl / size) * 100)}%` : `$${Math.round(hp.pnl).toLocaleString()}`}
          </div>
          {size && <div style={{ color: C.slate, fontSize: ttf - 1 }}>${Math.round(hp.pnl).toLocaleString()}</div>}
          <div style={{ color: C.slate, fontSize: ttf - 1 }}>{hp.date}</div>
        </div>
      )}
    </div>
  );
}
