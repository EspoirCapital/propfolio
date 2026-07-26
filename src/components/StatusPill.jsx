import { STATUS_META } from "../constants";

export function StatusPill({ status }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={`pd-pill ${meta.pulse ? "pd-pulse" : ""}`}
      style={{ color: meta.color, background: meta.bg, borderColor: meta.color + "33" }}
    >
      <Icon size={12} strokeWidth={2.2} />
      {meta.label}
    </span>
  );
}
