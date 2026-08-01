import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { money, getAccountLabel } from "../utils";
import { Select } from "../components/Select";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ReportView({ accounts, trades, payouts, settings }) {
  const [filterAccount, setFilterAccount] = useState("All");
  const [year, setYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  const selectedAcc = filterAccount !== "All" ? accounts.find((a) => a.id === filterAccount) : null;

  const firmData = useMemo(() => {
    if (filterAccount !== "All") return null;
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

    let yearPayouts = 0, yearFees = 0, yearRefunds = 0;
    const rows = MONTHS.map((name, i) => {
      const { payouts: pay, fees, refunds, hasData } = monthly[i];
      yearPayouts += pay;
      yearFees += fees;
      yearRefunds += refunds;
      return { name, payouts: pay, fees, refunds, hasData };
    }).filter((r) => r.hasData);

    return { rows, yearPayouts, yearFees, yearRefunds, yearNet: yearPayouts + yearRefunds - yearFees };
  }, [payouts, accounts, year, filterAccount]);

  const accData = useMemo(() => {
    if (!selectedAcc) return null;
    const accTrades = trades.filter((t) => t.accountId === selectedAcc.id && !t.archived);
    const accSize = selectedAcc.size || 1;
    const monthly = {};
    MONTHS.forEach((m, i) => { monthly[i] = { pnl: 0, trades: 0, rrSum: 0, rrCount: 0, refund: 0, mfeSum: 0, mfeCount: 0, maeSum: 0, maeCount: 0, hasData: false }; });

    accTrades.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === year) {
        const m = monthly[d.getMonth()];
        m.pnl += t.pnl;
        m.trades++;
        if (t.risk > 0) { m.rrSum += t.pnl / t.risk; m.rrCount++; }
        if (t.mfeR != null) { m.mfeSum += t.mfeR; m.mfeCount++; }
        if (t.maeR != null) { m.maeSum += t.maeR; m.maeCount++; }
        m.hasData = true;
      }
    });

    if (selectedAcc.refund > 0 && selectedAcc.refundDate) {
      const rd = new Date(selectedAcc.refundDate);
      if (rd.getFullYear() === year) {
        monthly[rd.getMonth()].refund += selectedAcc.refund;
        monthly[rd.getMonth()].hasData = true;
      }
    }

    let yearPnl = 0, yearRefund = 0, yearRrSum = 0, yearRrCount = 0;
    let yearMfeSum = 0, yearMfeCount = 0, yearMaeSum = 0, yearMaeCount = 0;
    const rows = MONTHS.map((name, i) => {
      const { pnl, rrSum, rrCount, refund: r, hasData, mfeSum, mfeCount, maeSum, maeCount } = monthly[i];
      yearPnl += pnl;
      yearRefund += r;
      yearRrSum += rrSum;
      yearRrCount += rrCount;
      yearMfeSum += mfeSum;
      yearMfeCount += mfeCount;
      yearMaeSum += maeSum;
      yearMaeCount += maeCount;
      const avgRr = rrCount > 0 ? (rrSum / rrCount).toFixed(1) : null;
      const avgMfe = mfeCount > 0 ? (mfeSum / mfeCount).toFixed(2) : null;
      const avgMae = maeCount > 0 ? (maeSum / maeCount).toFixed(2) : null;
      return { name, pnl, refund: r, hasData, avgRr, avgMfe, avgMae };
    }).filter((r) => r.hasData);

    const yearAvgRr = yearRrCount > 0 ? (yearRrSum / yearRrCount).toFixed(1) : null;
    const yearAvgMfe = yearMfeCount > 0 ? (yearMfeSum / yearMfeCount).toFixed(2) : null;
    const yearAvgMae = yearMaeCount > 0 ? (yearMaeSum / yearMaeCount).toFixed(2) : null;
    const yearNetPnl = yearPnl + yearRefund;

    return { rows, yearPnl, yearRefund, yearAvgRr, yearNetPnl, accSize, yearAvgMfe, yearAvgMae };
  }, [trades, selectedAcc, year]);

  const s = { fontSize: 11, color: "var(--slate)" };
  const cell = { fontSize: 12, fontWeight: 500 };

  return (
    <div className="print-report">
      {/* Print-only branded header */}
      <div className="print-header">
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>EC PROPFOLIO</div>
        <div style={{ fontSize: 13, color: "#555", marginBottom: 2 }}>Performance Report — {year}</div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 16 }}>Generated {dateStr}</div>
        {selectedAcc && <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>Account: {getAccountLabel(selectedAcc)}</div>}
      </div>

      {/* On-screen controls */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <div>
            <div className="pd-label mb-1">Account</div>
            <Select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} style={{ width: 200 }}>
              <option value="All">All Accounts</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{getAccountLabel(a)}</option>)}
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setYear((y) => y - 1)} className="pd-btn" style={{ padding: "4px 8px" }}>
              <ChevronLeft size={14} />
            </button>
            <span className="pd-mono" style={{ fontSize: 14, color: "var(--brass)", fontWeight: 600, minWidth: 40, textAlign: "center" }}>{year}</span>
            <button onClick={() => setYear((y) => y + 1)} className="pd-btn" style={{ padding: "4px 8px", opacity: year >= currentYear ? 0.3 : 1, pointerEvents: year >= currentYear ? "none" : "auto" }}>
              <ChevronRight size={14} />
            </button>
          </div>
          <button onClick={() => window.print()} className="pd-btn pd-btn-primary flex items-center gap-1.5">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Firm-level table */}
      {filterAccount === "All" && firmData && (
        <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="grid items-center" style={{ gridTemplateColumns: "50px repeat(4, 1fr)", borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
            <span style={s}>MONTH</span>
            <span className="pd-mono" style={s}>FEES</span>
            <span className="pd-mono" style={s}>REFUNDS</span>
            <span className="pd-mono" style={{ ...s, textAlign: "right" }}>PAYOUTS</span>
            <span className="pd-mono" style={{ ...s, textAlign: "right" }}>NET</span>
          </div>
          {firmData.rows.map((r) => {
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
          {firmData.rows.length > 0 && (
            <div className="grid items-center pd-mono" style={{ gridTemplateColumns: "50px repeat(4, 1fr)", padding: "8px 0", borderTop: "1px solid var(--line)", fontWeight: 700 }}>
              <span className="pd-label" style={{ fontSize: 11, color: "var(--brass)" }}>YEAR</span>
              <span style={{ ...cell, color: "var(--slate)" }}>{firmData.yearFees > 0 ? money(firmData.yearFees) : "—"}</span>
              <span style={{ ...cell, color: firmData.yearRefunds > 0 ? "var(--sage)" : "var(--slate)" }}>{firmData.yearRefunds > 0 ? money(firmData.yearRefunds) : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: firmData.yearPayouts > 0 ? "var(--sage)" : "var(--slate)" }}>{firmData.yearPayouts > 0 ? money(firmData.yearPayouts) : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: firmData.yearNet >= 0 ? "var(--sage)" : "var(--brick)" }}>{money(firmData.yearNet)}</span>
            </div>
          )}
          {firmData.rows.length === 0 && (
            <div className="text-xs py-6 text-center" style={{ color: "var(--slate)" }}>No data for {year}.</div>
          )}
        </div>
      )}

      {/* Account-level table */}
      {filterAccount !== "All" && accData && (
        <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="grid items-center" style={{ gridTemplateColumns: "50px 1fr 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
            <span style={s}>MONTH</span>
            <span className="pd-mono" style={s}>P&L</span>
            <span className="pd-mono" style={s}>MFE</span>
            <span className="pd-mono" style={s}>MAE</span>
            <span className="pd-mono" style={s}>REFUND</span>
            <span className="pd-mono" style={{ ...s, textAlign: "right" }}>%</span>
            <span className="pd-mono" style={{ ...s, textAlign: "right" }}>RR</span>
          </div>
          {accData.rows.map((r) => {
            const netPnl = r.pnl + r.refund;
            const pnlPct = ((netPnl / accData.accSize) * 100).toFixed(1);
            return (
              <div key={r.name} className="grid items-center pd-mono" style={{ gridTemplateColumns: "50px 1fr 1fr 1fr 1fr 1fr 1fr", padding: "5px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <span className="pd-label" style={{ fontSize: 11 }}>{r.name}</span>
                <span style={{ ...cell, color: r.pnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{r.pnl !== 0 ? money(r.pnl) : "—"}</span>
                <span style={{ ...cell, color: r.avgMfe != null ? "var(--sage)" : "var(--slate)" }}>{r.avgMfe != null ? `${r.avgMfe}R` : "—"}</span>
                <span style={{ ...cell, color: r.avgMae != null ? "var(--brick)" : "var(--slate)" }}>{r.avgMae != null ? `${r.avgMae}R` : "—"}</span>
                <span style={{ ...cell, color: r.refund > 0 ? "var(--sage)" : "var(--slate)" }}>{r.refund > 0 ? money(r.refund) : "—"}</span>
                <span style={{ ...cell, textAlign: "right", color: netPnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{netPnl !== 0 ? `${netPnl >= 0 ? "+" : ""}${pnlPct}%` : "—"}</span>
                <span style={{ ...cell, textAlign: "right", color: "var(--sand-dim)" }}>{r.avgRr !== null ? `${r.avgRr}R` : "—"}</span>
              </div>
            );
          })}
          {accData.rows.length > 0 && (
            <div className="grid items-center pd-mono" style={{ gridTemplateColumns: "50px 1fr 1fr 1fr 1fr 1fr 1fr", padding: "8px 0", borderTop: "1px solid var(--line)", fontWeight: 700 }}>
              <span className="pd-label" style={{ fontSize: 11, color: "var(--brass)" }}>TOTAL</span>
              <span style={{ ...cell, color: accData.yearPnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{money(accData.yearPnl)}</span>
              <span style={{ ...cell, color: accData.yearAvgMfe != null ? "var(--sage)" : "var(--slate)" }}>{accData.yearAvgMfe != null ? `${accData.yearAvgMfe}R` : "—"}</span>
              <span style={{ ...cell, color: accData.yearAvgMae != null ? "var(--brick)" : "var(--slate)" }}>{accData.yearAvgMae != null ? `${accData.yearAvgMae}R` : "—"}</span>
              <span style={{ ...cell, color: accData.yearRefund > 0 ? "var(--sage)" : "var(--slate)" }}>{accData.yearRefund > 0 ? money(accData.yearRefund) : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: accData.yearNetPnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{`${accData.yearNetPnl >= 0 ? "+" : ""}${((accData.yearNetPnl / accData.accSize) * 100).toFixed(1)}%`}</span>
              <span style={{ ...cell, textAlign: "right", color: "var(--sand-dim)" }}>{accData.yearAvgRr !== null ? `${accData.yearAvgRr}R` : "—"}</span>
            </div>
          )}
          {accData.rows.length === 0 && (
            <div className="text-xs py-6 text-center" style={{ color: "var(--slate)" }}>No data for {year}.</div>
          )}
        </div>
      )}

      {/* Print-only branded footer */}
      <div className="print-footer">
        <div style={{ borderTop: "1px solid #ddd", paddingTop: 8, fontSize: 10, color: "#888" }}>
          EC PROPFOLIO — EspoirCapital
        </div>
      </div>
    </div>
  );
}
