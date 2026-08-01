import { useState } from "react";
import { Plus, X, ExternalLink } from "lucide-react";
import { money, formatDateUK, getAccountLabel } from "../utils";
import { KpiTile } from "../components/KpiTile";
import { ConfirmModal } from "../components/ConfirmModal";
import { DatePicker } from "../components/DatePicker";
import { Select } from "../components/Select";

export function PayoutsView({ accounts, payouts, createPayout, updatePayout, deletePayout }) {
  const [showForm, setShowForm] = useState(false);
  const [editingPayout, setEditingPayout] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const defaultForm = { accountId: accounts[0]?.id || "", requestedDate: "", amount: "", split: "80%", method: "Bank Wire", proofLink: "" };
  const [form, setForm] = useState(defaultForm);
  const findAcc = (id) => accounts.find((a) => a.id === id);

  function openEdit(p) {
    setEditingPayout(p);
    setForm({ accountId: p.accountId, requestedDate: p.requestedDate, amount: String(p.amount), split: p.split || "80%", method: p.method, proofLink: p.proofLink || "" });
    setShowForm(true);
  }

  function submit(e) {
    e.preventDefault();
    if (!form.accountId || !form.requestedDate || !form.amount) return;
    const parsed = { ...form, amount: parseFloat(form.amount) || 0 };
    if (editingPayout) {
      updatePayout(editingPayout.id, parsed);
    } else {
      createPayout(parsed);
    }
    setShowForm(false);
    setEditingPayout(null);
    setForm(defaultForm);
  }

  function deletePayout(id) {
    setDeleteTarget(id);
  }

  const totalPaid = payouts.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <KpiTile label="Total Paid" value={money(totalPaid)} accent="var(--sage)" />
          <KpiTile label="Payout Records" value={payouts.length} />
        </div>
        <button className="pd-btn pd-btn-primary flex items-center gap-1.5 shrink-0" onClick={() => { setEditingPayout(null); setShowForm(true); setForm(defaultForm); }}><Plus size={14} /> Log payout</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-lg p-4 mb-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="pd-label mb-2">{editingPayout ? "Edit payout" : "New payout"}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <div className="pd-label mb-1">Account</div>
              <Select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{getAccountLabel(a)}</option>)}
              </Select>
            </div>
            <div><div className="pd-label mb-1">Date</div><DatePicker value={form.requestedDate} onChange={(v) => setForm({ ...form, requestedDate: v })} required /></div>
            <div><div className="pd-label mb-1">Amount ($)</div><input required className="pd-input" placeholder="1840" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><div className="pd-label mb-1">Split</div><input className="pd-input" placeholder="80%" value={form.split} onChange={(e) => setForm({ ...form, split: e.target.value })} /></div>
            <div>
              <div className="pd-label mb-1">Method</div>
              <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option>Bank Wire</option><option>USDT</option><option>Payoneer</option>
              </Select>
            </div>
            <div><div className="pd-label mb-1">Proof link</div><input className="pd-input" placeholder="https://..." value={form.proofLink} onChange={(e) => setForm({ ...form, proofLink: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="pd-btn" onClick={() => { setShowForm(false); setEditingPayout(null); }}>Cancel</button>
            <button type="submit" className="pd-btn pd-btn-primary">{editingPayout ? "Update payout" : "Save payout"}</button>
          </div>
        </form>
      )}

      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
        <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1.4fr 90px 100px 90px 110px 1fr 28px 28px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "10px 16px" }}>
          <span>Account</span><span>Date</span><span>Amount</span><span>Split</span><span>Method</span><span>Proof</span><span></span><span></span>
        </div>
        {payouts.length === 0 && <div className="p-6 text-sm text-center" style={{ color: "var(--slate)" }}>No payouts logged yet.</div>}
        {[...payouts].sort((a, b) => (a.requestedDate < b.requestedDate ? 1 : -1)).map((p) => {
          const acc = findAcc(p.accountId);
          return (
            <div key={p.id} className="pd-row grid items-center text-sm" style={{ gridTemplateColumns: "1.4fr 90px 100px 90px 110px 1fr 28px 28px", gap: "0 12px", padding: "10px 16px", borderBottom: "1px solid var(--line)", cursor: "pointer" }} onClick={() => openEdit(p)}>
              <span>{getAccountLabel(acc)}</span>
              <span className="pd-mono whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDateUK(p.requestedDate)}</span>
              <span className="pd-mono whitespace-nowrap" style={{ color: "var(--sage)" }}>{money(p.amount)}</span>
              <span className="pd-mono whitespace-nowrap">{p.split}</span>
              <span className="whitespace-nowrap" style={{ color: "var(--sand-dim)" }}>{p.method}</span>
              {p.proofLink ? <a href={p.proofLink} target="_blank" rel="noreferrer" className="flex items-center justify-center" style={{ color: "var(--slate)" }} onClick={(e) => e.stopPropagation()}><ExternalLink size={13} /></a> : <span />}
              <span />
              <button className="flex items-center justify-center" style={{ color: "var(--slate)", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={(e) => { e.stopPropagation(); deletePayout(p.id); }} title="Delete payout"><X size={13} /></button>
            </div>
          );
        })}
      </div>
      {deleteTarget && (
        <ConfirmModal
          title="Delete payout"
          message="Delete this payout record? This cannot be undone."
          onConfirm={() => { deletePayout(deleteTarget); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
