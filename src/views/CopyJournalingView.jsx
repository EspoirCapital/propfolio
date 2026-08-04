import { useState, useEffect } from "react";
import { Copy, Check, Trash2 } from "lucide-react";
import { getAccountLabel, formatDateUK, friendlyError } from "../utils";
import { Select } from "../components/Select";
import { ErrorBanner } from "../components/ErrorBanner";

const MASTER_KEY = "cp-master-id";

export function CopyJournalingView({ accounts, trades, copyLinks, slavesByMaster, setSlaves, copyTrades }) {
  const masters = accounts.filter((a) => (slavesByMaster[a.id] || []).length > 0);

  const [masterId, setMasterId] = useState("");
  const [draftSlaves, setDraftSlaves] = useState([]);
  const [selectedTrades, setSelectedTrades] = useState([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  const masterAccounts = [...accounts].sort((a, b) => {
    const aIsMaster = masters.some((m) => m.id === a.id) ? 0 : 1;
    const bIsMaster = masters.some((m) => m.id === b.id) ? 0 : 1;
    return aIsMaster - bIsMaster || (a.name || "").localeCompare(b.name || "");
  });

  useEffect(() => {
    const remembered = localStorage.getItem(MASTER_KEY);
    const initial = masters.some((m) => m.id === remembered) ? remembered : (masters[0]?.id || accounts[0]?.id || "");
    setMasterId(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setDraftSlaves(slavesByMaster[masterId] || []);
    setSelectedTrades([]);
    setResult("");
  }, [masterId, slavesByMaster]);

  const master = accounts.find((a) => a.id === masterId);
  const availableSlaves = accounts.filter((a) => a.id !== masterId && !draftSlaves.includes(a.id));
  const masterTrades = trades.filter((t) => t.accountId === masterId && !t.archived).sort((a, b) => (a.date < b.date ? 1 : -1));

  async function toggleSlave(id) {
    const next = draftSlaves.includes(id) ? draftSlaves.filter((s) => s !== id) : [...draftSlaves, id];
    setDraftSlaves(next);
    setError("");
    try {
      await setSlaves(masterId, next);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  function saveSlaves() {
    setError("");
    setResult("");
    setSlaves(masterId, draftSlaves).then(() => setResult("Slave selection saved.")).catch((err) => setError(friendlyError(err)));
  }

  function toggleTrade(id) {
    setSelectedTrades((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  }

  async function runCopy() {
    if (!masterId || selectedTrades.length === 0 || draftSlaves.length === 0) return;
    setBusy(true);
    setError("");
    setResult("");
    try {
      const res = await copyTrades(masterId, selectedTrades, draftSlaves);
      setSelectedTrades([]);
      setResult(`${res.copied} copied trade${res.copied === 1 ? "" : "s"} written to your slave accounts.`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const copyable = master && selectedTrades.length > 0 && draftSlaves.length > 0 && !busy;

  return (
    <div>
      <p className="text-sm max-w-lg mb-5" style={{ color: "var(--sand-dim)" }}>
        Pick a master account, connect its slave accounts, then select trades and copy them to the slaves. Risk, lots and P&L scale by slave ÷ master account size. Your master and slave selection is remembered.
      </p>

      {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError("")} /></div>}

      <div className="rounded-lg p-4 mb-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <div className="pd-label mb-1">Master account</div>
            <Select value={masterId} onChange={(e) => { setMasterId(e.target.value); localStorage.setItem(MASTER_KEY, e.target.value); }}>
              <option value="" disabled>Select a master…</option>
              {masterAccounts.map((a) => {
                const n = (slavesByMaster[a.id] || []).length;
                return <option key={a.id} value={a.id}>{getAccountLabel(a)}{n > 0 ? " · " + n + " slave" + (n === 1 ? "" : "s") : ""}</option>;
              })}
            </Select>
          </div>
          <div>
            <div className="pd-label mb-1">Slave accounts</div>
            {master ? (
              draftSlaves.length === 0 ? (
                <div className="text-sm" style={{ color: "var(--slate)" }}>No slaves connected. Add some below.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {draftSlaves.map((id) => {
                    const acc = accounts.find((a) => a.id === id);
                    if (!acc) return null;
                    return (
                      <span key={id} className="flex items-center gap-1 pd-mono text-xs" style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(126,157,108,0.12)", border: "1px solid var(--sage-dim)", color: "var(--sage)" }}>
                        {getAccountLabel(acc)} <button onClick={() => toggleSlave(id)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }} title="Remove slave"><Trash2 size={11} /></button>
                      </span>
                    );
                  })}
                </div>
              )
            ) : <div className="text-sm" style={{ color: "var(--slate)" }}>Pick a master account first.</div>}
          </div>
          <div className="flex md:justify-end items-start gap-2">
            <button className="pd-btn" onClick={saveSlaves} disabled={!master}>Save slaves</button>
          </div>
        </div>

        <div className="pd-label mb-2">Connect a slave account</div>
        {master && availableSlaves.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {availableSlaves.map((a) => (
              <button key={a.id} onClick={() => toggleSlave(a.id)} className="pd-mono text-xs" style={{ padding: "3px 9px", borderRadius: 6, background: "transparent", border: "1px solid var(--line)", color: "var(--slate)", cursor: "pointer" }}>
                + {getAccountLabel(a)} · ${(a.size / 1000).toFixed(0)}K
              </button>
            ))}
          </div>
        ) : master && availableSlaves.length === 0 ? (
          <div className="text-sm" style={{ color: "var(--slate)" }}>All accounts are already connected as slaves.</div>
        ) : <div className="text-sm" style={{ color: "var(--slate)" }}>Select a master account to connect slaves.</div>}
      </div>

      {master && (
        <div className="rounded-lg p-4 mb-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="pd-label">Master trades</span>
            <span className="text-xs pd-mono" style={{ color: "var(--slate)" }}>{masterTrades.length} trade{masterTrades.length === 1 ? "" : "s"} · pick one or more to copy</span>
          </div>
          {masterTrades.length === 0 ? (
            <div className="text-sm" style={{ color: "var(--slate)" }}>This master has no trades yet. Log some in the Journal first.</div>
          ) : (
            <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--line)" }}>
              {masterTrades.map((t) => {
                const on = selectedTrades.includes(t.id);
                return (
                  <label key={t.id} className="grid items-center text-sm pd-mono cursor-pointer" style={{ gridTemplateColumns: "28px 92px 76px 40px 72px 72px 1fr", gap: "0 12px", padding: "9px 12px", borderBottom: "1px solid var(--line)", background: on ? "rgba(206,159,82,0.07)" : "transparent" }}>
                    <input type="checkbox" checked={on} onChange={() => toggleTrade(t.id)} />
                    <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDateUK(t.date)}</span>
                    <span className="whitespace-nowrap">{t.symbol}</span>
                    <span className="whitespace-nowrap" style={{ color: t.side === "Long" ? "var(--sage)" : "var(--brick)" }}>{t.side.slice(0, 1)}</span>
                    <span className="whitespace-nowrap" style={{ color: "var(--sand-dim)" }}>{t.lots}</span>
                    <span className="whitespace-nowrap" style={{ color: t.pnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{(t.pnl >= 0 ? "+" : "") + t.pnl.toFixed(2)}</span>
                    <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--sand-dim)" }} title={t.notes}>{t.notes || "—"}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-lg p-4 mb-5 text-sm" style={{ background: "var(--ledger)", border: "1px solid var(--sage)", color: "var(--sage)" }}>{result}</div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button className="pd-btn pd-btn-primary flex items-center gap-1.5" disabled={!copyable} onClick={runCopy}>
          {busy ? <Copy size={14} /> : <Check size={14} />} {busy ? "Copying…" : `Copy ${selectedTrades.length} trade${selectedTrades.length === 1 ? "" : "s"} to ${draftSlaves.length} slave${draftSlaves.length === 1 ? "" : "s"}`}
        </button>
        {!copyable && master && (
          <span className="text-xs" style={{ color: "var(--slate)" }}>{selectedTrades.length === 0 ? "Select at least one trade." : (draftSlaves.length === 0 ? "Connect at least one slave account." : "")}</span>
        )}
      </div>
    </div>
  );
}