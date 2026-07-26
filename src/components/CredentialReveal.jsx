import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function CredentialReveal({ fields, link }) {
  const [reveal, setReveal] = useState({});
  const toggle = (k) => setReveal((r) => ({ ...r, [k]: !r[k] }));

  return (
    <div className="flex flex-col gap-2.5">
      {fields.map(({ key, label, value }) => (
        <div key={key} className="flex items-center justify-between gap-2">
          <span className="pd-label" style={{ minWidth: 70 }}>{label}</span>
          <span className="pd-mono text-sm flex-1 text-right" style={{ color: "var(--sand-dim)" }}>
            {reveal[key] ? value : "••••••••"}
          </span>
          <button type="button" onClick={() => toggle(key)} style={{ color: "var(--slate)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            {reveal[key] ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      ))}
      {link && (
        <div className="flex items-center justify-between gap-2">
          <span className="pd-label" style={{ minWidth: 70 }}>Link</span>
          <a href={link} target="_blank" rel="noreferrer" className="pd-mono text-sm flex-1 text-right truncate" style={{ color: "var(--brass)", textDecoration: "none" }} title={link}>
            {link.replace(/^https?:\/\//, "")}
          </a>
        </div>
      )}
    </div>
  );
}
