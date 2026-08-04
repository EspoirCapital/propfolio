import { useState } from "react";
import { Plus, Copy, Check, X, ShieldCheck, Shield, Ban, RotateCcw } from "lucide-react";
import { friendlyError } from "../utils";
import { ConfirmModal } from "../components/ConfirmModal";
import { ErrorBanner } from "../components/ErrorBanner";

function inviteLink(code) {
  return `${window.location.origin}/?invite=${code}`;
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function AdminView({ users, invites, generateInvite, revokeInvite, setUserRole, setUserBanned, currentUserId }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [banTarget, setBanTarget] = useState(null);

  async function handleGenerate() {
    setBusy(true);
    setError("");
    try {
      await generateInvite();
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
          <button className="pd-btn pd-btn-primary flex items-center gap-1.5" onClick={handleGenerate} disabled={busy}>
            <Plus size={14} /> Generate invite
          </button>
        </div>

        {invites.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--slate)" }}>No invites yet. Generate one and share the link.</p>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1.3fr 120px 130px 60px 96px 28px", gap: "0 12px", background: "var(--ledger-raised)", borderBottom: "1px solid var(--line)", padding: "10px 16px" }}>
              <span>Link</span><span>Created</span><span>Expires</span><span>Status</span><span>Used by</span><span></span>
            </div>
            {invites.map((inv) => {
              const usedBy = users.find((u) => u.id === inv.usedById);
              const statusColor = inv.status === "used" ? "var(--slate)"
                : inv.status === "expired" ? "var(--brick)"
                : "var(--sage)";
              return (
                <div key={inv.id} className="pd-row grid items-center text-sm pd-mono" style={{ gridTemplateColumns: "1.3fr 120px 130px 60px 96px 28px", gap: "0 12px", padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
                  <span className="min-w-0 truncate" title={inviteLink(inv.code)} style={{ color: "var(--sand)" }}>{inv.code}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDate(inv.createdAt)}</span>
                  <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDate(inv.expiresAt)}</span>
                  <span className="whitespace-nowrap" style={{ color: statusColor }}>{inv.status}</span>
                  <span className="whitespace-nowrap truncate" style={{ color: "var(--slate)" }}>{usedBy ? usedBy.name || usedBy.email : "—"}</span>
                  <div className="flex items-center justify-end gap-1">
                    <button className="flex items-center justify-center" style={{ color: copied === inv.code ? "var(--sage)" : "var(--slate)", background: "none", border: "none", cursor: "pointer", padding: 4 }} onClick={() => copy(inv.code)} title="Copy invite link">
                      {copied === inv.code ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    {inv.status === "pending" && (
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
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1.4fr 1.6fr 70px 84px", gap: "0 12px", background: "var(--ledger-raised)", borderBottom: "1px solid var(--line)", padding: "10px 16px" }}>
            <span>Name</span><span>Email</span><span>Role</span><span className="text-right">Action</span>
          </div>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
            <div key={u.id} className="pd-row grid items-center text-sm" style={{ gridTemplateColumns: "1.4fr 1.6fr 70px 84px", gap: "0 12px", padding: "10px 16px", borderBottom: "1px solid var(--line)", opacity: u.banned ? 0.55 : 1 }}>
              <span className="min-w-0 truncate" style={{ color: "var(--sand)", fontWeight: 500 }}>
                {u.name || "—"}
                {isSelf && <span className="pd-mono text-xs ml-1.5" style={{ color: "var(--brass)" }}>(you)</span>}
                {u.banned && <span className="pd-mono text-xs ml-1.5" style={{ color: "var(--brick)" }}>BANNED</span>}
              </span>
              <span className="min-w-0 truncate pd-mono text-sm" style={{ color: "var(--slate)" }}>{u.email}</span>
              <button
                onClick={() => toggleRole(u)}
                disabled={isSelf}
                title={isSelf ? "You can't change your own role" : u.isAdmin ? "Remove admin" : "Make admin"}
                className="flex items-center gap-1.5 justify-center pd-mono text-xs"
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: isSelf ? "not-allowed" : "pointer",
                  color: u.isAdmin ? "var(--brass)" : "var(--slate)",
                  background: u.isAdmin ? "rgba(197,160,90,0.12)" : "transparent",
                  border: `1px solid ${u.isAdmin ? "var(--brass-dim)" : "var(--line)"}`,
                  opacity: isSelf ? 0.6 : 1,
                }}
              >
                {u.isAdmin ? <ShieldCheck size={12} /> : <Shield size={12} />}
                {u.isAdmin ? "ADMIN" : "USER"}
              </button>
              <button
                onClick={() => setBanTarget({ id: u.id, name: u.name || u.email, banned: u.banned })}
                disabled={isSelf}
                title={isSelf ? "You can't ban yourself" : u.banned ? "Restore access" : "Ban this user"}
                className="flex items-center gap-1.5 justify-center pd-mono text-xs"
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: isSelf ? "not-allowed" : "pointer",
                  color: u.banned ? "var(--sage)" : "var(--brick)",
                  background: u.banned ? "rgba(126,157,108,0.12)" : "transparent",
                  border: `1px solid ${u.banned ? "var(--sage-dim)" : "var(--brick-dim)"}`,
                  opacity: isSelf ? 0 : 1,
                  visibility: isSelf ? "hidden" : "visible",
                }}
              >
                {u.banned ? <RotateCcw size={12} /> : <Ban size={12} />}
                {u.banned ? "UNBAN" : "BAN"}
              </button>
            </div>
          );
          })}
          {users.length === 0 && (
            <div className="text-sm pd-mono" style={{ padding: "10px 16px", color: "var(--slate)" }}>No users found.</div>
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
          title={banTarget.banned ? "Restore access" : "Ban user"}
          message={banTarget.banned
            ? `Restore access for ${banTarget.name}? They'll be able to sign in again.`
            : `Ban ${banTarget.name}? They'll be logged out immediately and can't sign back in until you unban them.`}
          confirmLabel={banTarget.banned ? "Restore" : "Ban"}
          confirmStyle={banTarget.banned ? { borderColor: "var(--sage-dim)", color: "var(--sage)" } : undefined}
          onConfirm={confirmBan}
          onCancel={() => setBanTarget(null)}
        />
      )}
    </div>
  );
}
