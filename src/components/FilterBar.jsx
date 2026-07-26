import { FIRMS, STATUS_META } from "../constants";

export function FilterBar({ filterFirm, setFilterFirm, filterStatus, setFilterStatus }) {
  const hasActive = filterFirm !== "All" || filterStatus !== "All";
  return (
    <div className="flex flex-wrap items-center gap-2 py-3 px-4 rounded-lg mb-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
      <span className="pd-label mr-1">Firm</span>
      {["All", ...FIRMS].map((f) => (
        <button key={f} className="pd-btn" style={filterFirm === f ? { borderColor: "var(--brass)", color: "var(--brass)" } : {}}
          onClick={() => setFilterFirm(f)}>{f}</button>
      ))}
      <span className="pd-label ml-3 mr-1">Status</span>
      {["All", ...Object.keys(STATUS_META)].map((s) => (
        <button key={s} className="pd-btn" style={filterStatus === s ? { borderColor: "var(--brass)", color: "var(--brass)" } : {}}
          onClick={() => setFilterStatus(s)}>{s === "All" ? "All" : STATUS_META[s].label}</button>
      ))}
      {hasActive && (
        <button className="pd-btn ml-2" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => { setFilterFirm("All"); setFilterStatus("All"); }}>
          Clear
        </button>
      )}
    </div>
  );
}
