import { useState } from "react";
import { Plus, X, Pencil, Link as LinkIcon } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { friendlyError } from "../utils";
import { ConfirmModal } from "../components/ConfirmModal";
import { Select } from "../components/Select";
import { ErrorBanner } from "../components/ErrorBanner";

const PHASE_OPTIONS = [
  { label: "Instant", value: 0 },
  { label: "1 Step", value: 1 },
  { label: "2 Step", value: 2 },
  { label: "3 Step", value: 3 },
];
const DEFAULT_TARGETS = { 0: [], 1: [10], 2: [8, 5], 3: [8, 5, 5] };

function parseTargets(targetStr, phaseCount) {
  if (!targetStr || targetStr === "—") return DEFAULT_TARGETS[phaseCount] || [];
  const parts = targetStr.split("/").map((s) => s.trim().replace("%", ""));
  return parts.map((p) => {
    const n = parseInt(p);
    return isNaN(n) ? "" : n;
  });
}

function buildTargetStr(targets) {
  return targets.filter((v) => v !== "" && v !== undefined).map((v) => `${v}%`).join(" / ");
}

const firmDefaultForm = { name: "", platformLink: "" };

export function TemplatesView({ templates, firms, createTemplate, updateTemplate, deleteTemplate, createFirm, updateFirm, deleteFirm }) {
  const migrationStatus = useQuery(api.migrations.status);
  const runMigration = useMutation(api.migrations.migrateRefs);

  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showFirmForm, setShowFirmForm] = useState(false);
  const [editingFirm, setEditingFirm] = useState(null);
  const [firmForm, setFirmForm] = useState(firmDefaultForm);
  const [deleteFirmTarget, setDeleteFirmTarget] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState("");

  const defaultForm = { firmId: firms[0]?.id || "", name: "", phases: 2, target: "", dailyLoss: "", maxLoss: "", drawdown: "Static", consistency: "", feeRefund: false, platforms: "" };
  const [form, setForm] = useState(defaultForm);
  const [targets, setTargets] = useState([8, 5]);

  function openEdit(t) {
    setEditingTemplate(t);
    const phaseCount = t.phases ?? 2;
    setForm({ ...t, phases: phaseCount });
    setTargets(parseTargets(t.target, phaseCount));
    setShowForm(true);
    setFormError("");
  }

  function handlePhaseChange(phaseCount) {
    setForm((f) => ({ ...f, phases: phaseCount }));
    setTargets(DEFAULT_TARGETS[phaseCount] || []);
  }

  function setTarget(idx, val) {
    const num = val === "" ? "" : Math.min(100, Math.max(0, parseInt(val) || 0));
    setTargets((prev) => { const next = [...prev]; next[idx] = num; return next; });
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name) return;
    const parsed = { ...form, phases: parseInt(form.phases) || 0, target: buildTargetStr(targets) };
    setSaving(true);
    setFormError("");
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, parsed);
      } else {
        await createTemplate(parsed);
      }
      setShowForm(false);
      setEditingTemplate(null);
      setForm(defaultForm);
      setTargets([8, 5]);
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function submitFirm(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingFirm) {
        await updateFirm(editingFirm.id, firmForm);
      } else {
        await createFirm(firmForm);
      }
      setShowFirmForm(false);
      setEditingFirm(null);
      setFirmForm(firmDefaultForm);
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      await deleteTemplate(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteTarget(null);
      setFormError(friendlyError(err));
    }
  }

  async function confirmDeleteFirm() {
    try {
      await deleteFirm(deleteFirmTarget);
      setDeleteFirmTarget(null);
    } catch (err) {
      setDeleteFirmTarget(null);
      setFormError(friendlyError(err));
    }
  }

  async function handleMigrate() {
    setMigrating(true);
    setFormError("");
    setMigrationMsg("");
    try {
      const res = await runMigration();
      setMigrationMsg(`Migration complete: ${res.firms} firms, ${res.templates} plans, ${res.accounts} accounts re-linked.`);
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setMigrating(false);
    }
  }

  const phaseCount = form.phases;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm max-w-lg" style={{ color: "var(--sand-dim)" }}>
          One shared ruleset for the whole workspace. Firms and plans are managed here by admins; every user picks from
          this list, and changes apply to everyone immediately.
        </p>
        <button className="pd-btn pd-btn-primary flex items-center gap-1.5 shrink-0" onClick={() => { setEditingTemplate(null); setShowForm(true); setFormError(""); setForm(defaultForm); setTargets([8, 5]); }}><Plus size={14} /> Add template</button>
      </div>

      {migrationStatus?.pending && (
        <div className="rounded-lg p-4 mb-5 flex items-center justify-between gap-3 flex-wrap" style={{ background: "var(--ledger)", border: "1px solid var(--brass-dim)" }}>
          <div className="text-sm" style={{ color: "var(--sand)" }}>
            Legacy per-user rules detected ({migrationStatus.accounts} accounts still use the old string references).
            Run the one-time migration to consolidate them into this single global set.
          </div>
          <button className="pd-btn flex items-center gap-1.5" style={{ borderColor: "var(--brass)", color: "var(--brass)" }} onClick={handleMigrate} disabled={migrating}>
            <LinkIcon size={13} /> {migrating ? "Migrating…" : "Run migration"}
          </button>
        </div>
      )}
      {migrationMsg && (
        <div className="rounded-lg p-4 mb-5 text-sm" style={{ background: "var(--ledger)", border: "1px solid var(--sage)", color: "var(--sage)" }}>
          {migrationMsg}
        </div>
      )}

      {formError && !showForm && !showFirmForm && <div className="mb-4"><ErrorBanner message={formError} onDismiss={() => setFormError("")} /></div>}

      {showFirmForm && (
        <form onSubmit={submitFirm} className="rounded-lg p-4 mb-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="pd-label mb-2">{editingFirm ? "Edit firm" : "New firm"}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><div className="pd-label mb-1">Firm name</div><input required className="pd-input" placeholder="MyPropFirm" value={firmForm.name} onChange={(e) => setFirmForm({ ...firmForm, name: e.target.value })} /></div>
            <div><div className="pd-label mb-1">Portal link</div><input className="pd-input" placeholder="https://portal.example.com" value={firmForm.platformLink} onChange={(e) => setFirmForm({ ...firmForm, platformLink: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="pd-btn" onClick={() => { setShowFirmForm(false); setEditingFirm(null); }}>Cancel</button>
            <button type="submit" className="pd-btn pd-btn-primary" disabled={saving}>{saving ? "Saving…" : (editingFirm ? "Update firm" : "Save firm")}</button>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={submit} className="rounded-lg p-4 mb-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="pd-label mb-2">{editingTemplate ? "Edit template" : "New template"}</div>
          {formError && <div className="mb-3"><ErrorBanner message={formError} onDismiss={() => setFormError("")} /></div>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <div className="pd-label mb-1">Firm</div>
              <Select value={form.firmId} onChange={(e) => setForm({ ...form, firmId: e.target.value })}>
                {firms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Select>
            </div>
            <div><div className="pd-label mb-1">Template name</div><input required className="pd-input" placeholder="2-Step Pro" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <div className="pd-label mb-1">Phases</div>
              <Select value={phaseCount} onChange={(e) => handlePhaseChange(parseInt(e.target.value))}>
                {PHASE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </div>
            <div><div className="pd-label mb-1">Daily loss</div><input className="pd-input" placeholder="5%" value={form.dailyLoss} onChange={(e) => setForm({ ...form, dailyLoss: e.target.value })} /></div>
            <div><div className="pd-label mb-1">Max loss</div><input className="pd-input" placeholder="10%" value={form.maxLoss} onChange={(e) => setForm({ ...form, maxLoss: e.target.value })} /></div>
            <div>
              <div className="pd-label mb-1">Drawdown type</div>
              <Select value={form.drawdown} onChange={(e) => setForm({ ...form, drawdown: e.target.value })}>
                <option>Static</option><option>Trailing</option>
              </Select>
            </div>
            <div><div className="pd-label mb-1">Platforms</div><input className="pd-input" placeholder="MT4, MT5" value={form.platforms} onChange={(e) => setForm({ ...form, platforms: e.target.value })} /></div>
            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                role="switch"
                aria-checked={form.feeRefund}
                onClick={() => setForm({ ...form, feeRefund: !form.feeRefund })}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors"
                style={{ background: form.feeRefund ? "var(--sage)" : "var(--ledger-raised)", border: "1px solid var(--line)" }}
              >
                <span
                  className="pointer-events-none inline-block h-3.5 w-3.5 rounded-full transition-transform"
                  style={{
                    background: form.feeRefund ? "var(--ink)" : "var(--slate)",
                    transform: form.feeRefund ? "translateX(18px)" : "translateX(2px)",
                    marginTop: 2,
                  }}
                />
              </button>
              <span className="text-sm" style={{ color: "var(--sand-dim)" }}>Refund after first payout</span>
            </div>
          </div>

          {phaseCount > 0 && (
            <div className="mb-3">
              <div className="pd-label mb-2">Phase Targets (%)</div>
              <div className="flex items-center gap-3 flex-wrap">
                {targets.map((val, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="pd-mono text-xs" style={{ color: "var(--slate)" }}>Phase {i + 1}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="pd-input"
                      style={{ width: 60, textAlign: "center" }}
                      placeholder="—"
                      value={val ?? ""}
                      onChange={(e) => setTarget(i, e.target.value)}
                    />
                    <span className="pd-mono text-xs" style={{ color: "var(--slate)" }}>%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" className="pd-btn" onClick={() => { setShowForm(false); setEditingTemplate(null); }}>Cancel</button>
            <button type="submit" className="pd-btn pd-btn-primary" disabled={saving}>{saving ? "Saving…" : (editingTemplate ? "Update template" : "Save template")}</button>
          </div>
        </form>
      )}

      {/* Firms */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="pd-eyebrow">Firms</div>
          <button className="pd-btn flex items-center gap-1.5" style={{ padding: "4px 10px", fontSize: 13 }} onClick={() => { setEditingFirm(null); setFirmForm(firmDefaultForm); setShowFirmForm(true); setFormError(""); }}><Plus size={12} /> Add firm</button>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1fr 1.5fr 60px 28px 28px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "10px 16px" }}>
            <span>Firm</span><span>Portal link</span><span>Plans</span><span></span><span></span>
          </div>
          {firms.length === 0 && <div className="p-6 text-sm text-center" style={{ color: "var(--slate)" }}>No firms yet. Add one to start building the ruleset.</div>}
          {firms.map((f) => (
            <div key={f.id} className="pd-row grid items-center text-sm pd-mono" style={{ gridTemplateColumns: "1fr 1.5fr 60px 28px 28px", gap: "0 12px", padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
              <span className="whitespace-nowrap" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{f.name}</span>
              <span className="truncate min-w-0" style={{ color: f.platformLink ? "var(--sand-dim)" : "var(--slate)" }}>{f.platformLink || "—"}</span>
              <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{templates.filter((t) => t.firmId === f.id).length}</span>
              <button className="flex items-center justify-center" style={{ color: "var(--slate)", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => { setEditingFirm(f); setFirmForm({ name: f.name, platformLink: f.platformLink || "" }); setShowFirmForm(true); setFormError(""); }} title="Edit firm"><Pencil size={13} /></button>
              <button className="flex items-center justify-center" style={{ color: "var(--slate)", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => setDeleteFirmTarget(f.id)} title="Delete firm"><X size={13} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Templates by firm */}
      {firms.map((firm) => {
        const firmTemplates = templates.filter((t) => t.firmId === firm.id).sort((a, b) => (a.id < b.id ? 1 : -1));
        return (
          <div key={firm.id} className="mb-6">
            <div className="pd-eyebrow mb-2">{firm.name}</div>
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
              <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1.1fr 60px 1fr 80px 80px 90px 80px 1.2fr 28px 28px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "10px 16px" }}>
                <span>Template</span><span>Phases</span><span>Target</span><span>Daily</span><span>Max</span><span>Drawdown</span><span>Refund</span><span>Platforms</span><span></span><span></span>
              </div>
              {firmTemplates.length === 0 && <div className="p-6 text-sm text-center" style={{ color: "var(--slate)" }}>No plans for this firm yet.</div>}
              {firmTemplates.map((t) => (
                <div key={t.id} className="pd-row grid items-center text-sm pd-mono" style={{ gridTemplateColumns: "1.1fr 60px 1fr 80px 80px 90px 80px 1.2fr 28px 28px", gap: "0 12px", padding: "10px 16px", borderBottom: "1px solid var(--line)", cursor: "pointer" }} onClick={() => openEdit(t)}>
                  <span className="whitespace-nowrap" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{t.name}</span>
                  <span className="whitespace-nowrap">{PHASE_OPTIONS.find((p) => p.value === t.phases)?.label || t.phases}</span>
                  <span className="whitespace-nowrap">{t.target}</span>
                  <span className="whitespace-nowrap">{t.dailyLoss}</span>
                  <span className="whitespace-nowrap">{t.maxLoss}</span>
                  <span className="whitespace-nowrap">{t.drawdown}</span>
                  <span className="whitespace-nowrap" style={{ color: t.feeRefund ? "var(--sage)" : "var(--slate)" }}>{t.feeRefund ? "Yes" : "No"}</span>
                  <span className="truncate min-w-0" style={{ color: "var(--sand-dim)", fontFamily: "'IBM Plex Sans', sans-serif" }}>{t.platforms}</span>
                  <span />
                  <button className="flex items-center justify-center" style={{ color: "var(--slate)", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(t.id); }} title="Delete template"><X size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {deleteTarget && (
        <ConfirmModal
          title="Delete template"
          message="Delete this template? Any accounts using it will keep their data."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {deleteFirmTarget && (
        <ConfirmModal
          title="Delete firm"
          message="Delete this firm? It can only be deleted once all of its templates are removed."
          onConfirm={confirmDeleteFirm}
          onCancel={() => setDeleteFirmTarget(null)}
        />
      )}
    </div>
  );
}
