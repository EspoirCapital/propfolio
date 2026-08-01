import { useState, useEffect, useMemo } from "react";
import { Plus, X, ExternalLink, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { marked } from "marked";
import { computeOutcome, formatDisplay, formatDateUK, getAccountLabel, OUTCOME_META, RATING_META } from "../utils";
import { RatingPicker } from "../components/RatingPicker";
import { ConfirmModal } from "../components/ConfirmModal";
import { DatePicker } from "../components/DatePicker";
import { Select } from "../components/Select";

export function JournalView({ accounts, trades, createTrade, updateTrade, deleteTrade, settings, initialAccountId, onClearInitialAccount }) {
  const [filterAcc, setFilterAcc] = useState(initialAccountId || "All");
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [notesMode, setNotesMode] = useState("edit");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (initialAccountId) {
      setFilterAcc(initialAccountId);
      onClearInitialAccount?.();
    }
  }, [initialAccountId]);

  const defaultForm = {
    accountId: accounts[0]?.id || "", date: "", symbol: "", side: "Long", lots: "",
    risk: "", pnl: "", session: "London", tag: "", tvLink: "", rating: "green", notes: "",
  };
  const [form, setForm] = useState(defaultForm);

  const filtered = trades.filter((t) => !t.archived && (filterAcc === "All" || t.accountId === filterAcc)).sort((a, b) => (a.date < b.date ? 1 : -1));

  const enrichedFiltered = useMemo(() => {
    return filtered.map((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      const size = acc?.size || 0;
      const outcome = computeOutcome(t.pnl, t.risk, settings.beThreshold);
      return { ...t, outcome, accountSize: size };
    });
  }, [filtered, accounts, settings]);

  function openEdit(t) {
    setEditingTrade(t);
    setForm({
      accountId: t.accountId, date: t.date, symbol: t.symbol, side: t.side,
      lots: String(t.lots), risk: String(t.risk), pnl: String(t.pnl),
      session: t.session, tag: t.tag, tvLink: t.tvLink, rating: t.rating, notes: t.notes,
    });
    setShowForm(true);
    setNotesMode("edit");
  }

  function submit(e) {
    e.preventDefault();
    if (!form.accountId || !form.date || !form.symbol) return;
    const parsed = {
      ...form,
      risk: parseFloat(form.risk) || 0,
      pnl: parseFloat(form.pnl) || 0,
      lots: parseFloat(form.lots) || 0,
    };
    if (editingTrade) {
      updateTrade(editingTrade.id, parsed);
    } else {
      createTrade(parsed);
    }
    setShowForm(false);
    setEditingTrade(null);
    setNotesMode("edit");
    setForm(defaultForm);
  }

  function askDelete(id) {
    setDeleteTarget(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="pd-label">Account</span>
          <Select style={{ width: "auto" }} value={filterAcc} onChange={(e) => setFilterAcc(e.target.value)}>
            <option value="All">All accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{getAccountLabel(a)}</option>)}
          </Select>
          {filterAcc !== "All" && (
            <Link to="/accounts/$accountId" params={{ accountId: filterAcc }} className="pd-btn flex items-center gap-1.5 no-underline">
              <ArrowRight size={12} /> View account
            </Link>
          )}
        </div>
        <button className="pd-btn pd-btn-primary flex items-center gap-1.5" onClick={() => { setEditingTrade(null); setShowForm(true); setForm({ ...defaultForm, accountId: filterAcc !== "All" ? filterAcc : accounts[0]?.id || "" }); setNotesMode("edit"); }}><Plus size={14} /> Log trade</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-lg p-4 mb-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="pd-label">{editingTrade ? "Edit trade" : "New trade"}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="col-span-2 md:col-span-1">
              <div className="pd-label mb-1">Account</div>
              <Select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{getAccountLabel(a)}</option>)}
              </Select>
            </div>
            <div><div className="pd-label mb-1">Date</div><DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} required /></div>
            <div><div className="pd-label mb-1">Symbol</div><input required className="pd-input" placeholder="XAUUSD" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} /></div>
            <div>
              <div className="pd-label mb-1">Side</div>
              <Select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}>
                <option>Long</option><option>Short</option>
              </Select>
            </div>
            <div><div className="pd-label mb-1">Lots</div><input className="pd-input" placeholder="0.5" value={form.lots} onChange={(e) => setForm({ ...form, lots: e.target.value })} /></div>
            <div><div className="pd-label mb-1">Risk ($)</div><input className="pd-input" placeholder="250" value={form.risk} onChange={(e) => setForm({ ...form, risk: e.target.value })} /></div>
            <div><div className="pd-label mb-1">P&L ($)</div><input className="pd-input" placeholder="412" value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })} /></div>
            <div>
              <div className="pd-label mb-1">Session</div>
              <Select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}>
                <option>Asia</option><option>London</option><option>NY</option>
              </Select>
            </div>
            <div><div className="pd-label mb-1">Strategy tag</div><input className="pd-input" placeholder="Breakout" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} /></div>
            <div><div className="pd-label mb-1">TradingView link</div><input className="pd-input" placeholder="https://..." value={form.tvLink} onChange={(e) => setForm({ ...form, tvLink: e.target.value })} /></div>
            <div>
              <div className="pd-label mb-1">Rating</div>
              <RatingPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="pd-label">Notes</span>
              <button type="button" className="pd-btn" style={{ padding: "2px 8px", fontSize: 11 }}
                onClick={() => setNotesMode(notesMode === "edit" ? "preview" : "edit")}>
                {notesMode === "edit" ? <><Eye size={11} /> Preview</> : <><EyeOff size={11} /> Edit</>}
              </button>
            </div>
            {notesMode === "edit" ? (
              <textarea className="pd-input" rows={3} placeholder="Context, mistakes, mindset... (markdown supported)"
                style={{ fontFamily: "monospace", fontSize: 13, resize: "vertical" }}
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            ) : (
              <div className="rounded-md p-3 text-sm pd-markdown" style={{ background: "var(--ink)", border: "1px solid var(--line)", minHeight: 68 }}
                dangerouslySetInnerHTML={{ __html: marked.parse(form.notes || "*Nothing to preview.*") }} />
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" className="pd-btn" onClick={() => { setShowForm(false); setEditingTrade(null); setNotesMode("edit"); }}>Cancel</button>
            <button type="submit" className="pd-btn pd-btn-primary">{editingTrade ? "Update trade" : "Save trade"}</button>
          </div>
        </form>
      )}

      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
        <div className="grid pd-label items-center" style={{ gridTemplateColumns: "30px 100px 88px 42px 52px 82px 82px 38px 72px 110px 1fr 28px 28px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "10px 16px" }}>
          <span></span><span>Date</span><span>Symbol</span><span>Side</span><span>Lots</span><span>Risk</span><span>P&L</span><span>Out</span><span>Session</span><span>Tag</span><span>Notes</span><span></span><span></span>
        </div>
        {enrichedFiltered.length === 0 && <div className="p-6 text-sm text-center" style={{ color: "var(--slate)" }}>No trades logged for this filter yet.</div>}
        {enrichedFiltered.map((t) => (
          <div key={t.id} className="pd-row grid items-center text-sm pd-mono" style={{ gridTemplateColumns: "30px 100px 88px 42px 52px 82px 82px 38px 72px 110px 1fr 28px 28px", gap: "0 12px", padding: "10px 16px", borderBottom: "1px solid var(--line)", cursor: "pointer" }} onClick={() => openEdit(t)}>
            <span className="flex items-center justify-center"><span style={{ width: 12, height: 12, borderRadius: "50%", background: RATING_META[t.rating]?.color || "var(--slate)", flexShrink: 0 }} title={RATING_META[t.rating]?.label} /></span>
            <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDateUK(t.date)}</span>
            <span className="whitespace-nowrap">{t.symbol}</span>
            <span className="whitespace-nowrap" style={{ color: t.side === "Long" ? "var(--sage)" : "var(--brick)" }}>{t.side.slice(0, 1)}</span>
            <span className="whitespace-nowrap">{t.lots}</span>
            <span className="whitespace-nowrap" style={{ color: "var(--sand-dim)" }}>{formatDisplay(t.risk, settings.displayFormat, t.accountSize, t.risk)}</span>
            <span className="whitespace-nowrap" style={{ color: t.pnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{formatDisplay(t.pnl, settings.displayFormat, t.accountSize, t.risk)}</span>
            <span className="whitespace-nowrap">
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                color: OUTCOME_META[t.outcome].color, background: OUTCOME_META[t.outcome].bg,
              }}>{t.outcome}</span>
            </span>
            <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{t.session}</span>
            <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--sand-dim)" }} title={t.tag}>{t.tag}</span>
            <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--sand-dim)" }} title={t.notes}>{t.notes || "—"}</span>
            {t.tvLink ? <a href={t.tvLink} target="_blank" rel="noreferrer" className="flex items-center justify-center" style={{ color: "var(--slate)" }} onClick={(e) => e.stopPropagation()}><ExternalLink size={13} /></a> : <span />}
            <button className="flex items-center justify-center" style={{ color: "var(--slate)", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={(e) => { e.stopPropagation(); askDelete(t.id); }} title="Delete trade"><X size={13} /></button>
          </div>
        ))}
      </div>
      {deleteTarget && (
        <ConfirmModal
          title="Delete trade"
          message="Delete this trade? This cannot be undone."
          onConfirm={() => { deleteTrade(deleteTarget); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
