import { createRoot } from "react-dom/client";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = Array.from({ length: 10 }, (_, i) => ({ date: `${String(i + 1).padStart(2, "0")}/07/2026`, pnl: 100 + i * 50 }));

createRoot(document.getElementById("root")).render(
  <div style={{ height: 260, minHeight: 260, background: "var(--ledger)", border: "1px solid var(--line)", borderRadius: 8, display: "flex", flexDirection: "column", padding: 16, width: 600 }}>
    <div className="pd-label" style={{ marginBottom: 12 }}>Cumulative P&L</div>
    <div style={{ flex: 1, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 22 }}>
          <defs>
            <linearGradient id="pd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ce9f52" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#ce9f52" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a2f3a" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" type="category" minTickGap={32} tickMargin={8} tick={{ fontSize: 11, fill: "#9a8e7a" }} tickLine={false} axisLine={false} label={{ value: "Date", position: "insideBottom", offset: -4, style: { fontSize: 11, fill: "#9a8e7a" } }} />
          <YAxis tick={{ fontSize: 11, fill: "#9a8e7a" }} tickLine={false} axisLine={false} domain={["dataMin - 100", "dataMax + 100"]} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} width={70} tickMargin={6} label={{ value: "P&L ($)", angle: -90, position: "insideLeft", offset: 8, style: { fontSize: 11, fill: "#9a8e7a" } }} />
          <Tooltip contentStyle={{ background: "#1f232e", border: "1px solid #2a2f3a", fontSize: 12, borderRadius: 6 }} content={({ active, payload }) => { if (!active || !payload || !payload[0]) return null; return null; }} />
          <Area type="monotone" dataKey="pnl" stroke="#ce9f52" fill="url(#pd)" strokeWidth={2} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);
