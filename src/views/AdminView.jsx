import { useState } from "react";
import { Plus, Copy, Check, X, Search, Ban, RotateCcw, ShieldCheck } from "lucide-react";
import { friendlyError } from "../utils";
import { ConfirmModal } from "../components/ConfirmModal";
import { ErrorBanner } from "../components/ErrorBanner";
import { Select } from "../components/Select";

function inviteLink(code) {
  return `${window.location.origin}/?invite=${code}`;
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function money(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function AdminView({ users, userStats = [], invites, generateInvite, revokeInvite, setUserRole, setUserBanned, currentUserId }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [banTarget, setBanTarget] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [useMode, setUseMode] = useState("single");
  const [customUses, setCustomUses] = useState(3);
  const [expiryHours, setExpiryHours] = useState(24);
  const [search, setSearch] = useState("");
  const statsByUser = Object.fromEntries(userStats.map((s) => [s.userId, s]));

  async function handleGenerate() {
    setBusy(true);
    setError("");
    try {
      const maxUses = useMode === "custom" ? Math.max(2, customUses) : 1;
      await generateInvite(maxUses, expiryHours);
      setShowGenerate(false);
      setUseMode("single");
      setCustomUses(3);
      setExpiryHours(24);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function copy(code) {
    try {
      await navigator.clipboard.writeText(inviteLink(code));
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? "" : c)), 1600);
    } catch {
      setError("Couldn't copy the link. Copy the code below manually.");
    }
  }

  async function confirmRevoke() {
    setRevoking(true);
    setError("");
    try {
      await revokeInvite(revokeTarget);
      setRevokeTarget(null);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setRevoking(false);
    }
  }

  async function confirmBan() {
    setError("");
    try {
      await setUserBanned(banTarget.id, !banTarget.banned);
      setBanTarget(null);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function toggleRole(user) {
    if (user.id === currentUserId) {
      setError("You can't remove your own admin role.");
      return;
    }
    setError("");
    try {
      await setUserRole(user.id, !user.isAdmin);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <div>
      <p className="text-sm max-w-lg mb-5" style={{ color: "var(--sand-dim)" }}>
        Invite-only workspace. Create signup links, revoke unused ones, and manage who has admin access.
      </p>

      {error && <div className="mb-4"><ErrorBanner message={error} onDismiss={() => setError("")} /></div>}

      <div className="rounded-lg p-4 mb-6" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="pd-eyebrow">Invites</div>
          <button className="pd-btn pd-btn-primary flex items-center gap-1.5" onClick={() => { setShowGenerate(true); setError(""); }} disabled={busy}>
            <Plus size={14} /> Generate invite
          </button>
        </div>

        {showGenerate && (
          <div className="rounded-lg p-4 mb-4" style={{ background: "var(--ledger-raised)", border: "1px solid var(--brass-dim)" }}>
            <div className="pd-label mb-2">New invite</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <div className="pd-label mb-1">Uses</div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 pd-mono text-xs"
                    onClick={() => setUseMode("single")}
                    style={{
                      padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                      color: useMode === "single" ? "var(--brass)" : "var(--slate)",
                      background: useMode === "single" ? "rgba(206,159,82,0.12)" : "transparent",
                      border: `1px solid ${useMode === "single" ? "var(--brass-dim)" : "var(--line)"}`,
                    }}
                  >Single use</button>
                  <button
                    className="flex-1 pd-mono text-xs"
                    onClick={() => setUseMode("custom")}
                    style={{
                      padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                      color: useMode === "custom" ? "var(--brass)" : "var(--slate)",
                      background: useMode === "custom" ? "rgba(206,159,82,0.12)" : "transparent",
                      border: `1px solid ${useMode === "custom" ? "var(--brass-dim)" : "var(--line)"}`,
                    }}
                  >Custom uses</button>
                </div>
              </div>
              <div>
                <div className="pd-label mb-1">Max signups</div>
                <input
                  type="number" min="2" value={customUses}
                  disabled={useMode === "single"}
                  onChange={(e) => setCustomUses(Number(e.target.value))}
                  onFocus={() => setUseMode("custom")}
                  className="pd-input"
                  style={{ opacity: useMode === "single" ? 0.5 : 1 }}
                />
              </div>
              <div>
                <div className="pd-label mb-1">Expires</div>
                <Select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                >
                  <option value={24}>24 hours</option>
                  <option value={168}>7 days</option>
                  <option value={720}>30 days</option>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button className="pd-btn pd-btn-primary" onClick={handleGenerate} disabled={busy}>{busy ? "Creating…" : "Create invite"}</button>
              <button className="pd-btn" onClick={() => setShowGenerate(false)} disabled={busy}>Cancel</button>
            </div>
          </div>
        )}

        {invites.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--slate)" }}>No invites yet. Generate one and share the link.</p>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1.3fr 100px 110px 60px 90px 1.2fr 28px", gap: "0 12px", background: "var(--ledger-raised)", borderBottom: "1px solid var(--line)", padding: "10px 16px" }}>
              <span>Link</span><span>Created</span><span>Expires</span><span>Uses</span><span>Status</span><span>Used by</span><span></span>
            </div>
            {invites.map((inv) => {
              const statusColor = inv.status === "used" ? "var(--slate)"
                : inv.status === "expired" ? "var(--brick)"
                : "var(--sage)";
              const names = inv.usedByIds.map((id) => {
                const u = users.find((x) => x.id === id);
                return u ? u.name || u.email : "—";
              });
              return (
                <div key={inv.id} className="pd-row grid items-center text-sm pd-mono" style={{ gridTemplateColumns: "1.3fr 100px 110px 60px 90px 1.2fr 28px", gap: "0 12px", padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
                  <span className="min-w-0 truncate" title={inviteLink(inv.code)} style={{ color: "var(--sand)" }}>{inv.code}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDate(inv.createdAt)}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDate(inv.expiresAt)}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--sand-dim)" }}>{inv.usedCount}/{inv.maxUses}</span>
                  <span className="whitespace-nowrap" style={{ color: statusColor }}>{inv.status}</span>
                  <span className="min-w-0 truncate" title={names.join(", ")} style={{ color: "var(--slate)" }}>{names.join(", ") || "—"}</span>
                  <div className="flex items-center justify-end gap-1">
                    <button className="flex items-center justify-center" style={{ color: copied === inv.code ? "var(--sage)" : "var(--slate)", background: "none", border: "none", cursor: "pointer", padding: 4 }} onClick={() => copy(inv.code)} title="Copy invite link">
                      {copied === inv.code ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    {inv.status === "active" && (
                      <button className="flex items-center justify-center" style={{ color: "var(--brick)", background: "none", border: "none", cursor: "pointer", padding: 4 }} onClick={() => setRevokeTarget(inv.id)} title="Revoke invite">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
        <div className="pd-eyebrow mb-3">People</div>
        <div className="mb-3">
          <div className="pd-search" style={{ maxWidth: 320 }}>
            <Search size={14} style={{ color: "var(--slate)" }} />
            <input
              className="pd-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)", overflowX: "auto" }}>
          <div className="grid pd-label items-center" style={{ gridTemplateColumns: "minmax(180px,1.3fr) minmax(160px,1.4fr) 86px 92px 84px 78px 84px 104px 104px 96px", gap: "0 12px", background: "var(--ledger-raised)", borderBottom: "1px solid var(--line)", padding: "10px 16px", minWidth: 1020 }}>
            <span>Name</span><span>Email</span><span>Role</span><span>Joined</span><span>Active</span><span>WR%</span><span>Payouts</span><span>Received</span><span>Net</span><span className="text-right">Access</span>
          </div>
          {users
            .filter((u) => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
            })
            .map((u) => {
            const isSelf = u.id === currentUserId;
            const st = statsByUser[u.id];
            const netColor = st && st.net < 0 ? "var(--brick)" : "var(--sage)";
            return (
            <div key={u.id} className="pd-row grid items-center text-sm" style={{ gridTemplateColumns: "minmax(180px,1.3fr) minmax(160px,1.4fr) 86px 92px 84px 78px 84px 104px 104px 96px", gap: "0 12px", padding: "11px 16px", borderBottom: "1px solid var(--line)", background: u.banned ? "rgba(193,89,75,0.06)" : "transparent", minWidth: 1020 }}>
              <span className="min-w-0 truncate" style={{ color: u.banned ? "var(--sand-dim)" : "var(--sand)", fontWeight: 500 }}>
                {u.name || "—"}
                {isSelf && <span style={{ color: "var(--brass)" }}> (you)</span>}
              </span>
              <span className="min-w-0 truncate pd-mono text-[13px]" style={{ color: "var(--slate)" }}>{u.email}</span>
              <button
                onClick={() => toggleRole(u)}
                disabled={isSelf || u.banned}
                title={isSelf ? "You can't change your own role" : "Toggle admin access"}
                className={`pd-btn-action ${u.isAdmin ? "active-role" : ""}`}
              >
                {u.isAdmin ? <ShieldCheck size={12} /> : null}
                {u.isAdmin ? "ADMIN" : "USER"}
              </button>
              <span className="whitespace-nowrap pd-mono text-[13px]" style={{ color: "var(--slate)" }}>{formatDate(u.createdAt)}</span>
              <span className="whitespace-nowrap pd-mono text-[13px]" style={{ color: "var(--sand)" }}>{st ? st.activeAccounts : "—"}</span>
              <span className="whitespace-nowrap pd-mono text-[13px]" style={{ color: st && st.winRate !== null ? "var(--sand)" : "var(--slate)" }}>{st && st.winRate !== null ? `${st.winRate}%` : "—"}</span>
              <span className="whitespace-nowrap pd-mono text-[13px]" style={{ color: st ? "var(--sand)" : "var(--slate)" }}>{st ? st.payoutCount : "—"}</span>
              <span className="whitespace-nowrap pd-mono text-[13px]" style={{ color: st ? "var(--sage)" : "var(--slate)" }}>{st ? money(st.totalReceived) : "—"}</span>
              <span className="whitespace-nowrap pd-mono text-[13px]" style={{ color: st ? netColor : "var(--slate)" }}>{st ? money(st.net) : "—"}</span>
              <div className="flex items-center justify-end">
                {u.banned ? (
                  <div className="flex items-center gap-2">
                    <span className="pd-chip chip-suspended">Suspended</span>
                    <button
                      onClick={() => setBanTarget({ id: u.id, name: u.name || u.email, email: u.email, role: u.isAdmin ? "Admin" : "User", joined: u.createdAt, banned: true })}
                      className="pd-btn-action pd-btn-restore"
                      title="Restore access"
                    >
                      <RotateCcw size={12} /> Restore
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setBanTarget({ id: u.id, name: u.name || u.email, email: u.email, role: u.isAdmin ? "Admin" : "User", joined: u.createdAt })}
                    disabled={isSelf}
                    title={isSelf ? "You can't ban yourself" : "Suspend this member"}
                    className="pd-btn-action pd-btn-danger"
                  >
                    <Ban size={12} /> Ban
                  </button>
                )}
              </div>
            </div>
          );
          })}
          {users.filter((u) => { const q = search.trim().toLowerCase(); return !q || (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q); }).length === 0 && (
            <div className="text-sm pd-mono" style={{ padding: "12px 16px", color: "var(--slate)" }}>{users.length === 0 ? "No users found." : "No users match your search."}</div>
          )}
        </div>
      </div>

      {revokeTarget && (
        <ConfirmModal
          title="Revoke invite"
          message="Revoke this invite link? The person can no longer sign up with it."
          confirmLabel="Revoke"
          onConfirm={confirmRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      )}

      {banTarget && (
        <ConfirmModal
          tone="danger"
          eyebrow="Access control"
          title={banTarget.banned ? "Restore member" : `Suspend ${banTarget.name}`}
          detail={[
            { label: "Member", value: banTarget.email },
            { label: "Role", value: banTarget.role },
            { label: "Joined", value: formatDate(banTarget.joined) },
          ]}
          message={banTarget.banned
            ? `Reinstate access. They'll be able to sign in again immediately.`
            : `They'll be logged out right away and barred from signing back in, while their data stays intact. You can restore access anytime.`}
          confirmLabel={banTarget.banned ? "Restore access" : "Suspend member"}
          onConfirm={confirmBan}
          onCancel={() => setBanTarget(null)}
        />
      )}
    </div>
  );
}
