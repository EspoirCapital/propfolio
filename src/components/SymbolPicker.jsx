import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function matchSymbols(symbols, query) {
  const q = query.trim().toLowerCase();
  if (!q) return symbols.slice(0, 12);
  const byName = [];
  const byAlias = [];
  for (const s of symbols) {
    if (s.name.toLowerCase().startsWith(q)) byName.push(s);
    else if (s.name.toLowerCase().includes(q)) byAlias.push(s);
    else if (s.aliases.some((a) => a.toLowerCase() === q || a.toLowerCase().includes(q))) byAlias.push(s);
  }
  return [...byName, ...byAlias].slice(0, 12);
}

export function SymbolPicker({ value, onChange, placeholder = "XAUUSD" }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [seeded, setSeeded] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const symbols = useQuery(api.symbols.list) ?? [];
  const seedSymbols = useMutation(api.symbols.seed);

  useEffect(() => {
    if (seeded || symbols.length > 0 || symbols === undefined) return;
    setSeeded(true);
    seedSymbols().catch(() => {});
  }, [seeded, symbols, seedSymbols]);

  const results = useMemo(() => matchSymbols(symbols, value), [symbols, value]);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function select(s) {
    onChange(s.name);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!open) {
      if (e.key === "ArrowDown" && results.length > 0) {
        e.preventDefault();
        setHighlight(0);
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (results[highlight]) {
        e.preventDefault();
        select(results[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        required
        className="pd-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => {
          setOpen(true);
          setHighlight(0);
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck={false}
      />
      {open && results.length > 0 && (
        <ul
          className="absolute z-30 left-0 right-0 mt-1 rounded-md overflow-hidden pd-scrollbar"
          style={{ background: "var(--ink-2)", border: "1px solid var(--line)", maxHeight: 240, listStyle: "none", margin: 0, padding: 4 }}
        >
          {results.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className="w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm"
                style={{
                  background: i === highlight ? "var(--ledger-raised)" : "transparent",
                  color: "var(--sand)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "IBM Plex Mono, monospace",
                }}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => select(s)}
              >
                <span>{s.name}</span>
                <span className="text-xs" style={{ color: "var(--slate)", fontFamily: "IBM Plex Sans, sans-serif" }}>{s.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
