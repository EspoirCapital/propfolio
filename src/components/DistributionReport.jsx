import { useMemo, useState } from "react";
import { computeOutcome, computeEv, formatEv, money, getAccountLabel, getOpenDate, getTradeTime, formatDateUK } from "../utils";
import { Select } from "./Select";
import { KpiTile } from "./KpiTile";
import { DayOfWeekChart } from "./DayOfWeekChart";
import { EquityCurve } from "./EquityCurve";

const DAYS = [
  { dow: 1, label: "Mon" },
  { dow: 2, label: "Tue" },
  { dow: 3, label: "Wed" },
  { dow: 4, label: "Thu" },
  { dow: 5, label: "Fri" },
];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

const S = { fontSize: 11, color: "var(--slate)" };
const cell = { fontSize: 12, fontWeight: 500 };

function FreqChart({ items, plotHeight = 130 }) {
  const maxN = Math.max(...items.map((i) => i.n), 1);
  const barArea = plotHeight - 30;
  const maxBar = barArea - 16;
  const peak = Math.max(...items.map((i) => i.n));
  return (
    <div className="flex" style={{ position: "relative", height: plotHeight }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, height: 1, background: "var(--line)" }} />
      {items.map((i) => {
        const barH = i.n > 0 ? Math.max((i.n / maxN) * maxBar, 3) : 0;
        const isPeak = i.n > 0 && i.n === peak;
        const color = isPeak ? "var(--brass)" : "var(--slate)";
        return (
          <div key={i.label} className="flex-1" style={{ position: "relative", height: plotHeight }}
            title={`${i.label}: ${i.n} trade${i.n === 1 ? "" : "s"}`}>
            {i.n > 0 && (
              <div className="pd-mono" style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 10, color, bottom: 26 + barH + 2 }}>
                {i.n}
              </div>
            )}
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 26, width: "60%", maxWidth: 16, height: barH, background: color, opacity: isPeak ? 1 : 0.45, borderRadius: 2 }} />
          </div>
        );
      })}
      <div className="flex" style={{ position: "absolute", left: 0, right: 0, bottom: 6 }}>
        {items.map((i) => (
          <div key={i.label} className="flex-1 text-center">
            <div className="pd-mono" style={{ fontSize: 9, color: "var(--sand-dim)" }}>{i.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function winRateOf(decisions, wins) {
  return decisions.length ? Math.round((wins / decisions.length) * 100) : null;
}

// Pure filter for the distribution report: account, weekday set, and entry
// hour window (inclusive, wrap-around when from > to). When a time window is
// active, trades without a recorded entry time are excluded entirely.
export function applyDistributionFilters(trades, { accountId = "All", days, fromHour = null, toHour = null } = {}) {
  const timeActive = fromHour !== null || toHour !== null;
  const f = fromHour !== null ? fromHour : 0;
  const t = toHour !== null ? toHour : 23;
  const inRange = (hour) => (f <= t ? hour >= f && hour <= t : hour >= f || hour <= t);
  return trades.filter((tr) => {
    if (tr.archived) return false;
    if (accountId !== "All" && tr.accountId !== accountId) return false;
    if (days && !days.includes(new Date(`${tr.date}T00:00:00`).getDay())) return false;
    if (timeActive) {
      const tm = getTradeTime(getOpenDate(tr));
      if (!tm) return false;
      if (!inRange(Number(tm.slice(0, 2)))) return false;
    }
    return true;
  });
}

export function DistributionReport({ accounts, trades, settings }) {
  const [filterAccount, setFilterAccount] = useState("All");
  const [days, setDays] = useState(DAYS.map((d) => d.dow));
  const [fromHour, setFromHour] = useState(null);
  const [toHour, setToHour] = useState(null);

  const timeActive = fromHour !== null || toHour !== null;
  const f = fromHour !== null ? fromHour : 0;
  const t = toHour !== null ? toHour : 23;

  const pool = useMemo(() => {
    return applyDistributionFilters(trades, { accountId: filterAccount, days, fromHour, toHour }).map((tr) => ({
      ...tr,
      outcome: computeOutcome(tr.pnl, tr.risk, settings.beThreshold),
      entryHour: getTradeTime(getOpenDate(tr)),
    }));
  }, [trades, filterAccount, days, fromHour, toHour, settings.beThreshold]);

  const dayStats = useMemo(() => {
    return DAYS.map(({ dow, label }) => {
      const all = pool.filter((tr) => new Date(`${tr.date}T00:00:00`).getDay() === dow);
      const dec = all.filter((tr) => tr.outcome === "W" || tr.outcome === "L");
      const wins = dec.filter((tr) => tr.outcome === "W").length;
      const evPool = all.filter((tr) => tr.risk > 0 && tr.outcome !== "BE");
      return {
        dow,
        label,
        n: all.length,
        winRate: winRateOf(dec, wins),
        avgR: evPool.length ? evPool.reduce((s, tr) => s + tr.pnl / tr.risk, 0) / evPool.length : null,
        totalPnl: all.reduce((s, tr) => s + tr.pnl, 0),
      };
    });
  }, [pool]);

  const hourStats = useMemo(() => {
    const map = {};
    pool.forEach((tr) => {
      if (!tr.entryHour) return;
      const hour = Number(tr.entryHour.slice(0, 2));
      if (!map[hour]) map[hour] = { hour, n: 0, dec: 0, wins: 0, evSum: 0, evN: 0, pnl: 0 };
      const b = map[hour];
      b.n++;
      b.pnl += tr.pnl;
      if (tr.outcome === "W" || tr.outcome === "L") {
        b.dec++;
        if (tr.outcome === "W") b.wins++;
      }
      if (tr.risk > 0 && tr.outcome !== "BE") {
        b.evSum += tr.pnl / tr.risk;
        b.evN++;
      }
    });
    return Object.values(map)
      .sort((a, b) => a.hour - b.hour)
      .map((b) => ({
        ...b,
        label: HOUR_OPTIONS[b.hour],
        winRate: winRateOf(b.dec, b.wins),
        avgR: b.evN ? b.evSum / b.evN : null,
      }));
  }, [pool]);

  const heatCells = useMemo(() => {
    const cells = {};
    pool.forEach((tr) => {
      if (!tr.entryHour || !(tr.risk > 0) || tr.outcome === "BE") return;
      const dow = new Date(`${tr.date}T00:00:00`).getDay();
      const key = `${dow}:${tr.entryHour.slice(0, 2)}`;
      if (!cells[key]) cells[key] = { dow, hour: Number(tr.entryHour.slice(0, 2)), sum: 0, n: 0 };
      cells[key].sum += tr.pnl / tr.risk;
      cells[key].n++;
    });
    return cells;
  }, [pool]);

  const bestWindow = useMemo(() => {
    let best = null;
    Object.values(heatCells).forEach((c) => {
      const avg = c.sum / c.n;
      if (best && avg < best.avg) return;
      if (best && avg === best.avg && c.n <= best.n) return;
      best = { label: `${DAY_FULL[c.dow].slice(0, 3)} ${HOUR_OPTIONS[c.hour]}`, avg, n: c.n };
    });
    return best;
  }, [heatCells]);

  const accountRows = useMemo(() => {
    const map = {};
    pool.forEach((tr) => {
      if (!map[tr.accountId]) map[tr.accountId] = { id: tr.accountId, n: 0, dec: 0, wins: 0, evSum: 0, evN: 0, pnl: 0 };
      const b = map[tr.accountId];
      b.n++;
      b.pnl += tr.pnl;
      if (tr.outcome === "W" || tr.outcome === "L") {
        b.dec++;
        if (tr.outcome === "W") b.wins++;
      }
      if (tr.risk > 0 && tr.outcome !== "BE") {
        b.evSum += tr.pnl / tr.risk;
        b.evN++;
      }
    });
    return Object.values(map)
      .sort((a, b) => b.n - a.n)
      .map((b) => {
        const account = accounts.find((a) => a.id === b.id);
        return {
          ...b,
          label: account ? getAccountLabel(account) : b.id,
          winRate: winRateOf(b.dec, b.wins),
          avgR: b.evN ? b.evSum / b.evN : null,
        };
      });
  }, [pool, accounts]);

  const dateRange = useMemo(() => {
    if (!pool.length) return null;
    const dates = pool.map((tr) => tr.date).sort();
    return `${formatDateUK(dates[0])} → ${formatDateUK(dates[dates.length - 1])}`;
  }, [pool]);

  const wins = pool.filter((tr) => tr.outcome === "W").length;
  const losses = pool.filter((tr) => tr.outcome === "L").length;
  const decisionTrades = wins + losses;
  const winRate = decisionTrades ? Math.round((wins / decisionTrades) * 100) : null;
  const ev = computeEv(pool);
  const totalPnl = pool.reduce((s, tr) => s + tr.pnl, 0);
  const activeAccounts = new Set(pool.map((tr) => tr.accountId)).size;

  const tradedDays = dayStats.filter((d) => d.n > 0);
  const bestDay = (() => {
    const rel = [...tradedDays].sort((a, b) => (b.avgR ?? -Infinity) - (a.avgR ?? -Infinity));
    return rel.find((d) => d.n >= 3 && d.avgR !== null) || rel.find((d) => d.avgR !== null) || null;
  })();
  const worstDay = (() => {
    const rel = [...tradedDays].sort((a, b) => (a.avgR ?? Infinity) - (b.avgR ?? Infinity));
    return rel.find((d) => d.n >= 3 && d.avgR !== null) || rel.find((d) => d.avgR !== null) || null;
  })();
  const bestHour = (() => {
    const rel = [...hourStats].sort((a, b) => (b.avgR ?? -Infinity) - (a.avgR ?? -Infinity));
    return rel.find((h) => h.n >= 3 && h.avgR !== null) || rel.find((h) => h.avgR !== null) || null;
  })();
  const worstHour = (() => {
    const rel = [...hourStats].sort((a, b) => (a.avgR ?? Infinity) - (b.avgR ?? Infinity));
    return rel.find((h) => h.n >= 3 && h.avgR !== null) || rel.find((h) => h.avgR !== null) || null;
  })();
  const busiestHour = hourStats.length ? [...hourStats].sort((a, b) => b.n - a.n)[0] : null;
  const smallCells = Object.values(heatCells).filter((c) => c.n < 3).length;

  const toggleDay = (dow) => {
    setDays((prev) => {
      const next = prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow];
      return next.length === 0 ? DAYS.map((d) => d.dow) : next;
    });
  };

  const chipStyle = (active) => ({
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 6,
    border: `1px solid ${active ? "var(--brass)" : "var(--line)"}`,
    color: active ? "var(--brass)" : "var(--slate)",
    background: active ? "rgba(206,159,82,0.1)" : "transparent",
  });

  const hourSelect = (value, setValue) => (
    <Select value={value === null ? "" : HOUR_OPTIONS[value]} onChange={(e) => setValue(e.target.value === "" ? null : Number(e.target.value.slice(0, 2)))} style={{ width: 110 }}>
      <option value="">Any</option>
      {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
    </Select>
  );

  const curve = useMemo(() => {
    const sorted = [...pool].sort((a, b) => (getOpenDate(a) > getOpenDate(b) ? 1 : -1));
    let running = 0;
    const points = sorted.map((tr) => {
      running += tr.pnl;
      return { date: formatDateUK(tr.date), pnl: Math.round(running) };
    });
    if (!points.length) return [];
    return [{ date: points[0].date, pnl: 0 }, ...points];
  }, [pool]);

  const avgRChartDays = dayStats.map((d) => ({ day: d.dow, label: d.label, avg: d.avgR, n: d.n }));
  const avgRChartHours = hourStats.map((h) => ({ day: h.hour, label: h.label, avg: h.avgR, n: h.evN }));

  if (!pool.length) {
    return (
      <div className="rounded-lg p-6 text-center" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
        <div className="pd-label mb-2">Distribution Report</div>
        <p className="text-sm" style={{ color: "var(--slate)" }}>No trades match the current filters.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <div className="pd-label mb-1">Account</div>
          <Select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} style={{ width: 200 }}>
            <option value="All">All Accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{getAccountLabel(a)}</option>)}
          </Select>
        </div>
        <div>
          <div className="pd-label mb-1">Days</div>
          <div className="flex items-center gap-1.5">
            {DAYS.map(({ dow, label }) => (
              <button key={dow} className="pd-mono" style={chipStyle(days.includes(dow))} onClick={() => toggleDay(dow)}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="pd-label mb-1">From</div>
          {hourSelect(fromHour, setFromHour)}
        </div>
        <div>
          <div className="pd-label mb-1">To</div>
          {hourSelect(toHour, setToHour)}
        </div>
      </div>

      {timeActive && (
        <div className="pd-mono text-xs mb-4" style={{ color: "var(--brass-dim)" }}>
          Trades without an entry time are excluded · range {HOUR_OPTIONS[f]}–{HOUR_OPTIONS[t]}{f > t ? " (overnight)" : ""}
        </div>
      )}

      <div className="pd-mono text-xs mb-4" style={{ color: "var(--sand-dim)" }}>
        {pool.length} closed trade{pool.length === 1 ? "" : "s"} across {activeAccounts} account{activeAccounts === 1 ? "" : "s"} · {dateRange}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <KpiTile label="Trades" value={pool.length} accent="var(--sand)" />
        <KpiTile label="Win Rate" value={winRate !== null ? `${winRate}%` : "—"} accent="var(--sage)" sub={decisionTrades ? `${wins}W / ${losses}L` : null} />
        <KpiTile label="Avg R / Trade" value={formatEv(ev)} accent={ev !== null && ev < 0 ? "var(--brick)" : ev !== null && ev >= 0.2 ? "var(--sage)" : "var(--brass)"} sub="R per trade" />
        <KpiTile label="Total P&L" value={totalPnl >= 0 ? `+${money(totalPnl)}` : `-${money(Math.abs(totalPnl))}`} accent={totalPnl >= 0 ? "var(--sage)" : "var(--brick)"} />
        <KpiTile label="Best Window" value={bestWindow ? bestWindow.label : "—"} accent="var(--brass)" sub={bestWindow ? `${formatEv(bestWindow.avg)} · ${bestWindow.n} trade${bestWindow.n === 1 ? "" : "s"}` : "by avg R"} />
      </div>

      <div className="mb-6">
        <div className="pd-label mb-2">01 · Equity Curve — Cumulative P&L</div>
        <EquityCurve data={curve} height={280} showX />
      </div>

      <div className="mb-6">
        <div className="pd-label mb-1">02 · Edge by Day of Week</div>
        <p className="text-xs mb-3" style={{ color: "var(--slate)" }}>Grouped by the day the trade opened. Avg R is expectancy per trade in that bucket.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
            <div className="pd-label mb-3">Avg R by weekday</div>
            <DayOfWeekChart days={avgRChartDays} plotHeight={190} />
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
            <div className="pd-label mb-3">Trade frequency by weekday</div>
            <FreqChart items={tradedDays.map((d) => ({ label: d.label, n: d.n }))} />
          </div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="grid items-center" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
            <span style={S}>DAY</span>
            <span className="pd-mono" style={S}>TRADES</span>
            <span className="pd-mono" style={S}>WIN RATE</span>
            <span className="pd-mono" style={{ ...S, textAlign: "right" }}>AVG R</span>
            <span className="pd-mono" style={{ ...S, textAlign: "right" }}>TOTAL P&L</span>
          </div>
          {tradedDays.map((d) => (
            <div key={d.dow} className="grid items-center pd-mono" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: "5px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <span className="pd-label" style={{ fontSize: 11 }}>{DAY_FULL[d.dow]}</span>
              <span style={{ ...cell, color: "var(--slate)" }}>{d.n}</span>
              <span style={{ ...cell, color: "var(--sand-dim)" }}>{d.winRate !== null ? `${d.winRate}%` : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: d.avgR !== null ? (d.avgR < 0 ? "var(--brick)" : "var(--sage)") : "var(--slate)" }}>{d.avgR !== null ? formatEv(d.avgR) : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: d.totalPnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{d.totalPnl >= 0 ? `+${money(d.totalPnl)}` : `-${money(Math.abs(d.totalPnl))}`}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="pd-label mb-1">03 · Edge by Entry Hour</div>
        <p className="text-xs mb-3" style={{ color: "var(--slate)" }}>Same idea, by clock hour of entry. This is usually the sharpest lens on when to avoid, when to trade.</p>
        {hourStats.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
                <div className="pd-label mb-3">Avg R by hour</div>
                <DayOfWeekChart days={avgRChartHours} plotHeight={190} />
              </div>
              <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
                <div className="pd-label mb-3">Trade frequency by hour</div>
                <FreqChart items={hourStats.map((h) => ({ label: h.label.slice(0, 2), n: h.n }))} />
              </div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
              <div className="grid items-center" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
                <span style={S}>HOUR</span>
                <span className="pd-mono" style={S}>TRADES</span>
                <span className="pd-mono" style={S}>WIN RATE</span>
                <span className="pd-mono" style={{ ...S, textAlign: "right" }}>AVG R</span>
                <span className="pd-mono" style={{ ...S, textAlign: "right" }}>TOTAL P&L</span>
              </div>
              {hourStats.map((h) => (
                <div key={h.hour} className="grid items-center pd-mono" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: "5px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <span className="pd-label" style={{ fontSize: 11 }}>{h.label}</span>
                  <span style={{ ...cell, color: "var(--slate)" }}>{h.n}</span>
                  <span style={{ ...cell, color: "var(--sand-dim)" }}>{h.winRate !== null ? `${h.winRate}%` : "—"}</span>
                  <span style={{ ...cell, textAlign: "right", color: h.avgR !== null ? (h.avgR < 0 ? "var(--brick)" : "var(--sage)") : "var(--slate)" }}>{h.avgR !== null ? formatEv(h.avgR) : "—"}</span>
                  <span style={{ ...cell, textAlign: "right", color: h.pnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{h.pnl >= 0 ? `+${money(h.pnl)}` : `-${money(Math.abs(h.pnl))}`}</span>
                </div>
              ))}
              <div className="pd-mono text-xs mt-2" style={{ color: "var(--sand-dim)" }}>
                {hourStats.reduce((s, h) => s + h.n, 0)} of {pool.length} trades have entry times
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
            <p className="text-sm" style={{ color: "var(--slate)" }}>No trades in the current selection have entry times. Log entry times (HH:MM) on trades to see the hourly edge.</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="pd-label mb-1">04 · Weekday × Hour Matrix</div>
        <p className="text-xs mb-3" style={{ color: "var(--slate)" }}>Every cell is a day/hour combination: top number is avg R, bottom number is trade count. Green = positive expectancy, red = negative. Empty cells mean you haven't traded that slot yet.</p>
        {hourStats.length > 0 ? (
          <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)", overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th />
                  {hourStats.map((h) => (
                    <th key={h.hour} className="pd-mono" style={{ ...S, padding: "6px 4px", textAlign: "center" }}>{h.label.slice(0, 2)}h</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(({ dow, label }) => {
                  const maxAbs = Math.max(...Object.values(heatCells).filter((c) => c.dow === dow).map((c) => Math.abs(c.sum / c.n)), 1);
                  return (
                    <tr key={dow}>
                      <td className="pd-mono" style={{ ...S, paddingRight: 10, textAlign: "right" }}>{label}</td>
                      {hourStats.map((h) => {
                        const c = heatCells[`${dow}:${h.hour}`];
                        if (!c) {
                          return (
                            <td key={h.hour} style={{ padding: "6px 4px", textAlign: "center", color: "var(--slate)", fontSize: 11 }}>·</td>
                          );
                        }
                        const avg = c.sum / c.n;
                        const alpha = Math.min(0.55, 0.08 + (Math.abs(avg) / maxAbs) * 0.45);
                        const bg = avg >= 0 ? `rgba(111,176,139,${alpha})` : `rgba(193,89,75,${alpha})`;
                        return (
                          <td key={h.hour} className="pd-mono" style={{ padding: "6px 4px", textAlign: "center", background: bg, borderRadius: 4 }}
                            title={`${DAY_FULL[dow]} ${h.label} — ${c.n} trade${c.n === 1 ? "" : "s"}, avg R ${avg >= 0 ? "+" : ""}${avg.toFixed(1)}`}>
                            <div style={{ fontSize: 10.5, color: avg >= 0 ? "var(--sage)" : "var(--brick)", fontWeight: 600 }}>{avg >= 0 ? "+" : ""}{avg.toFixed(1)}</div>
                            <div style={{ fontSize: 9, color: "var(--sand-dim)" }}>{c.n}t</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
            <p className="text-sm" style={{ color: "var(--slate)" }}>No trades in the current selection have entry times. Log entry times (HH:MM) on trades to see the weekday × hour matrix.</p>
          </div>
        )}
        {smallCells > 0 && (
          <div className="pd-mono text-xs mt-2" style={{ color: "var(--sand-dim)" }}>
            {smallCells} day/hour cell{smallCells === 1 ? "" : "s"} have fewer than 3 trades — treat those numbers as early signal, not proof.
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="pd-label mb-1">05 · Takeaways</div>
        <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <ul className="text-sm space-y-1.5" style={{ color: "var(--sand)" }}>
            {bestDay && (
              <li><b style={{ color: "var(--sand)" }}>Best day:</b> {DAY_FULL[bestDay.dow]} — avg R {formatEv(bestDay.avgR)} over {bestDay.n} trade{bestDay.n === 1 ? "" : "s"}.</li>
            )}
            {worstDay && (
              <li><b style={{ color: "var(--sand)" }}>Worst day:</b> {DAY_FULL[worstDay.dow]} — avg R {formatEv(worstDay.avgR)} over {worstDay.n} trade{worstDay.n === 1 ? "" : "s"}{worstDay.avgR !== null && worstDay.avgR < 0 ? " — consider sitting this one out or cutting size." : ""}</li>
            )}
            {bestHour && (
              <li><b style={{ color: "var(--sand)" }}>Best hour:</b> {bestHour.label} — avg R {formatEv(bestHour.avgR)} over {bestHour.n} trade{bestHour.n === 1 ? "" : "s"}.</li>
            )}
            {worstHour && (
              <li><b style={{ color: "var(--sand)" }}>Worst hour:</b> {worstHour.label} — avg R {formatEv(worstHour.avgR)} over {worstHour.n} trade{worstHour.n === 1 ? "" : "s"}{worstHour.avgR !== null && worstHour.avgR < 0 ? " — this window is bleeding expectancy." : ""}</li>
            )}
            {busiestHour && (
              <li><b style={{ color: "var(--sand)" }}>Busiest hour:</b> {busiestHour.label} with {busiestHour.n} trade{busiestHour.n === 1 ? "" : "s"} — check whether volume there matches the edge, or if you're just present out of habit.</li>
            )}
            <li>Read avg R together with trade count. A great number on 2-3 trades is noise, not an edge — wait for more data before acting on it.</li>
          </ul>
        </div>
      </div>

      <div>
        <div className="pd-label mb-1">06 · By Account</div>
        <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="grid items-center" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
            <span style={S}>ACCOUNT</span>
            <span className="pd-mono" style={S}>TRADES</span>
            <span className="pd-mono" style={S}>WIN RATE</span>
            <span className="pd-mono" style={{ ...S, textAlign: "right" }}>AVG R</span>
            <span className="pd-mono" style={{ ...S, textAlign: "right" }}>TOTAL P&L</span>
          </div>
          {accountRows.map((a) => (
            <div key={a.id} className="grid items-center pd-mono" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", padding: "5px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <span className="pd-label" style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 8 }}>{a.label}</span>
              <span style={{ ...cell, color: "var(--slate)" }}>{a.n}</span>
              <span style={{ ...cell, color: "var(--sand-dim)" }}>{a.winRate !== null ? `${a.winRate}%` : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: a.avgR !== null ? (a.avgR < 0 ? "var(--brick)" : "var(--sage)") : "var(--slate)" }}>{a.avgR !== null ? formatEv(a.avgR) : "—"}</span>
              <span style={{ ...cell, textAlign: "right", color: a.pnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{a.pnl >= 0 ? `+${money(a.pnl)}` : `-${money(Math.abs(a.pnl))}`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
