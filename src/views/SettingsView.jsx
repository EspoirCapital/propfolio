import { useState } from "react";
import { FormatToggle } from "../components/FormatToggle";

export function SettingsView({ settings, setSettings, session, updateProfile }) {
  const [name, setName] = useState(session?.name || "");
  const [email, setEmail] = useState(session?.email || "");
  const [profileSaving, setProfileSaving] = useState(false);

  function update(key, value) {
    const next = { ...settings, [key]: value };
    setSettings(next);
  }
  function handleProfileSave(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setProfileSaving(true);
    updateProfile({ name: trimmed, email: email.trim() }).finally(() => setProfileSaving(false));
  }

  const initials = (session.name || "EC").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 480 }}>
      {/* Profile */}
      <div className="rounded-lg p-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
        <div className="pd-label mb-3">Profile</div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ background: "var(--brass)", color: "var(--ink)" }}>
            {initials}
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--sand)" }}>{session.name}</div>
            <div className="text-xs" style={{ color: "var(--slate)" }}>{session.email || "No email"}</div>
          </div>
        </div>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-3">
          <div>
            <div className="pd-label mb-1">Name</div>
            <input className="pd-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <div className="pd-label mb-1">Email</div>
            <input className="pd-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="pd-btn pd-btn-primary self-start" disabled={profileSaving}>{profileSaving ? "Saving…" : "Save profile"}</button>
        </form>
      </div>

      {/* Display */}
      <div className="rounded-lg p-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
        <div className="pd-label mb-3">Display</div>
        <div className="mb-5">
          <div className="pd-label mb-2">Format</div>
          <FormatToggle value={settings.displayFormat} onChange={(v) => update("displayFormat", v)} options={["dollar", "percent", "rr"]} />
          <div className="pd-mono text-xs mt-1" style={{ color: "var(--slate)" }}>
            % = percent of account size · RR = ratio to that trade's risk
          </div>
        </div>
        <div>
          <div className="pd-label mb-2">Breakeven threshold</div>
          <div className="flex items-center gap-2">
            <input type="number" className="pd-input" style={{ width: 80 }} value={settings.beThreshold}
              onChange={(e) => update("beThreshold", parseFloat(e.target.value) || 0)} />
            <span className="pd-mono text-sm" style={{ color: "var(--slate)" }}>% of risk</span>
          </div>
          <div className="pd-mono text-xs mt-1" style={{ color: "var(--slate)" }}>
            P&L within this % of risk = breakeven (BE), not a win or loss
          </div>
        </div>
      </div>
    </div>
  );
}
