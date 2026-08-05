import { ArrowLeft, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { computeOutcome, money, formatDisplay, formatDateUK, getAccountLabel, OUTCOME_META, RATING_META } from "../utils";
import { StatusPill } from "../components/StatusPill";
import { KpiTile } from "../components/KpiTile";

export function TradeDetailPage({ tradeId, trades, derived, settings, onBack }) {
  const trade = trades.find((t) => t.id === tradeId);
  if (!trade) {
    return (
      <div>
        <button onClick={onBack} className="pd-btn pd-btn-back flex items-center gap-2 mb-5">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="rounded-lg p-10 text-center text-sm" style={{ border: "1px dashed var(--line)", color: "var(--slate)" }}>
          Trade not found.
        </div>
      </div>
    );
  }

  const account = derived.accounts.find((a) => a.id === trade.accountId);
  const outcome = computeOutcome(trade.pnl, trade.risk, settings.beThreshold);
  const rr = trade.risk > 0 ? (trade.pnl / trade.risk).toFixed(1) : "—";

  const accTrades = trades
    .filter((t) => t.accountId === trade.accountId && t.id !== trade.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    <div>
      <button onClick={onBack} className="pd-btn pd-btn-back flex items-center gap-2 mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="pd-eyebrow">{account ? getAccountLabel(account) : trade.accountId}</span>
            {account && <StatusPill status={account.status} />}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="pd-display text-5xl" style={{ fontWeight: 700 }}>{trade.symbol}</span>
            <span className="pd-display text-2xl" style={{ fontWeight: 700, color: trade.side === "Long" ? "var(--sage)" : "var(--brick)" }}>
              {trade.side}
            </span>
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--sand-dim)" }}>{formatDateUK(trade.date)}</div>
        </div>
        {trade.tvLink && (
          <a href={trade.tvLink} target="_blank" rel="noreferrer" className="pd-btn flex items-center gap-1.5 no-underline" style={{ color: "var(--sand)", textDecoration: "none" }}>
            <ExternalLink size={13} /> TradingView
          </a>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <KpiTile
          label="P&L"
          value={formatDisplay(trade.pnl, settings.displayFormat, account?.size || 0, trade.risk)}
          accent={trade.pnl >= 0 ? "var(--sage)" : "var(--brick)"}
        />
        <KpiTile
          label="Risk"
          value={formatDisplay(trade.risk, settings.displayFormat, account?.size || 0, trade.risk)}
          accent="var(--sand)"
        />
        <KpiTile label="R:R" value={rr} accent="var(--brass)" />
        <KpiTile
          label="Outcome"
          value={outcome}
          accent={OUTCOME_META[outcome].color}
        />
        <KpiTile
          label="Rating"
          value={RATING_META[trade.rating]?.label || trade.rating}
          accent={RATING_META[trade.rating]?.color || "var(--slate)"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
          {/* Trade details */}
          <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
            <div className="pd-label mb-3">Trade Details</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: "Symbol", value: trade.symbol },
                { label: "Side", value: trade.side, color: trade.side === "Long" ? "var(--sage)" : "var(--brick)" },
                { label: "Lots", value: trade.lots },
                { label: "Session", value: trade.session },
                { label: "Strategy", value: trade.tag || "—" },
                { label: "Date", value: formatDateUK(trade.date) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="pd-label">{item.label}</span>
                  <span className="pd-mono text-sm" style={{ color: item.color || "var(--sand-dim)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
              <div className="pd-label mb-2">Notes</div>
              <p className="text-sm" style={{ color: "var(--sand-dim)", fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.6 }}>
                {trade.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {/* Account info */}
          {account && (
            <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
              <div className="pd-label mb-3">Account</div>
              <Link to="/accounts/$accountId" params={{ accountId: account.id }}
                className="no-underline" style={{ color: "var(--sand)", textDecoration: "none" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{getAccountLabel(account)}</span>
                  <ExternalLink size={11} style={{ color: "var(--slate)" }} />
                </div>
              </Link>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Size", value: `$${(account.size / 1000).toFixed(0)}K` },
                  { label: "Status", value: account.status },
                  { label: "Firm", value: account.firmName || account.firm },
                  { label: "Platform", value: account.platform },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="pd-label">{item.label}</span>
                    <span className="pd-mono text-sm" style={{ color: "var(--sand-dim)" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related trades */}
          {accTrades.length > 0 && (
            <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
              <div className="pd-label mb-2">Recent Trades from this Account</div>
              {accTrades.map((t) => {
                const tOutcome = computeOutcome(t.pnl, t.risk, settings.beThreshold);
                return (
                  <Link key={t.id} to="/trades/$tradeId" params={{ tradeId: t.id }}
                    className="flex items-center justify-between text-xs py-2 no-underline"
                    style={{ borderTop: "1px solid var(--line-soft)", color: "var(--sand)", textDecoration: "none" }}>
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDateUK(t.date)}</span>
                      <span className="whitespace-nowrap">{t.symbol}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 3, color: OUTCOME_META[tOutcome].color, background: OUTCOME_META[tOutcome].bg }}>{tOutcome}</span>
                    </div>
                    <span className="pd-mono" style={{ color: t.pnl >= 0 ? "var(--sage)" : "var(--brick)" }}>
                      {formatDisplay(t.pnl, settings.displayFormat, account.size, t.risk)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
