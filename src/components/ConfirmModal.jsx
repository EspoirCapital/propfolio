import { X } from "lucide-react";

export function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = "Delete", confirmStyle }) {
  const defaultStyle = { borderColor: "var(--brick-dim)", color: "var(--brick)" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(10,11,15,0.6)" }} onClick={onCancel}>
      <div className="rounded-lg p-6 w-full max-w-sm" style={{ background: "var(--ink-2)", border: "1px solid var(--line)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="pd-display text-lg" style={{ fontWeight: 600 }}>{title}</h3>
          <button className="pd-btn" style={{ padding: "4px 6px" }} onClick={onCancel}><X size={14} /></button>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--slate)", lineHeight: 1.5 }}>{message}</p>
        <div className="flex gap-2 justify-end">
          <button className="pd-btn" onClick={onCancel}>Cancel</button>
          <button className="pd-btn" style={confirmStyle || defaultStyle} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
