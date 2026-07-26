import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { money } from "../utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function AccountPerformanceSummary({ trades, accountSize, refund, refundDate }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();

  const data = useMemo(() => {
    const monthly = {};
    MONTHS.forEach((m, i) => { monthly[i] = { pnl: 0, trades: 0, rrSum: 0, rrCount: 0, refund: 0, hasData: false }; });

    trades.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === year) {
        const m = monthly[d.getMonth()];
        m.pnl += t.pnl;
        m.trades++;
        if (t.risk > 0) {
          m.rrSum += t.pnl / t.risk;
          m.rrCount++;
        }
        m.hasData = true;
      }
    });

    if (refund > 0 && refundDate) {
      const rd = new Date(refundDate);
      if (rd.getFullYear() === year) {
        monthly[rd.getMonth()].refund += refund;
        monthly[rd.getMonth()].hasData = true;
      }
    }

    let yearPnl = 0;
    let yearRefund = 0;
    let yearTrades = 0;
    let yearRrSum = 0;
    let yearRrCount = 0;
    const rows = MONTHS.map((name, i) => {
      const { pnl, trades: tCount, rrSum, rrCount, refund: r, hasData } = monthly[i];
      yearPnl += pnl;
      yearRefund += r;
      yearTrades += tCount;
      yearRrSum += rrSum;
      yearRrCount += rrCount;
      const avgRr = rrCount > 0 ? (rrSum / rrCount).toFixed(1) : null;
      return { name, pnl, refund: r, trades: tCount, avgRr, hasData };
    }).filter((r) => r.hasData);

    const yearAvgRr = yearRrCount > 0 ? (yearRrSum / yearRrCount).toFixed(1) : null;

    return { rows, yearPnl, yearRefund, yearTrades, yearAvgRr };
  }, [trades, year, refund, refundDate]);

  const s = { fontSize: 11, color: "var(--slate)" };
  const cell = { fontSize: 12, fontWeight: 500 };
  const accSize = accountSize || 1;

  return (
    <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="pd-label">Performance Summary</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear((y) => y - 1)} className="pd-btn" style={{ padding: "2px 6px" }}>
            <ChevronLeft size={14} />
          </button>
          <span className="pd-mono" style={{ fontSize: 12, color: "var(--brass)", fontWeight: 600 }}>{year}</span>
          <button onClick={() => setYear((y) => y + 1)} className="pd-btn" style={{ padding: "2px 6px", opacity: year >= currentYear ? 0.3 : 1, pointerEvents: year >= currentYear ? "none" : "auto" }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="grid items-center" style={{ gridTemplateColumns: "50px 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
          <span style={s}>MONTH</span>
          <span className="pd-mono" style={s}>P&L</span>
          <span className="pd-mono" style={s}>REFUND</span>
          <span className="pd-mono" style={{ ...s, textAlign: "right" }}>%</span>
          <span className="pd-mono" style={{ ...s, textAlign: "right" }}>RR</span>
        </div>
        {data.rows.map((r) => {
          const netPnl = r.pnl + r.refund;
          const pnlPct = ((netPnl / accSize) * 100).toFixed(1);
          return (
            <div key={r.name} className="grid items-center pd-mono" style={{ gridTemplateColumns: "50px 1fr 1fr 1fr 1fr", padding: "5px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <span className="pd-label" style={{ fontSize: 11 }}>{r.name}</span>
              <span style={{ ...cell, color: r.pnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{r.pnl !== 0 ? money(r.pnl) : "—"}</span>
              <span style={{ ...cell, color: r.refund > 0 ? "var(--sage)" : "var(--slate)" }}>{r.refund > 0 ? money(r.refund) : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: netPnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{netPnl !== 0 ? `${netPnl >= 0 ? "+" : ""}${pnlPct}%` : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: "var(--sand-dim)" }}>{r.avgRr !== null ? `${r.avgRr}R` : "—"}</span>
            </div>
          );
        })}
        {data.rows.length > 0 && (
          <div className="grid items-center pd-mono mt-auto" style={{ gridTemplateColumns: "50px 1fr 1fr 1fr 1fr", padding: "8px 0", borderTop: "1px solid var(--line)", fontWeight: 700 }}>
            <span className="pd-label" style={{ fontSize: 11, color: "var(--brass)" }}>TOTAL</span>
            <span style={{ ...cell, color: data.yearPnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{money(data.yearPnl)}</span>
            <span style={{ ...cell, color: data.yearRefund > 0 ? "var(--sage)" : "var(--slate)" }}>{data.yearRefund > 0 ? money(data.yearRefund) : "—"}</span>
            <span style={{ ...cell, textAlign: "right", color: (data.yearPnl + data.yearRefund) >= 0 ? "var(--sage)" : "var(--brick)" }}>{`${(data.yearPnl + data.yearRefund) >= 0 ? "+" : ""}${(((data.yearPnl + data.yearRefund) / accSize) * 100).toFixed(1)}%`}</span>
            <span style={{ ...cell, textAlign: "right", color: "var(--sand-dim)" }}>{data.yearAvgRr !== null ? `${data.yearAvgRr}R` : "—"}</span>
          </div>
        )}
        {data.rows.length === 0 && (
          <div className="text-xs py-4 text-center" style={{ color: "var(--slate)" }}>No data for {year}.</div>
        )}
      </div>
    </div>
  );
}
