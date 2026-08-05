import { useState, useEffect } from "react";
import { Pencil, X, LayoutGrid, List, Plus, Archive } from "lucide-react";
import { STATUS_META } from "../constants";
import { money, formatDateUK, friendlyError, groupAccountsByChain } from "../utils";
import { KpiTile } from "../components/KpiTile";
import { StatusPill } from "../components/StatusPill";
import { ConfirmModal } from "../components/ConfirmModal";
import { Select } from "../components/Select";
import { ErrorBanner } from "../components/ErrorBanner";
import { AccountForm } from "./AccountForm";
import { TicketCard } from "./TicketCard";
import { JourneyGroup } from "../components/JourneyGroup";

export function AccountsView({ derived, templates, firms, onRowClick, onOpen, createAccount, updateAccount, deleteAccount, editingAccount, setEditingAccount, filterFirm, setFilterFirm, filterStatus, setFilterStatus, archiveAccount, unarchiveAccount }) {
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [showArchived, setShowArchived] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [justAdded, setJustAdded] = useState(null);

  const filtered = derived.accounts.filter((a) => {
    if (filterFirm !== "All" && a.firmName !== filterFirm) return false;
    if (showArchived) return a.archived;
    if (filterStatus !== "All" && a.status !== filterStatus) return false;
    return !a.archived;
  }).sort((a, b) => (a.creationDate < b.creationDate ? 1 : -1));

  const journeys = groupAccountsByChain(filtered);
  const journeyChainIds = new Set(journeys.map((j) => j.chainId));
  const singles = filtered.filter((a) => !journeyChainIds.has(a.chainId));

  useEffect(() => { if (editingAccount) setShowForm(true); }, [editingAccount]);

  function openAdd() { setEditingAccount(null); setShowForm(true); setFormError(""); }
  function openEdit(acc) {
    const a = typeof acc === "string" ? derived.accounts.find((x) => x.id === acc) : acc;
    if (!a) return;
    setEditingAccount(a);
    setShowForm(true);
    setFormError("");
  }
  async function handleSave(data) {
    setSaving(true);
    setFormError("");
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, data);
      } else {
        const id = await createAccount(data);
        setJustAdded(id);
        window.setTimeout(() => setJustAdded((cur) => (cur === id ? null : cur)), 1900);
      }
      setShowForm(false);
      setEditingAccount(null);
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }
  function handleDelete(id) { setDeleteTarget(id); }
  async function confirmDelete() {
    try {
      await deleteAccount(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteTarget(null);
      setFormError(friendlyError(err));
    }
  }
  async function handleArchive(id) {
    try {
      await archiveAccount(id);
    } catch (err) {
      setFormError(friendlyError(err));
    }
  }
  async function handleUnarchive(id) {
    try {
      await unarchiveAccount(id);
    } catch (err) {
      setFormError(friendlyError(err));
    }
  }

  return (
    <div>
      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiTile label="Total Invested" value={money(derived.totals.invested)} sub={`${derived.accounts.length} accounts`} />
        <KpiTile label="Total Received" value={money(derived.totals.received)} accent="var(--sage)" sub="from paid payouts" />
        <KpiTile
          label="Net Position"
          value={money(derived.totals.received - derived.totals.invested)}
          accent={derived.totals.received - derived.totals.invested >= 0 ? "var(--sage)" : "var(--brick)"}
          sub="lifetime, all firms"
        />
        <KpiTile label="Pass Rate" value={`${derived.passRate}%`} accent="var(--brass)" sub="of decided evaluations" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Select value={filterFirm} onChange={(e) => setFilterFirm(e.target.value)} style={{ width: "auto", minWidth: 120 }}>
            <option value="All">All firms</option>
            {firms.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: "auto", minWidth: 120 }} disabled={showArchived}>
            <option value="All">All statuses</option>
            {Object.keys(STATUS_META).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </Select>
          <button
            className="pd-btn flex items-center gap-1.5"
            style={showArchived ? { borderColor: "var(--brass)", color: "var(--brass)" } : {}}
            onClick={() => { setShowArchived((v) => !v); setFilterStatus("All"); }}
          >
            <Archive size={14} /> Archived
          </button>
          {(filterFirm !== "All" || filterStatus !== "All" || showArchived) && (
            <button className="pd-btn" onClick={() => { setFilterFirm("All"); setFilterStatus("All"); setShowArchived(false); }}>
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5 rounded-lg" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
            <button
              onClick={() => setViewMode("card")}
              className="flex items-center justify-center rounded-md transition-colors"
              style={{
                padding: "8px 10px",
                background: viewMode === "card" ? "var(--ink-2)" : "transparent",
                color: viewMode === "card" ? "var(--brass)" : "var(--slate)",
                border: "none", cursor: "pointer",
              }}
              title="Card view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center justify-center rounded-md transition-colors"
              style={{
                padding: "8px 10px",
                background: viewMode === "list" ? "var(--ink-2)" : "transparent",
                color: viewMode === "list" ? "var(--brass)" : "var(--slate)",
                border: "none", cursor: "pointer",
              }}
              title="List view"
            >
              <List size={15} />
            </button>
          </div>
          <button className="pd-btn pd-btn-primary flex items-center gap-1.5" onClick={openAdd}>
            <Plus size={14} /> Add account
          </button>
        </div>
      </div>

      {formError && !showForm && <div className="mb-4"><ErrorBanner message={formError} onDismiss={() => setFormError("")} /></div>}

      {showForm && (
        <div className="mb-5">
          {formError && <div className="mb-3"><ErrorBanner message={formError} onDismiss={() => setFormError("")} /></div>}
          <AccountForm initial={editingAccount} templates={templates} firms={firms} onSave={handleSave} saving={saving}
            onCancel={() => { setShowForm(false); setEditingAccount(null); setFormError(""); }} />
        </div>
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-lg p-10 text-center" style={{ border: "1px dashed var(--line)", color: "var(--slate)" }}>
              No accounts match this filter. Adjust the filters above or buy a new challenge to fill this space.
            </div>
          ) : (
            <>
              {journeys.length > 0 && (
                <div className="mb-6 space-y-4">
                  {journeys.map((j) => (
                    <JourneyGroup key={j.chainId} chain={j.accounts} onOpen={onRowClick} />
                  ))}
                </div>
              )}
              {singles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {singles.map((a, i) => <TicketCard key={a.id} account={a} onOpen={onOpen} onEdit={openEdit} onArchive={handleArchive} onUnarchive={handleUnarchive} index={i} isNew={a.id === justAdded} />)}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1fr 1.2fr 80px 100px 100px 80px 90px 28px 28px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "10px 16px" }}>
            <span>Firm</span><span>Template</span><span>Size</span><span>Status</span><span>Platform</span><span>Fee</span><span>Date</span><span></span><span></span>
          </div>
          {filtered.length === 0 && <div className="p-6 text-sm text-center" style={{ color: "var(--slate)" }}>No accounts match this filter.</div>}
          {filtered.map((a) => (
            <div key={a.id} className={`pd-row grid items-center text-sm pd-mono ${a.id === justAdded ? "pd-row-new" : ""}`} style={{ gridTemplateColumns: "1fr 1.2fr 80px 100px 100px 80px 90px 28px 28px", gap: "0 12px", padding: "10px 16px", borderBottom: "1px solid var(--line)", cursor: "pointer" }} onClick={() => onRowClick(a.id)}>
              <span className="whitespace-nowrap" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{a.firmName}</span>
              <span className="whitespace-nowrap" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{a.templateName}</span>
              <span className="whitespace-nowrap">${(a.size / 1000).toFixed(0)}K</span>
              <span className="whitespace-nowrap"><StatusPill status={a.status} /></span>
              <span className="whitespace-nowrap" style={{ color: "var(--sand-dim)" }}>{a.platform}</span>
              <span className="whitespace-nowrap" style={{ color: "var(--sand-dim)" }}>{money(a.cost)}</span>
              <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDateUK(a.creationDate)}</span>
              <button className="flex items-center justify-center" style={{ color: "var(--slate)", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={(e) => { e.stopPropagation(); openEdit(a); }} title="Edit account"><Pencil size={13} /></button>
              <button className="flex items-center justify-center" style={{ color: "var(--slate)", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }} title="Delete account"><X size={13} /></button>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete account"
          message="Delete this account? All trades, payouts, and certificates linked to it will also be removed."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
