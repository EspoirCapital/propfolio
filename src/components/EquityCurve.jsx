import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

const C = {
  slate: "#9a8e7a",
  line: "#2a2f3a",
  brass: "#ce9f52",
  ledgerRaised: "#1f232e",
};

const sign = (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";

function ChartTooltip({ active, payload, size, small }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div
      style={{
        background: C.ledgerRaised,
        border: `1px solid ${C.line}`,
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: small ? 11 : 12,
      }}
    >
      {size && <div style={{ fontWeight: 600 }}>{sign((p.value / size) * 100)}</div>}
      <div style={{ fontWeight: size ? 400 : 600, color: size ? C.slate : undefined }}>
        ${Math.round(p.value).toLocaleString()}
      </div>
      <div style={{ color: C.slate, fontSize: (small ? 11 : 12) - 1 }}>{p.payload.date}</div>
    </div>
  );
}

export function EquityCurve({ data, height = 200, title, size, showY = false }) {
  const fmtY = (v) => (size ? sign((v / size) * 100) : `$${Math.round(v).toLocaleString()}`);
  const compact = height < 140;
  return (
    <div
      style={{
        background: "var(--ledger)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: title ? "16px 16px 8px" : "4px",
      }}
    >
      {title && (
        <div className="pd-label" style={{ marginBottom: 12 }}>
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pdAreaCurve" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.brass} stopOpacity={0.25} />
              <stop offset="100%" stopColor={C.brass} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {showY && (
            <YAxis
              width={compact ? 48 : 62}
              tick={{ fill: C.slate, fontSize: compact ? 10 : 11 }}
              tickFormatter={fmtY}
              tickLine={false}
              axisLine={{ stroke: C.line }}
              domain={["auto", "auto"]}
            />
          )}
          <Tooltip content={<ChartTooltip size={size} small={!title} />} />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke={C.brass}
            strokeWidth={title ? 2 : 1.5}
            fill="url(#pdAreaCurve)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
