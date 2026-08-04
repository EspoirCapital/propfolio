import { Fragment } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { STATUS_META } from "../constants";
import { money, formatDateUK, activeChainMember } from "../utils";

function stateMark(a) {
  if (a.status === "passed" || a.status === "funded") {
    return <Check size={12} style={{ color: "var(--sage)" }} />;
  }
  if (a.status === "breached") {
    return <X size={12} style={{ color: "var(--brick)" }} />;
  }
  return null;
}

export function JourneyGroup({ chain, onOpen }) {
  const firm = chain[0].firm;
  const template = chain[0].template;
  const size = chain[0].size;
  const invested = chain.reduce((s, a) => s + (a.cost || 0), 0);
  const active = activeChainMember(chain);
  const activeId = active ? active.id : null;

  return (
    <div className="pd-ticket">
      <div className="flex items-center justify-between gap-3" style={{ padding: "14px 16px", borderBottom: "1px dashed var(--line)" }}>
        <div className="min-w-0">
          <div className="pd-eyebrow truncate">{firm} · {template}</div>
          <div className="pd-mono text-xs mt-1" style={{ color: "var(--slate)" }}>
            {size >= 1000 ? `$${(size / 1000).toFixed(0)}K` : money(size)} · {chain.length} phase journey · {money(invested)} invested
          </div>
        </div>
        <ChevronRight size={16} style={{ color: "var(--slate)", flexShrink: 0 }} />
      </div>
      <div className="flex flex-wrap items-stretch gap-2" style={{ padding: "14px 16px" }}>
        {chain.map((a, i) => (
          <Fragment key={a.id}>
            {i > 0 && <div className="flex items-center" style={{ color: "var(--slate)" }}>→</div>}
            <button
              onClick={() => onOpen(a.id)}
              className="flex flex-col items-start gap-1.5 text-left"
              style={{
                background: "var(--ink)",
                border: `1px solid ${a.id === activeId ? "var(--brass)" : "var(--line)"}`,
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                minWidth: 120,
              }}
              title={`Open ${STATUS_META[a.status]?.label || a.status}`}
            >
              <span className="flex items-center gap-1.5" style={{ fontWeight: 600, color: a.archived ? "var(--slate)" : "var(--sand)" }}>
                {STATUS_META[a.status]?.label || a.status}
                {stateMark(a)}
              </span>
              <span className="pd-mono" style={{ fontSize: 12, color: a.tradePnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{money(a.tradePnl)}</span>
              <span className="pd-mono" style={{ fontSize: 10, color: "var(--slate)" }}>{formatDateUK(a.creationDate)}</span>
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
