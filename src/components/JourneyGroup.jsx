import { Fragment } from "react";
import { ChevronRight, ChevronsRight } from "lucide-react";
import { money, activeChainMember } from "../utils";
import { TicketCard } from "../views/TicketCard";

export function JourneyGroup({ chain, onOpen, onEdit, onArchive, onUnarchive, newId }) {
  const firm = chain[0].firmName || chain[0].firm;
  const template = chain[0].templateName || chain[0].template;
  const size = chain[0].size;
  const invested = chain.reduce((s, a) => s + (a.cost || 0), 0);
  const active = activeChainMember(chain);
  const activeId = active ? active.id : null;

  return (
    <div className="pd-group">
      <div className="flex items-center justify-between gap-3" style={{ padding: "14px 16px", borderBottom: "1px dashed var(--line)" }}>
        <div className="min-w-0">
          <div className="pd-eyebrow truncate">{firm} · {template}</div>
          <div className="pd-mono text-xs mt-1.5" style={{ color: "var(--slate)" }}>
            {size >= 1000 ? `$${(size / 1000).toFixed(0)}K` : money(size)} · {chain.length} phase journey · {money(invested)} invested
          </div>
        </div>
        <ChevronsRight size={16} style={{ color: "var(--slate)", flexShrink: 0 }} />
      </div>

      <div className="pd-journey-cards">
        {chain.map((a, i) => {
          const prev = chain[i - 1];
          const prevDone = prev && (prev.status === "passed" || prev.status === "funded");
          return (
            <Fragment key={a.id}>
              {i > 0 && (
                <div className={`pd-jconn-cards ${prevDone ? "done" : ""}`} aria-hidden="true">
                  <ChevronRight size={16} className="pd-jconn-cards-icon" />
                </div>
              )}
              <div className={`pd-jcard ${a.id === activeId ? "pd-jcard-active" : ""}`}>
                <TicketCard account={a} onOpen={onOpen} onEdit={onEdit} onArchive={onArchive} onUnarchive={onUnarchive} index={i} isNew={a.id === newId} />
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
