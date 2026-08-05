import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { money, formatDateUK, computeOutcome, formatDisplay, getAccountLabel, OUTCOME_META, RATING_META, computeMfeMaeStats, computeEv, formatEv, computeDayProfile, computeDayEdge } from "../utils";
import { STATUS_META } from "../constants";
import { KpiTile } from "../components/KpiTile";
import { DayEdgeTile } from "../components/DayEdgeTile";
import { DayOfWeekChart } from "../components/DayOfWeekChart";
import { StatusPill } from "../components/StatusPill";
import { EquityCurve } from "../components/EquityCurve";
import { TradeCalendar } from "../components/TradeCalendar";
import { PerformanceSummary } from "../components/PerformanceSummary";
import { AiAnalysis } from "../components/AiAnalysis";

const SESSIONS = ["London", "NY", "Asia"];
const SESSION_LABEL = { London: "LONDON", NY: "NEW YORK", Asia: "ASIA" };

export function OverviewView({ derived, trades, payouts, settings }) {
  const allTrades = useMemo(() => {
    return trades.filter((t) => !t.archived).map((t) => {
      const outcome = computeOutcome(t.pnl, t.risk, settings.beThreshold);
      const account = derived.accounts.find((a) => a.id === t.accountId);
      return { ...t, outcome, accountLabel: account ? getAccountLabel(account) : t.accountId };
    }).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [trades, derived.accounts, settings.beThreshold]);

  const allPayouts = useMemo(() => {
    return payouts.map((p) => {
      const account = derived.accounts.find((a) => a.id === p.accountId);
      return { ...p, accountLabel: account ? getAccountLabel(account) : p.accountId };
    }).sort((a, b) => (a.requestedDate < b.requestedDate ? 1 : -1));
  }, [payouts, derived.accounts]);

  const totalTrades = allTrades.length;
  const wins = allTrades.filter((t) => t.outcome === "W").length;
  const losses = allTrades.filter((t) => t.outcome === "L").length;
  const decisionTrades = wins + losses;
  const winRate = decisionTrades ? Math.round((wins / decisionTrades) * 100) : 0;
  const activeAccounts = derived.accounts.filter((a) => !a.archived && a.status !== "breached").length;

  const mfeStats = useMemo(() => computeMfeMaeStats(allTrades, settings.mfeThreshold), [allTrades, settings.mfeThreshold]);

  const ev = useMemo(() => computeEv(allTrades), [allTrades]);

  const dayEdge = useMemo(() => computeDayEdge(allTrades), [allTrades]);

  const dayProfile = useMemo(() => computeDayProfile(allTrades), [allTrades]);

  const avgRR = useMemo(() => {
    const winTrades = allTrades.filter((t) => t.outcome === "W" && t.risk > 0);
    return winTrades.length ? (winTrades.reduce((s, t) => s + (t.pnl / t.risk), 0) / winTrades.length).toFixed(1) : null;
  }, [allTrades]);

  const curve = useMemo(() => {
    const sorted = [...allTrades].sort((a, b) => (a.date > b.date ? 1 : -1));
    const refundEvents = derived.accounts
      .filter((a) => a.refund > 0 && a.refundDate)
      .map((a) => ({ date: a.refundDate, pnl: a.refund, isRefund: true, id: "refund-" + a.id }));
    const merged = [...sorted, ...refundEvents].sort((a, b) => (a.date > b.date ? 1 : -1));
    let running = 0;
    return merged.map((t) => {
      running += t.pnl;
      return { date: formatDateUK(t.date), pnl: Math.round(running), ...(t.isRefund ? { label: "Refund" } : {}) };
    });
  }, [allTrades, derived.accounts]);

  const recentTrades = allTrades.slice(0, 10);
  const latestPayouts = allPayouts.slice(0, 5);

  const accountBreakdown = useMemo(() => {
    return derived.accounts.filter((a) => !a.archived).map((acc) => {
      const accTrades = trades.filter((t) => t.accountId === acc.id && !t.archived);
      const accPayouts = payouts.filter((p) => p.accountId === acc.id);
      const totalPnl = accTrades.reduce((s, t) => s + t.pnl, 0);
      const totalPayoutAmt = accPayouts.reduce((s, p) => s + p.amount, 0);
      const accWins = accTrades.filter((t) => computeOutcome(t.pnl, t.risk, settings.beThreshold) === "W").length;
      const accLosses = accTrades.filter((t) => computeOutcome(t.pnl, t.risk, settings.beThreshold) === "L").length;
      const accDecisions = accWins + accLosses;
      const accWinRate = accDecisions ? Math.round((accWins / accDecisions) * 100) : null;
      return { ...acc, totalPnl, totalPayoutAmt, tradeCount: accTrades.length, winRate: accWinRate };
    }).sort((a, b) => b.totalPnl - a.totalPnl);
  }, [derived.accounts, trades, payouts, settings.beThreshold]);

  const sessionPerf = useMemo(() => {
    const map = {};
    SESSIONS.forEach((s) => { map[s] = { trades: 0, wins: 0, losses: 0 }; });
    allTrades.forEach((t) => {
      if (!t.session || !map[t.session]) return;
      const s = map[t.session];
      s.trades++;
      if (t.outcome === "W") s.wins++;
      if (t.outcome === "L") s.losses++;
    });
    return SESSIONS.map((name) => {
      const s = map[name];
      return {
        name,
        trades: s.trades,
        winRate: (s.wins + s.losses) ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0,
      };
    });
  }, [allTrades]);

  const tagPerf = useMemo(() => {
    const tags = {};
    allTrades.forEach((t) => {
      if (!t.tag) return;
      if (!tags[t.tag]) tags[t.tag] = { trades: 0, wins: 0, losses: 0, totalPnl: 0 };
      const s = tags[t.tag];
      s.trades++;
      if (t.outcome === "W") s.wins++;
      if (t.outcome === "L") s.losses++;
      s.totalPnl += t.pnl;
    });
    return Object.entries(tags).map(([name, s]) => ({
      name,
      trades: s.trades,
      winRate: (s.wins + s.losses) ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0,
      totalPnl: s.totalPnl,
    })).sort((a, b) => b.totalPnl - a.totalPnl);
  }, [allTrades]);

  const symbolPerf = useMemo(() => {
    const symbols = {};
    allTrades.forEach((t) => {
      if (!symbols[t.symbol]) symbols[t.symbol] = { trades: 0, wins: 0, losses: 0, totalPnl: 0 };
      const s = symbols[t.symbol];
      s.trades++;
      if (t.outcome === "W") s.wins++;
      if (t.outcome === "L") s.losses++;
      s.totalPnl += t.pnl;
    });
    return Object.entries(symbols).map(([name, s]) => ({
      name,
      trades: s.trades,
      winRate: (s.wins + s.losses) ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0,
      totalPnl: s.totalPnl,
    })).sort((a, b) => b.totalPnl - a.totalPnl);
  }, [allTrades]);

  return (
    <div>
      {/* Row 1 — KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiTile label="Total Invested" animate={derived.totals.invested} fmt={money} delay={0} sub={`${derived.accounts.length} accounts`} />
        <KpiTile label="Total Received" animate={derived.totals.received + derived.totals.refunds} fmt={money} delay={70} accent="var(--sage)" sub="payouts + refunds" />
        <KpiTile
          label="Net Position"
          animate={derived.totals.received + derived.totals.refunds - derived.totals.invested}
          fmt={money}
          delay={140}
          accent={derived.totals.received + derived.totals.refunds - derived.totals.invested >= 0 ? "var(--sage)" : "var(--brick)"}
          sub="lifetime, all firms"
        />
        <KpiTile label="Win Rate" animate={winRate} fmt={(n) => `${Math.round(n)}%`} delay={210} accent="var(--sage)" sub={`${wins}W / ${losses}L`} />
        <KpiTile label="Total Trades" animate={totalTrades} fmt={(n) => Math.round(n)} delay={280} accent="var(--sand)" sub="across all accounts" />
        <KpiTile label="Active Accounts" animate={activeAccounts} fmt={(n) => Math.round(n)} delay={350} accent="var(--brass)" sub={`of ${derived.accounts.length} total`} />
      </div>

      {/* Row 1b — MFE/MAE stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        <KpiTile label="EV" value={formatEv(ev)} accent={ev !== null && ev < 0 ? "var(--brick)" : "var(--brass)"} sub="R per trade" />
        <KpiTile label="Avg MAE" value={mfeStats.avgMae} accent="var(--brick)" sub="R" />
        <KpiTile label="Avg MFE" value={mfeStats.avgMfe} accent="var(--sage)" sub="R" />
        <KpiTile label="WR w/ limit @ avg MAE" value={mfeStats.limitWr} accent="var(--sand)" sub={mfeStats.limitSub} />
        <KpiTile label="WR @ avg MFE" value={mfeStats.wrAtAvgMfe} accent="var(--brass)" sub={mfeStats.wrSub} />
        <KpiTile label="WR limit MAE + TP MFE" value={mfeStats.comboWr} accent="var(--sage)" sub={mfeStats.comboSub} />
        <div className="col-span-2 sm:col-span-3 lg:col-span-1"><DayEdgeTile dayEdge={dayEdge} /></div>
      </div>

      {totalTrades > 0 && (
        <div className="mb-6">
          <AiAnalysis
            scope="Overview"
            stats={{
              tradeCount: totalTrades,
              wins,
              losses,
              winRate,
              avgRR,
              ev: formatEv(ev),
              mfeThreshold: settings.mfeThreshold,
              avgMfe: mfeStats.avgMfe,
              avgMae: mfeStats.avgMae,
              capture: mfeStats.capture,
              giveback: mfeStats.giveback,
              limitWr: mfeStats.limitWr,
              limitSub: mfeStats.limitSub,
              comboWr: mfeStats.comboWr,
              comboSub: mfeStats.comboSub,
              wrAtAvgMfe: mfeStats.wrAtAvgMfe,
              wrSub: mfeStats.wrSub,
            }}
          />
        </div>
      )}

      {/* Row 2 — Cumulative P&L + Day of Week */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          {curve.length > 1 ? (
            <EquityCurve data={curve} height={260} gradientId="pdAreaOverview" title="Cumulative P&L" />
          ) : (
            <div className="rounded-lg" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
              <div className="pd-label" style={{ padding: "16px 16px 0" }}>Cumulative P&L</div>
              <div className="p-10 text-center text-sm" style={{ color: "var(--slate)" }}>
                Log some trades to see your equity curve.
              </div>
            </div>
          )}
        </div>
        {totalTrades > 0 && (
          <div className="lg:col-span-2">
            <DayOfWeekChart days={dayProfile} plotHeight={170} />
          </div>
        )}
      </div>

      {/* Row 3 — Trade Calendar + Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-2">
          <TradeCalendar trades={allTrades} beThreshold={settings.beThreshold} />
        </div>
        <div className="lg:col-span-3">
          <PerformanceSummary payouts={allPayouts} accounts={derived.accounts} />
        </div>
      </div>

      {/* Row 4 — Recent Trades + Latest Payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          <div className="pd-label mb-2">Recent Trades</div>
          {recentTrades.length === 0 ? (
            <div className="rounded-lg p-8 text-center text-sm" style={{ border: "1px dashed var(--line)", color: "var(--slate)" }}>
              No trades logged yet.
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
              <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1fr 80px 38px 90px 80px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "8px 14px" }}>
                <span>Account</span><span>Symbol</span><span></span><span>P&L</span><span>Date</span>
              </div>
              {recentTrades.map((t) => (
                <Link key={t.id} to="/journal" search={{ account: t.accountId }}
                  className="pd-row grid items-center text-sm pd-mono no-underline"
                  style={{ gridTemplateColumns: "1fr 80px 38px 90px 80px", gap: "0 12px", padding: "8px 14px", borderBottom: "1px solid var(--line)", color: "var(--sand)", textDecoration: "none" }}>
                  <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--sand-dim)" }}>{t.accountLabel}</span>
                  <span className="whitespace-nowrap">{t.symbol}</span>
                  <span className="whitespace-nowrap" style={{ color: t.side === "Long" ? "var(--sage)" : "var(--brick)" }}>{t.side.slice(0, 1)}</span>
                  <span className="whitespace-nowrap" style={{ color: t.pnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{formatDisplay(t.pnl, settings.displayFormat, 0, t.risk)}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDateUK(t.date)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="pd-label mb-2">Latest Payouts</div>
          {latestPayouts.length === 0 ? (
            <div className="rounded-lg p-8 text-center text-sm" style={{ border: "1px dashed var(--line)", color: "var(--slate)" }}>
              No payouts yet.
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
              <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1fr 90px 80px 80px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "8px 14px" }}>
                <span>Account</span><span>Amount</span><span>Date</span><span>Method</span>
              </div>
              {latestPayouts.map((p) => (
                <Link key={p.id} to="/accounts/$accountId" params={{ accountId: p.accountId }}
                  className="pd-row grid items-center text-sm pd-mono no-underline"
                  style={{ gridTemplateColumns: "1fr 90px 80px 80px", gap: "0 12px", padding: "8px 14px", borderBottom: "1px solid var(--line)", color: "var(--sand)", textDecoration: "none" }}>
                  <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--sand-dim)" }}>{p.accountLabel}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--sage)" }}>{money(p.amount)}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDateUK(p.requestedDate)}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--sand-dim)", fontFamily: "'IBM Plex Sans', sans-serif" }}>{p.method}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 5 — Account Breakdown */}
      <div className="mb-6">
        <div className="pd-label mb-2">Account Breakdown</div>
        {accountBreakdown.length === 0 ? (
          <div className="rounded-lg p-8 text-center text-sm" style={{ border: "1px dashed var(--line)", color: "var(--slate)" }}>
            No accounts yet. <Link to="/accounts" className="pd-link">Add your first account.</Link>
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1.2fr 100px 90px 60px 80px 90px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "8px 14px" }}>
              <span>Account</span><span>Status</span><span>P&L</span><span>Trades</span><span>Win Rate</span><span>Payouts</span>
            </div>
            {accountBreakdown.map((a) => (
              <Link key={a.id} to="/accounts/$accountId" params={{ accountId: a.id }}
                className="pd-row grid items-center text-sm pd-mono no-underline"
                style={{ gridTemplateColumns: "1.2fr 100px 90px 60px 80px 90px", gap: "0 12px", padding: "8px 14px", borderBottom: "1px solid var(--line)", color: "var(--sand)", textDecoration: "none" }}>
                <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{getAccountLabel(a)}</span>
                <span className="whitespace-nowrap"><StatusPill status={a.status} /></span>
                <span className="whitespace-nowrap" style={{ color: a.totalPnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{money(a.totalPnl)}</span>
                <span className="whitespace-nowrap">{a.tradeCount}</span>
                <span className="whitespace-nowrap" style={{ color: a.winRate !== null ? "var(--sand-dim)" : "var(--slate)" }}>{a.winRate !== null ? `${a.winRate}%` : "—"}</span>
                <span className="whitespace-nowrap" style={{ color: a.totalPayoutAmt > 0 ? "var(--sage)" : "var(--slate)" }}>{a.totalPayoutAmt > 0 ? money(a.totalPayoutAmt) : "—"}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Row 6 — Performance by Session */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {sessionPerf.map((s) => (
          <div key={s.name} className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
            <div className="pd-label mb-2">{SESSION_LABEL[s.name] || s.name.toUpperCase()}</div>
            <div className="flex items-baseline gap-3">
              <span className="pd-mono text-lg font-medium" style={{ color: "var(--sand)" }}>{s.winRate}%</span>
              <span className="pd-mono text-xs" style={{ color: "var(--slate)" }}>{s.trades} trades</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 7 — Performance by Symbol + Strategy (side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Symbol — left, wider */}
        <div className="lg:col-span-3">
          <div className="pd-label mb-2">Performance by Symbol</div>
          {symbolPerf.length === 0 ? (
            <div className="rounded-lg p-8 text-center text-sm" style={{ border: "1px dashed var(--line)", color: "var(--slate)" }}>No trades yet.</div>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
              <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1fr 80px 80px 100px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "8px 14px" }}>
                <span>Symbol</span><span>Trades</span><span>Win Rate</span><span>Total P&L</span>
              </div>
              {symbolPerf.map((s) => (
                <div key={s.name} className="pd-row grid items-center text-sm pd-mono" style={{ gridTemplateColumns: "1fr 80px 80px 100px", gap: "0 12px", padding: "8px 14px", borderBottom: "1px solid var(--line)" }}>
                  <span className="whitespace-nowrap">{s.name}</span>
                  <span className="whitespace-nowrap">{s.trades}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--sand-dim)" }}>{s.winRate}%</span>
                  <span className="whitespace-nowrap" style={{ color: s.totalPnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{money(s.totalPnl)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strategy — right, narrower */}
        <div className="lg:col-span-2">
          <div className="pd-label mb-2">Performance by Strategy</div>
          {tagPerf.length === 0 ? (
            <div className="rounded-lg p-8 text-center text-sm" style={{ border: "1px dashed var(--line)", color: "var(--slate)" }}>No trades yet.</div>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
              <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1fr 60px 70px 90px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "8px 14px" }}>
                <span>Tag</span><span>Trades</span><span>WR</span><span>P&L</span>
              </div>
              {tagPerf.map((t) => (
                <div key={t.name} className="pd-row grid items-center text-sm pd-mono" style={{ gridTemplateColumns: "1fr 60px 70px 90px", gap: "0 12px", padding: "8px 14px", borderBottom: "1px solid var(--line)" }}>
                  <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{t.name}</span>
                  <span className="whitespace-nowrap">{t.trades}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--sand-dim)" }}>{t.winRate}%</span>
                  <span className="whitespace-nowrap" style={{ color: t.totalPnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{money(t.totalPnl)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
