import { useState } from "react";
import { Plus, X, Settings } from "lucide-react";
import { getAccountLabel, friendlyError } from "../utils";
import { StatusPill } from "../components/StatusPill";
import { KpiTile } from "../components/KpiTile";
import { ConfirmModal } from "../components/ConfirmModal";
import { Select } from "../components/Select";
import { ErrorBanner } from "../components/ErrorBanner";

export function CopytradingView({ accounts, clusters, createCluster, updateCluster, deleteCluster }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCluster, setEditingCluster] = useState(null);
  const [simCluster, setSimCluster] = useState("");
  const [simRisk, setSimRisk] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const findAcc = (id) => accounts.find((a) => a.id === id);

  const RISK_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

  const defaultForm = { name: "", masterAccountId: accounts[0]?.id || "", slaves: [] };
  const [form, setForm] = useState(defaultForm);

  function openAdd() {
    setEditingCluster(null);
    setForm({ name: "", masterAccountId: accounts[0]?.id || "", slaves: [] });
    setShowForm(true);
    setFormError("");
  }

  function openEdit(cl) {
    setEditingCluster(cl);
    setForm({ name: cl.name, masterAccountId: cl.masterAccountId, slaves: cl.slaves.map((s) => ({ ...s })) });
    setShowForm(true);
    setFormError("");
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!form.name || !form.masterAccountId) return;
    setSaving(true);
    setFormError("");
    try {
      if (editingCluster) {
        await updateCluster(editingCluster.id, { ...form, createdAt: editingCluster.createdAt });
      } else {
        await createCluster({ ...form, createdAt: new Date().toISOString().slice(0, 10) });
      }
      setShowForm(false);
      setEditingCluster(null);
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  function askDelete(id) {
    setDeleteTarget(id);
  }

  async function confirmDelete() {
    try {
      await deleteCluster(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteTarget(null);
      setFormError(friendlyError(err));
    }
  }

  function addSlave(accountId) {
    if (!accountId || form.slaves.some((s) => s.accountId === accountId)) return;
    setForm((f) => ({ ...f, slaves: [...f.slaves, { accountId, riskMultiplier: 1 }] }));
  }

  function removeSlave(accountId) {
    setForm((f) => ({ ...f, slaves: f.slaves.filter((s) => s.accountId !== accountId) }));
  }

  function setSlaveMultiplier(accountId, val) {
    setForm((f) => ({
      ...f,
      slaves: f.slaves.map((s) => s.accountId === accountId ? { ...s, riskMultiplier: val } : s),
    }));
  }

  function calcSlaveRisk(masterRisk, masterSize, slaveSize, multiplier) {
    if (!masterSize || !masterRisk) return 0;
    return masterRisk * (slaveSize / masterSize) * multiplier;
  }

  const usedAccountIds = new Set([
    ...clusters.filter((cl) => !editingCluster || cl.id !== editingCluster.id).map((cl) => cl.masterAccountId),
    ...form.slaves.map((s) => s.accountId),
  ]);
  const masterAcc = findAcc(form.masterAccountId);
  const availableForSlave = accounts.filter((a) => a.id !== form.masterAccountId && !usedAccountIds.has(a.id));

  const totalSlaves = clusters.reduce((s, cl) => s + cl.slaves.length, 0);
  const masterIds = new Set(clusters.map((cl) => cl.masterAccountId));

  const simClusterData = clusters.find((cl) => cl.id === simCluster);
  const simMaster = simClusterData ? findAcc(simClusterData.masterAccountId) : null;
  const simMasterRisk = parseFloat(simRisk) || 0;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiTile label="Total Clusters" value={clusters.length} />
        <KpiTile label="Total Slaves" value={totalSlaves} accent="var(--brass)" sub="across all clusters" />
        <KpiTile label="Master Accounts" value={masterIds.size} sub="active masters" />
        <KpiTile label="Accounts Used" value={usedAccountIds.size + masterIds.size} sub={`of ${accounts.length} total`} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm max-w-lg" style={{ color: "var(--sand-dim)" }}>
          Group a master account with slaves. Risk scales automatically by account size and the multiplier you set.
        </p>
        <button className="pd-btn pd-btn-primary flex items-center gap-1.5 shrink-0" onClick={openAdd}><Plus size={14} /> Create cluster</button>
      </div>

      {showForm && (
        <form onSubmit={submitForm} className="rounded-lg p-4 mb-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <div className="pd-label mb-2">{editingCluster ? "Edit cluster" : "New cluster"}</div>
          {formError && <div className="mb-3"><ErrorBanner message={formError} onDismiss={() => setFormError("")} /></div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div><div className="pd-label mb-1">Cluster name</div><input required className="pd-input" placeholder="Gold Scalp Cluster" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div>
              <div className="pd-label mb-1">Master account</div>
              <Select value={form.masterAccountId} onChange={(e) => setForm((f) => ({ ...f, masterAccountId: e.target.value, slaves: f.slaves.filter((s) => s.accountId !== e.target.value) }))}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{getAccountLabel(a)}</option>)}
              </Select>
            </div>
          </div>

          {masterAcc && (
            <div className="rounded-md p-3 mb-4" style={{ background: "var(--ink-2)", border: "1px solid var(--line)" }}>
              <div className="pd-label mb-1">Master</div>
              <div className="flex items-center gap-3">
                <span className="pd-mono text-sm" style={{ color: "var(--brass)" }}>{getAccountLabel(masterAcc)}</span>
                <span className="pd-display text-lg" style={{ fontWeight: 700 }}>${(masterAcc.size / 1000).toFixed(0)}K</span>
                <StatusPill status={masterAcc.status} />
              </div>
            </div>
          )}

          <div className="pd-label mb-2">Slaves</div>
          {form.slaves.length === 0 ? (
            <div className="text-sm mb-3" style={{ color: "var(--slate)" }}>No slaves added yet. Select an account below to add one.</div>
          ) : (
            <div className="mb-3">
              {form.slaves.map((s) => {
                const acc = findAcc(s.accountId);
                if (!acc) return null;
                return (
                  <div key={s.accountId} className="flex items-center gap-3 p-2.5 rounded-md mb-1.5" style={{ background: "var(--ink-2)", border: "1px solid var(--line)" }}>
                    <span className="pd-mono text-sm flex-1 min-w-0 truncate">{getAccountLabel(acc)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {RISK_PRESETS.map((p) => (
                        <button key={p} type="button" className="pd-btn" style={{
                          padding: "2px 7px", fontSize: 11, minWidth: 0,
                          borderColor: s.riskMultiplier === p ? "var(--brass)" : undefined,
                          color: s.riskMultiplier === p ? "var(--brass)" : "var(--slate)",
                        }} onClick={() => setSlaveMultiplier(s.accountId, p)}>{p}x</button>
                      ))}
                      <input className="pd-input" type="number" step="0.05" min="0" style={{ width: 60, padding: "2px 6px", fontSize: 11, marginLeft: 4 }}
                        value={s.riskMultiplier} onChange={(e) => setSlaveMultiplier(s.accountId, parseFloat(e.target.value) || 0)} />
                    </div>
                    <button type="button" className="pd-btn" style={{ padding: "2px 6px", borderColor: "var(--brick-dim)", color: "var(--brick)" }} onClick={() => removeSlave(s.accountId)}><X size={12} /></button>
                  </div>
                );
              })}
            </div>
          )}

          {availableForSlave.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="pd-label">Add slave</span>
              <Select style={{ width: "auto", flex: 1 }} value="" onChange={(e) => { addSlave(e.target.value); }}>
                <option value="" disabled>Select account...</option>
                {availableForSlave.map((a) => <option key={a.id} value={a.id}>{getAccountLabel(a)}</option>)}
              </Select>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" className="pd-btn" onClick={() => { setShowForm(false); setEditingCluster(null); }}>Cancel</button>
            <button type="submit" className="pd-btn pd-btn-primary" disabled={saving}>{saving ? "Saving…" : (editingCluster ? "Update cluster" : "Create cluster")}</button>
          </div>
        </form>
      )}

      {clusters.length === 0 ? (
        <div className="rounded-lg p-10 text-center" style={{ border: "1px dashed var(--line)", color: "var(--slate)" }}>
          No clusters yet. Create one to start copytrading between your accounts.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
          {[...clusters].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map((cl) => {
            const master = findAcc(cl.masterAccountId);
            if (!master) return null;
            return (
              <div key={cl.id} className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)", animation: "pd-fade-in 0.4s ease backwards" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="pd-display text-xl" style={{ fontWeight: 700 }}>{cl.name}</div>
                  <div className="flex items-center gap-1">
                    <button className="pd-btn" style={{ padding: "3px 6px" }} onClick={() => openEdit(cl)} title="Edit cluster"><Settings size={12} /></button>
                    <button className="pd-btn" style={{ padding: "3px 6px", borderColor: "var(--brick-dim)", color: "var(--brick)" }} onClick={() => askDelete(cl.id)} title="Delete cluster"><X size={12} /></button>
                  </div>
                </div>

                <div className="rounded-md p-3 mb-3 flex items-center gap-3" style={{ background: "var(--ink-2)", border: "1px solid var(--brass-dim)" }}>
                  <span className="pd-label" style={{ color: "var(--brass)", minWidth: 52 }}>MASTER</span>
                  <span className="pd-mono text-sm">{getAccountLabel(master)}</span>
                  <span className="pd-display text-lg" style={{ fontWeight: 700 }}>${(master.size / 1000).toFixed(0)}K</span>
                  <StatusPill status={master.status} />
                </div>

                <div className="pd-label mb-2">Slaves ({cl.slaves.length})</div>
                {cl.slaves.length === 0 ? (
                  <div className="text-sm" style={{ color: "var(--slate)" }}>No slaves configured.</div>
                ) : (
                  <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--line)" }}>
                    <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1fr 80px 100px 100px", gap: "0 10px", background: "var(--ledger-raised)", borderBottom: "1px solid var(--line)", padding: "8px 12px" }}>
                      <span>Account</span><span>Multiplier</span><span>Risk per $100</span><span>Size Ratio</span>
                    </div>
                    {cl.slaves.map((s) => {
                      const acc = findAcc(s.accountId);
                      if (!acc) return null;
                      const ratio = (acc.size / master.size);
                      const riskPer100 = 100 * ratio * s.riskMultiplier;
                      return (
                        <div key={s.accountId} className="grid items-center text-sm pd-mono" style={{ gridTemplateColumns: "1fr 80px 100px 100px", gap: "0 10px", padding: "8px 12px", borderBottom: "1px solid var(--line)" }}>
                          <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{getAccountLabel(acc)}</span>
                          <span style={{ color: s.riskMultiplier >= 1 ? "var(--brass)" : "var(--sage)", fontWeight: 600 }}>{s.riskMultiplier}x</span>
                          <span style={{ color: "var(--sand-dim)" }}>${riskPer100.toFixed(0)}</span>
                          <span style={{ color: "var(--slate)" }}>{(ratio * 100).toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg p-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
        <div className="pd-label mb-3">Trade Simulator</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <div className="pd-label mb-1">Cluster</div>
            <Select value={simCluster} onChange={(e) => setSimCluster(e.target.value)}>
              <option value="">Select cluster...</option>
              {clusters.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
            </Select>
          </div>
          <div>
            <div className="pd-label mb-1">Master risk ($)</div>
            <input className="pd-input" type="number" placeholder="500" value={simRisk} onChange={(e) => setSimRisk(e.target.value)} />
          </div>
        </div>

        {simMaster && simMasterRisk > 0 ? (
          <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1.2fr 70px 90px 90px 90px 90px", gap: "0 10px", background: "var(--ledger-raised)", borderBottom: "1px solid var(--line)", padding: "8px 12px" }}>
              <span>Account</span><span>Multiplier</span><span>Risk</span><span>At 1R</span><span>At 2R</span><span>At 3R</span>
            </div>
            <div className="grid items-center text-sm pd-mono" style={{ gridTemplateColumns: "1.2fr 70px 90px 90px 90px 90px", gap: "0 10px", padding: "8px 12px", borderBottom: "1px solid var(--line)", background: "rgba(206,159,82,0.06)" }}>
              <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--brass)" }}>Master · {simMaster.firmName || simMaster.firm} · ${(simMaster.size / 1000).toFixed(0)}K</span>
              <span style={{ fontWeight: 600 }}>1x</span>
              <span style={{ color: "var(--sand)" }}>${simMasterRisk.toFixed(0)}</span>
              <span style={{ color: "var(--sage)" }}>${simMasterRisk.toFixed(0)}</span>
              <span style={{ color: "var(--sage)" }}>${(simMasterRisk * 2).toFixed(0)}</span>
              <span style={{ color: "var(--sage)" }}>${(simMasterRisk * 3).toFixed(0)}</span>
            </div>
            {simClusterData.slaves.map((s) => {
              const acc = findAcc(s.accountId);
              if (!acc) return null;
              const risk = calcSlaveRisk(simMasterRisk, simMaster.size, acc.size, s.riskMultiplier);
              return (
                <div key={s.accountId} className="grid items-center text-sm pd-mono" style={{ gridTemplateColumns: "1.2fr 70px 90px 90px 90px 90px", gap: "0 10px", padding: "8px 12px", borderBottom: "1px solid var(--line)" }}>
                  <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{getAccountLabel(acc)}</span>
                  <span style={{ color: s.riskMultiplier >= 1 ? "var(--brass)" : "var(--sage)", fontWeight: 600 }}>{s.riskMultiplier}x</span>
                  <span style={{ color: "var(--sand)" }}>${risk.toFixed(0)}</span>
                  <span style={{ color: "var(--sage)" }}>${risk.toFixed(0)}</span>
                  <span style={{ color: "var(--sage)" }}>${(risk * 2).toFixed(0)}</span>
                  <span style={{ color: "var(--sage)" }}>${(risk * 3).toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-center p-4" style={{ color: "var(--slate)" }}>
            {simCluster ? "Enter a master risk amount to simulate." : "Select a cluster and enter a risk amount to see projected copy trades."}
          </div>
        )}
      </div>
      {deleteTarget && (
        <ConfirmModal
          title="Delete cluster"
          message="Delete this cluster? The accounts will remain, only the cluster link is removed."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
