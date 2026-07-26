import { useState } from "react";
import { Plus, X, ExternalLink, Award, Settings } from "lucide-react";
import { getAccountLabel, formatDateUK } from "../utils";
import { ConfirmModal } from "../components/ConfirmModal";
import { DatePicker } from "../components/DatePicker";
import { Select } from "../components/Select";

const CERT_TYPES = {
  phase_1_passing: { label: "Passing Phase 1", color: "var(--brass)", bg: "rgba(206,159,82,0.12)" },
  phase_2_passing: { label: "Passing Phase 2", color: "var(--brass)", bg: "rgba(206,159,82,0.12)" },
  phase_3_passing: { label: "Passing Phase 3", color: "var(--brass)", bg: "rgba(206,159,82,0.12)" },
  payout: { label: "Payout proof", color: "var(--sage)", bg: "rgba(111,176,139,0.12)" },
};

export function CertificatesView({ accounts, certificates, setCertificates, initialAccountId }) {
  const [filterAcc, setFilterAcc] = useState(initialAccountId || "All");
  const [showForm, setShowForm] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const defaultForm = { accountId: filterAcc !== "All" ? filterAcc : accounts[0]?.id || "", type: "phase_2_passing", date: "", link: "" };
  const [form, setForm] = useState(defaultForm);
  const findAcc = (id) => accounts.find((a) => a.id === id);

  const filtered = filterAcc === "All" ? certificates : certificates.filter((c) => c.accountId === filterAcc);

  function openEdit(c) {
    setEditingCert(c);
    setForm({ accountId: c.accountId, type: c.type, date: c.date, link: c.link });
    setShowForm(true);
  }

  function submit(e) {
    e.preventDefault();
    if (!form.accountId) return;
    const acc = findAcc(form.accountId);
    const label = `${getAccountLabel(acc)} · ${CERT_TYPES[form.type]?.label || form.type}`;
    if (editingCert) {
      setCertificates((prev) => prev.map((c) => c.id === editingCert.id ? { ...c, ...form, label } : c));
    } else {
      setCertificates((prev) => [...prev, { ...form, id: "c" + Date.now(), label }]);
    }
    setShowForm(false);
    setEditingCert(null);
    setForm(defaultForm);
  }

  function deleteCert(id) {
    setDeleteTarget(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <Select value={filterAcc} onChange={(e) => { setFilterAcc(e.target.value); setForm((f) => ({ ...f, accountId: e.target.value !== "All" ? e.target.value : accounts[0]?.id || "" })); }}>
          <option value="All">All accounts</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{getAccountLabel(a)}</option>)}
        </Select>
        <button className="pd-btn pd-btn-primary flex items-center gap-1.5 shrink-0" onClick={() => { setEditingCert(null); setShowForm(true); setForm({ ...defaultForm, accountId: filterAcc !== "All" ? filterAcc : accounts[0]?.id || "" }); }}><Plus size={14} /> Add certificate</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-lg p-4 mb-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="pd-label mb-2">{editingCert ? "Edit certificate" : "New certificate"}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <div className="pd-label mb-1">Account</div>
              <Select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{getAccountLabel(a)}</option>)}
              </Select>
            </div>
            <div>
              <div className="pd-label mb-1">Type</div>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="phase_1_passing">Passing Phase 1</option>
                <option value="phase_2_passing">Passing Phase 2</option>
                <option value="phase_3_passing">Passing Phase 3</option>
                <option value="payout">Payout proof</option>
              </Select>
            </div>
            <div><div className="pd-label mb-1">Date</div><DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
            <div className="col-span-2"><div className="pd-label mb-1">Document link</div><input className="pd-input" placeholder="https://..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="pd-btn" onClick={() => { setShowForm(false); setEditingCert(null); }}>Cancel</button>
            <button type="submit" className="pd-btn pd-btn-primary">{editingCert ? "Update" : "Save"}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && <div className="p-6 text-sm text-center col-span-full" style={{ color: "var(--slate)" }}>No certificates yet.</div>}
        {[...filtered].sort((a, b) => (a.date < b.date ? 1 : -1)).map((c) => {
          const acc = findAcc(c.accountId);
          return (
            <div key={c.id} className="rounded-lg p-4 block relative group"
              style={{ background: "var(--ledger)", border: "1px solid var(--line)", color: "var(--sand)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="pd-pill" style={{
                  color: CERT_TYPES[c.type]?.color || "var(--slate)",
                  background: CERT_TYPES[c.type]?.bg || "rgba(137,146,163,0.12)",
                }}>{CERT_TYPES[c.type]?.label || c.type}</span>
                <div className="flex items-center gap-1">
                  <button className="pd-btn opacity-0 group-hover:opacity-100 transition-opacity" style={{ padding: "3px 6px" }} onClick={() => openEdit(c)} title="Edit"><Settings size={12} /></button>
                  <button className="pd-btn opacity-0 group-hover:opacity-100 transition-opacity" style={{ padding: "3px 6px", borderColor: "var(--brick-dim)", color: "var(--brick)" }} onClick={() => deleteCert(c.id)} title="Delete"><X size={12} /></button>
                  <Award size={16} style={{ color: "var(--brass)" }} />
                </div>
              </div>
              <div className="text-sm font-medium mb-1">{c.label}</div>
              <div className="pd-eyebrow">{getAccountLabel(acc)} · {formatDateUK(c.date)}</div>
              {c.link && <a href={c.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 mt-3 text-xs" style={{ color: "var(--slate)", textDecoration: "none" }}>View document <ExternalLink size={12} /></a>}
            </div>
          );
        })}
      </div>
      {deleteTarget && (
        <ConfirmModal
          title="Delete certificate"
          message="Delete this certificate? This cannot be undone."
          onConfirm={() => { setCertificates((prev) => prev.filter((c) => c.id !== deleteTarget)); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
