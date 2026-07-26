import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";

export function EquityCurve({ data, height, gradientId = "pdArea", showAxes = true, tooltipFmt }) {
  const uniqueDates = [...new Set(data.map((d) => d.date))];

  return (
    <div style={{ height: height || "100%", minHeight: height || 200, background: "var(--ledger)", border: "1px solid var(--line)", borderRadius: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: showAxes ? 16 : 8, right: showAxes ? 16 : 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brass)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--brass)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxes ? (
            <>
              <XAxis
                dataKey="date"
                type="category"
                ticks={uniqueDates}
                tick={{ fontSize: 11, fill: "var(--slate)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--slate)" }}
                tickLine={false}
                axisLine={false}
                domain={["dataMin - 100", "dataMax + 100"]}
                tickFormatter={(v) => `$${v}`}
                width={60}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
            </>
          )}
          <Tooltip
            contentStyle={{ background: "var(--ledger-raised)", border: "1px solid var(--line)", fontSize: showAxes ? 12 : 11, borderRadius: 6 }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload[0]) return null;
              const val = payload[0].value;
              const date = payload[0].payload?.date;
              return (
                <div style={{ background: "var(--ledger-raised)", border: "1px solid var(--line)", fontSize: showAxes ? 12 : 11, borderRadius: 6, padding: "6px 10px" }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>${Number(val).toLocaleString()}</div>
                  {date && <div style={{ color: "var(--slate)", fontSize: 11 }}>{date}</div>}
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="pnl" stroke="var(--brass)" fill={`url(#${gradientId})`} strokeWidth={showAxes ? 2 : 1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
