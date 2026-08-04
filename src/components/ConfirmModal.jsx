import { X, AlertTriangle, RotateCcw, Trash2 } from "lucide-react";

const TONE = {
  danger: { confirm: { background: "var(--brick)", color: "#1c0705", borderColor: "var(--brick)" }, icon: AlertTriangle, iconColor: "var(--brick)" },
  restore: { confirm: { background: "var(--sage)", color: "#0a1810", borderColor: "var(--sage)" }, icon: RotateCcw, iconColor: "var(--sage)" },
  default: { confirm: { background: "var(--ledger-raised)", color: "var(--sand)", borderColor: "var(--line)" }, icon: Trash2, iconColor: "var(--slate)" },
};

export function ConfirmModal({ title, eyebrow, message, onConfirm, onCancel, confirmLabel = "Delete", tone = "default", confirmStyle, detail }) {
  const t = TONE[tone] || TONE.default;
  const Icon = t.icon;
  const confirmBtnStyle = { ...t.confirm, ...(confirmStyle || {}) };
  return (
    <div className="pd-backdrop" onClick={onCancel}>
      <div className="pd-dialog" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="pd-dialog-head">
          <div className="flex items-start gap-3 min-w-0">
            <span className="mt-0.5 shrink-0" style={{ color: t.iconColor }}><Icon size={17} /></span>
            <div className="min-w-0">
              {eyebrow && <div className="pd-eyebrow mb-0.5">{eyebrow}</div>}
              <h3 className="pd-display text-xl" style={{ fontWeight: 700, lineHeight: 1.1 }}>{title}</h3>
            </div>
          </div>
          <button className="pd-btn-action" style={{ padding: "5px 7px", border: "none", background: "transparent" }} onClick={onCancel} aria-label="Close"><X size={14} /></button>
        </div>

        <div className="pd-dialog-body">
          {detail && (
            <div className="rounded-lg px-4 py-2 mb-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
              {detail.map((row, i) => (
                <div key={i} className="pd-detail-row">
                  <span className="pd-mono text-[10.5px] uppercase" style={{ letterSpacing: "0.08em", color: "var(--slate)" }}>{row.label}</span>
                  <span className="pd-mono text-sm truncate" style={{ color: "var(--sand)" }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm" style={{ color: "var(--sand-dim)", lineHeight: 1.55 }}>{message}</p>
        </div>

        <div className="pd-dialog-foot">
          <button className="pd-btn-action" onClick={onCancel}>Cancel</button>
          <button className="pd-btn-action" style={confirmBtnStyle} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}