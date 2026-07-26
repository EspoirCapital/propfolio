import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { money } from "../utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function PerformanceSummary({ payouts, accounts }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();

  const data = useMemo(() => {
    const monthly = {};
    MONTHS.forEach((m, i) => { monthly[i] = { payouts: 0, fees: 0, refunds: 0, hasData: false }; });

    payouts.forEach((p) => {
      const d = new Date(p.requestedDate);
      if (d.getFullYear() === year) {
        monthly[d.getMonth()].payouts += p.amount;
        monthly[d.getMonth()].hasData = true;
      }
    });

    accounts.forEach((a) => {
      if (a.creationDate) {
        const pd = new Date(a.creationDate);
        if (pd.getFullYear() === year) {
          const totalCosts = a.costs.reduce((s, c) => s + c.amount, 0);
          if (totalCosts > 0) {
            monthly[pd.getMonth()].fees += totalCosts;
            monthly[pd.getMonth()].hasData = true;
          }
        }
      }
      if (a.refundDate && a.refund > 0) {
        const rd = new Date(a.refundDate);
        if (rd.getFullYear() === year) {
          monthly[rd.getMonth()].refunds += a.refund;
          monthly[rd.getMonth()].hasData = true;
        }
      }
    });

    let yearPayouts = 0;
    let yearFees = 0;
    let yearRefunds = 0;
    const rows = MONTHS.map((name, i) => {
      const { payouts: pay, fees, refunds, hasData } = monthly[i];
      yearPayouts += pay;
      yearFees += fees;
      yearRefunds += refunds;
      return { name, payouts: pay, fees, refunds, hasData };
    }).filter((r) => r.hasData);

    const yearNet = yearPayouts + yearRefunds - yearFees;

    return { rows, yearPayouts, yearFees, yearRefunds, yearNet };
  }, [payouts, accounts, year]);

  const s = { fontSize: 11, color: "var(--slate)" };
  const cell = { fontSize: 12, fontWeight: 500 };

  return (
    <div className="rounded-lg p-4 h-full flex flex-col" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
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
      <div className="flex flex-col flex-1">
        <div className="grid items-center" style={{ gridTemplateColumns: "50px repeat(4, 1fr)", borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
          <span style={s}>MONTH</span>
          <span className="pd-mono" style={s}>FEES</span>
          <span className="pd-mono" style={s}>REFUNDS</span>
          <span className="pd-mono" style={{ ...s, textAlign: "right" }}>PAYOUTS</span>
          <span className="pd-mono" style={{ ...s, textAlign: "right" }}>NET</span>
        </div>
        {data.rows.map((r) => {
          const net = r.payouts + r.refunds - r.fees;
          return (
            <div key={r.name} className="grid items-center pd-mono" style={{ gridTemplateColumns: "50px repeat(4, 1fr)", padding: "5px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <span className="pd-label" style={{ fontSize: 11 }}>{r.name}</span>
              <span style={{ ...cell, color: "var(--slate)" }}>{r.fees > 0 ? money(r.fees) : "—"}</span>
              <span style={{ ...cell, color: r.refunds > 0 ? "var(--sage)" : "var(--slate)" }}>{r.refunds > 0 ? money(r.refunds) : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: r.payouts > 0 ? "var(--sage)" : "var(--slate)" }}>{r.payouts > 0 ? money(r.payouts) : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: net >= 0 ? "var(--sage)" : "var(--brick)" }}>{net !== 0 ? money(net) : "—"}</span>
            </div>
          );
        })}
        {data.rows.length > 0 && (
          <div className="grid items-center pd-mono mt-auto" style={{ gridTemplateColumns: "50px repeat(4, 1fr)", padding: "8px 0", borderTop: "1px solid var(--line)", fontWeight: 700 }}>
            <span className="pd-label" style={{ fontSize: 11, color: "var(--brass)" }}>YEAR</span>
            <span style={{ ...cell, color: "var(--slate)" }}>{data.yearFees > 0 ? money(data.yearFees) : "—"}</span>
            <span style={{ ...cell, color: data.yearRefunds > 0 ? "var(--sage)" : "var(--slate)" }}>{data.yearRefunds > 0 ? money(data.yearRefunds) : "—"}</span>
            <span style={{ ...cell, textAlign: "right", color: data.yearPayouts > 0 ? "var(--sage)" : "var(--slate)" }}>{data.yearPayouts > 0 ? money(data.yearPayouts) : "—"}</span>
            <span style={{ ...cell, textAlign: "right", color: data.yearNet >= 0 ? "var(--sage)" : "var(--brick)" }}>{money(data.yearNet)}</span>
          </div>
        )}
        {data.rows.length === 0 && (
          <div className="text-xs py-4 text-center flex-1 flex items-center justify-center" style={{ color: "var(--slate)" }}>No data for {year}.</div>
        )}
      </div>
    </div>
  );
}
