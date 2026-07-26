import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateUK, parseDateUK } from "../utils";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  let startIdx = firstDay.getDay() - 1;
  if (startIdx < 0) startIdx = 6;
  return { daysInMonth, startIdx };
}

export function DatePicker({ value, onChange, required, placeholder = "DD/MM/YYYY" }) {
  const [display, setDisplay] = useState(() => formatDateUK(value));
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const parsed = parseDateUK(value);
  const [viewYear, setViewYear] = useState(parsed ? new Date(parsed).getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? new Date(parsed).getMonth() : new Date().getMonth());

  useEffect(() => { setDisplay(formatDateUK(value)); }, [value]);

  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function handleDisplayChange(v) {
    const digits = v.replace(/\D/g, "");
    let formatted = "";
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += "/" + digits.slice(2, 4);
    if (digits.length > 4) formatted += "/" + digits.slice(4, 8);
    setDisplay(formatted);

    const d = parseDateUK(formatted);
    if (d) {
      setError(false);
      onChange(d);
      const dt = new Date(d);
      setViewYear(dt.getFullYear());
      setViewMonth(dt.getMonth());
    } else if (formatted.length === 10) {
      setError(true);
    }
  }

  function pickDay(day) {
    const dd = String(day).padStart(2, "0");
    const mm = String(viewMonth + 1).padStart(2, "0");
    const iso = `${viewYear}-${mm}-${dd}`;
    const uk = `${dd}/${mm}/${viewYear}`;
    setDisplay(uk);
    setError(false);
    onChange(iso);
    setOpen(false);
  }

  function shiftMonth(dir) {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  }

  const { daysInMonth, startIdx } = getMonthDays(viewYear, viewMonth);
  const today = new Date();
  const selectedDate = parsed ? new Date(parsed) : null;

  const cells = [];
  for (let i = 0; i < startIdx; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        className={`pd-input${error ? " pd-input-error" : ""}`}
        style={{ paddingRight: 32 }}
        value={display}
        onChange={(e) => handleDisplayChange(e.target.value)}
        placeholder={placeholder}
        maxLength={10}
        required={required}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute flex items-center justify-center"
        style={{ right: 2, top: 2, bottom: 2, width: 28, background: "none", border: "none", cursor: "pointer", padding: 0, zIndex: 2 }}
      >
        <Calendar size={14} style={{ color: open ? "var(--brass)" : "var(--slate)" }} />
      </button>
      <input type="hidden" value={value || ""} required={required} />

      {open && (
        <div
          className="absolute z-50"
          style={{
            top: "calc(100% + 4px)",
            right: 0,
            background: "var(--ledger)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "10px",
            width: 260,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {/* Month/Year nav */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => shiftMonth(-1)}
              className="flex items-center justify-center"
              style={{ width: 24, height: 24, background: "none", border: "none", cursor: "pointer", color: "var(--sand)", padding: 0 }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--sand)", letterSpacing: "0.04em" }}>
              {new Date(viewYear, viewMonth).toLocaleString("en-GB", { month: "short" }).toUpperCase()} {viewYear}
            </span>
            <button type="button" onClick={() => shiftMonth(1)}
              className="flex items-center justify-center"
              style={{ width: 24, height: 24, background: "none", border: "none", cursor: "pointer", color: "var(--sand)", padding: 0 }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DAYS.map((d) => (
              <div key={d} className="text-center" style={{ fontSize: 10, color: "var(--slate)", padding: "2px 0", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.04em" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              const isSelected = selectedDate && day === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => pickDay(day)}
                  className="flex items-center justify-center"
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 5,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: isSelected ? "var(--brass)" : isToday ? "var(--ink-2)" : "transparent",
                    color: isSelected ? "#1a1508" : isToday ? "var(--brass)" : "var(--sand)",
                    fontWeight: isSelected || isToday ? 600 : 400,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
