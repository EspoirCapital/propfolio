export function KpiTile({ label, value, sub, accent }) {
  return (
    <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
      <div className="pd-label mb-2">{label}</div>
      <div className="pd-mono text-2xl font-medium" style={{ color: accent || "var(--sand)" }}>{value}</div>
      {sub && <div className="pd-mono text-xs mt-1" style={{ color: "var(--slate)" }}>{sub}</div>}
    </div>
  );
}
