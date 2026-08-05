import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { money, formatDateUK, computeOutcome } from "../utils";

export function TradeCalendar({ trades, beThreshold = 10 }) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const dayMap = useMemo(() => {
    const map = {};
    trades.forEach((t) => {
      if (!t.date) return;
      if (!map[t.date]) map[t.date] = { pnl: 0, count: 0, trades: [] };
      map[t.date].pnl += t.pnl;
      map[t.date].count++;
      map[t.date].trades.push(t);
    });
    return map;
  }, [trades]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-GB", { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const firstWeekday = firstDay === 0 ? 7 : firstDay;
  const mondayOffset = firstWeekday <= 5 ? firstWeekday - 1 : 0;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days = [];
  for (let pad = 0; pad < mondayOffset; pad++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const data = dayMap[dateStr];
    const isToday = dateStr === todayStr;
    days.push({ day: d, dateStr, data, isToday });
  }

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  return (
    <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="pd-btn flex items-center gap-1 text-xs"><ChevronLeft size={14} /> Prev</button>
        <div className="pd-label">{monthName} {year}</div>
        <button onClick={nextMonth} className="pd-btn flex items-center gap-1 text-xs">Next <ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
          <div key={d} className="text-center pd-mono pb-1" style={{ fontSize: 11, color: "var(--slate)" }}>{d}</div>
        ))}
        {days.map((cell, i) => {
          if (!cell) return <div key={`pad-${i}`} />;
          const hasData = !!cell.data;
          const pnl = cell.data?.pnl || 0;
          const allBE = hasData && cell.data.trades.every((t) => computeOutcome(t.pnl, t.risk, beThreshold) === "BE");
          let bg = "transparent";
          let color = "var(--slate)";
          if (hasData) {
            if (allBE) { bg = "rgba(137,146,163,0.1)"; color = "var(--sand-dim)"; }
            else if (pnl > 0) { bg = "rgba(111,176,139,0.25)"; color = "var(--sage)"; }
            else { bg = "rgba(193,89,75,0.22)"; color = "var(--brick)"; }
          }
          if (cell.isToday) {
            bg = hasData ? bg : "rgba(206,159,82,0.15)";
            color = "var(--brass)";
          }
          return (
            <div key={cell.dateStr}
              className="flex flex-col items-center justify-center rounded"
              style={{
                minHeight: 48,
                fontSize: 13,
                fontWeight: cell.isToday ? 700 : 500,
                background: bg,
                color,
                border: cell.isToday ? "1px solid var(--brass)" : "1px solid transparent",
              }}
              title={hasData ? `${formatDateUK(cell.dateStr)}: ${money(pnl)} (${cell.data.count} trade${cell.data.count > 1 ? "s" : ""})` : formatDateUK(cell.dateStr)}
            >
              <span>{cell.day}</span>
              {hasData && (
                <span style={{ fontSize: 11, fontWeight: 600, marginTop: 1, lineHeight: 1 }}>
                  {pnl >= 0 ? "+" : ""}{Math.abs(pnl) >= 1000 ? `${(pnl / 1000).toFixed(1)}k` : money(pnl)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
