import { Fragment } from "react";
import { Check, X, ChevronRight, ChevronsRight } from "lucide-react";
import { STATUS_META } from "../constants";
import { money, formatDateUK, activeChainMember } from "../utils";

function stateClass(a, activeId) {
  if (a.id === activeId) return "active";
  if (a.status === "passed" || a.status === "funded") return "done";
  if (a.status === "breached") return "bad";
  return "";
}

export function JourneyGroup({ chain, onOpen }) {
  const firm = chain[0].firmName || chain[0].firm;
  const template = chain[0].templateName || chain[0].template;
  const size = chain[0].size;
  const invested = chain.reduce((s, a) => s + (a.cost || 0), 0);
  const active = activeChainMember(chain);
  const activeId = active ? active.id : null;

  return (
    <div className="pd-ticket">
      <div className="flex items-center justify-between gap-3" style={{ padding: "14px 16px", borderBottom: "1px dashed var(--line)" }}>
        <div className="min-w-0">
          <div className="pd-eyebrow truncate">{firm} · {template}</div>
          <div className="pd-mono text-xs mt-1.5" style={{ color: "var(--slate)" }}>
            {size >= 1000 ? `$${(size / 1000).toFixed(0)}K` : money(size)} · {chain.length} phase journey · {money(invested)} invested
          </div>
        </div>
        <ChevronsRight size={16} style={{ color: "var(--slate)", flexShrink: 0 }} />
      </div>

      <div className="pd-journey" style={{ padding: "14px 16px" }}>
        {chain.map((a, i) => {
          const cls = stateClass(a, activeId);
          const label = STATUS_META[a.status]?.label || a.status;
          return (
            <Fragment key={a.id}>
              {i > 0 && <div className={`pd-jconn ${cls === "done" ? "done" : ""}`}><span className="pd-jconn-line" /><ChevronRight size={14} /></div>}
              <button
                onClick={() => onOpen(a.id)}
                className={`pd-jnode ${cls}`}
                title={`Open ${label} account`}
              >
                <span className="pd-jnode-top">
                  <span className="pd-jnode-label">{label}</span>
                  {cls === "done" && <Check size={12} style={{ color: "var(--sage)", flexShrink: 0 }} />}
                  {cls === "bad" && <X size={12} style={{ color: "var(--brick)", flexShrink: 0 }} />}
                  {cls === "active" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--brass)", flexShrink: 0 }} />}
                </span>
                <span className="pd-jnode-pnl" style={{ color: a.tradePnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{money(a.tradePnl)}</span>
                <span className="pd-jnode-date">{formatDateUK(a.creationDate)}</span>
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}