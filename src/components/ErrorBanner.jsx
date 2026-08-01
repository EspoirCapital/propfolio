import { X } from "lucide-react";

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      className="text-xs rounded-md px-3 py-2 flex items-start justify-between gap-2"
      style={{ background: "rgba(193,89,75,0.14)", color: "var(--brick)", border: "1px solid var(--brick-dim)" }}
      role="alert"
    >
      <span className="min-w-0">{message}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--brick)", flexShrink: 0 }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
