import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const C = {
  slate: "#9a8e7a",
  line: "#2a2f3a",
  brass: "#ce9f52",
  ledgerRaised: "#1f232e",
  ledger: "#191c24",
};

export function EquityCurve({ data, height, gradientId = "pdArea", showAxes = true, tooltipFmt, title }) {

  return (
    <div style={{ height: height || "100%", minHeight: height || 200, background: "var(--ledger)", border: "1px solid var(--line)", borderRadius: 8, display: "flex", flexDirection: "column", ...(title ? { padding: 16 } : {}) }}>
      {title && <div className="pd-label" style={{ marginBottom: 12 }}>{title}</div>}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: showAxes ? 16 : 8, right: showAxes ? 16 : 8, left: 0, bottom: showAxes ? 22 : 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.brass} stopOpacity={0.4} />
              <stop offset="100%" stopColor={C.brass} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxes ? (
            <>
              <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                type="category"
                minTickGap={32}
                tickMargin={8}
                tick={{ fontSize: 11, fill: C.slate }}
                tickLine={false}
                axisLine={false}
                label={{ value: "Date", position: "insideBottom", offset: -4, style: { fontSize: 11, fill: C.slate } }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: C.slate }}
                tickLine={false}
                axisLine={false}
                domain={["dataMin - 100", "dataMax + 100"]}
                tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                width={70}
                tickMargin={6}
                label={{ value: "P&L ($)", angle: -90, position: "insideLeft", offset: 8, style: { fontSize: 11, fill: C.slate } }}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
            </>
          )}
          <Tooltip
            contentStyle={{ background: C.ledgerRaised, border: `1px solid ${C.line}`, fontSize: showAxes ? 12 : 11, borderRadius: 6 }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload[0]) return null;
              const val = payload[0].value;
              const date = payload[0].payload?.date;
              return (
                <div style={{ background: C.ledgerRaised, border: `1px solid ${C.line}`, fontSize: showAxes ? 12 : 11, borderRadius: 6, padding: "6px 10px" }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>${Number(val).toLocaleString()}</div>
                  {date && <div style={{ color: C.slate, fontSize: 11 }}>{date}</div>}
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="pnl" stroke={C.brass} fill={`url(#${gradientId})`} strokeWidth={showAxes ? 2 : 1.5} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
