import { ChevronRight, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { STATUS_META } from "../constants";
import { money, getAccountLabel } from "../utils";
import { StatusPill } from "../components/StatusPill";

export function TicketCard({ account, onOpen, onEdit, onArchive, onUnarchive, index, isNew }) {
  return (
    <div className={`pd-ticket ${isNew ? "pd-row-new" : ""}`} style={{ animationDelay: `${index * 45}ms` }} onClick={() => onOpen(account.id)}
      role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(account.id)}>
      <div className="p-4 flex flex-col justify-between gap-3 min-w-0">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="pd-eyebrow truncate">{getAccountLabel(account)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(account.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--slate)", flexShrink: 0 }}
                title="Edit account"
              ><Pencil size={12} /></button>
              {account.archived ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onUnarchive(account.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--sage)", flexShrink: 0 }}
                  title="Unarchive account"
                ><ArchiveRestore size={12} /></button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onArchive(account.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--slate)", flexShrink: 0 }}
                  title="Archive account"
                ><Archive size={12} /></button>
              )}
            </div>
            <StatusPill status={account.status} />
          </div>
          <div className="pd-display text-3xl leading-none mt-2" style={{ fontWeight: 700 }}>
            ${(account.size / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="flex items-center gap-4 pd-mono text-xs" style={{ color: "var(--slate)" }}>
          <span>{account.templateName || account.template}</span>
          <span>{account.maxLoss} max</span>
          <span>{account.dailyLoss} daily</span>
          {account.targetGoal && <span style={{ color: "var(--brass)" }}>Target {account.targetGoal}</span>}
        </div>
      </div>
      <div className="pd-ticket-stub">
        <div className="pd-label">P&L</div>
        {account.size > 0 && (
          <div className="pd-mono text-lg font-medium" style={{ color: account.tradePnl >= 0 ? "var(--sage)" : "var(--brick)" }}>
            {((account.tradePnl / account.size) * 100).toFixed(2)}%
          </div>
        )}
        <div className="pd-mono" style={{ fontSize: 11, color: "var(--sand)" }}>
          {money(account.tradePnl)}
        </div>
        {account.targetPct !== null && (
          <div style={{ width: "100%", height: 4, borderRadius: 2, background: "var(--ink)", marginTop: 4, overflow: "hidden" }}>
            <div style={{ width: `${account.targetPct}%`, height: "100%", borderRadius: 2, background: "var(--brass)", transition: "width 0.3s ease" }} />
          </div>
        )}
        {account.targetPct !== null && (
          <div className="pd-mono" style={{ fontSize: 9, color: "var(--slate)" }}>
            Progress: {account.targetPct}%
          </div>
        )}
        {["funded", "passed"].includes(account.status) && (
          <div className="pd-mono" style={{ fontSize: 10, color: "var(--slate)" }}>{account.tradeCount} trades</div>
        )}
        <ChevronRight size={14} style={{ color: "var(--slate)" }} />
      </div>
    </div>
  );
}
