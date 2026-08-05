import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const C = {
  slate: "#9a8e7a",
  line: "#2a2f3a",
  brass: "#ce9f52",
  ledgerRaised: "#1f232e",
};

const sign = (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
const round2 = (v) => Math.round(v * 100) / 100;

function ChartTooltip({ active, payload, size, small }) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
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
      {size && <div style={{ fontWeight: 600 }}>{sign(v)}</div>}
      <div style={{ fontWeight: size ? 400 : 600, color: size ? C.slate : undefined }}>
        ${Math.round(size ? (v / 100) * size : v).toLocaleString()}
      </div>
      <div style={{ color: C.slate, fontSize: (small ? 11 : 12) - 1 }}>{payload[0].payload.date}</div>
    </div>
  );
}

export function EquityCurve({ data, height = 200, title, size, showY = false }) {
  const compact = height < 160;
  const pctOf = (v) => (v / size) * 100;
  const chartData = size ? data.map((d) => ({ ...d, v: round2(pctOf(d.pnl)) })) : data.map((d) => ({ ...d, v: d.pnl }));
  const minPct = size ? Math.min(0, ...data.map((d) => pctOf(d.pnl))) : 0;
  const maxPct = size ? Math.max(0, ...data.map((d) => pctOf(d.pnl))) : 0;
  const yTicks = [...new Set([round2(minPct), 0, round2(maxPct)])].sort((a, b) => a - b);
  const domain = minPct === maxPct ? [minPct - 1, maxPct + 1] : [minPct, maxPct];

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
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pdAreaCurve" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.brass} stopOpacity={0.25} />
              <stop offset="100%" stopColor={C.brass} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: C.slate, fontSize: compact ? 10 : 11 }}
            tickFormatter={(v) => v.slice(0, 5)}
            minTickGap={compact ? 32 : 24}
            tickLine={false}
            axisLine={{ stroke: C.line }}
          />
          {showY && size && (
            <YAxis
              width={compact ? 48 : 62}
              tick={{ fill: C.slate, fontSize: compact ? 10 : 11 }}
              ticks={yTicks}
              domain={domain}
              tickFormatter={sign}
              tickLine={false}
              axisLine={{ stroke: C.line }}
            />
          )}
          <Tooltip content={<ChartTooltip size={size} small={!title} />} />
          <Area
            type="monotone"
            dataKey="v"
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
