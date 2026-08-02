import { useState } from "react";
import { X, ChevronRight, PenLine, ArrowRight, AlertTriangle, Archive, ArchiveRestore } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useApp } from "../context";
import { computeOutcome, money, getAccountLabel, formatDateUK, OUTCOME_META, RATING_META, nextStatus, nextStatusLabel, friendlyError } from "../utils";
import { StatusPill } from "../components/StatusPill";
import { ProgressionStepper } from "../components/ProgressionStepper";
import { CredentialReveal } from "../components/CredentialReveal";
import { EquityCurve } from "../components/EquityCurve";
import { ErrorBanner } from "../components/ErrorBanner";

export function AccountDrawer({ account, trades, payouts, certificates, settings, templates, onViewDetails, onLogTrade, onClose, archiveAccount, unarchiveAccount }) {
  const { proceed: proceedFn, breach: breachFn } = useApp();
  const navigate = useNavigate();

  const [showProceedConfirm, setShowProceedConfirm] = useState(false);
  const [showBreachConfirm, setShowBreachConfirm] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!account) return null;

  const accTrades = trades.filter((t) => t.accountId === account.id && !t.archived);
  const accPayouts = payouts.filter((p) => p.accountId === account.id);
  const accCerts = certificates.filter((c) => c.accountId === account.id);

  const template = templates.find((t) => t.firm === account.firm && t.name === account.template);
  const phaseCount = template?.phases ?? 0;
  const challengeFee = account.costs?.[0]?.amount ?? 0;

  const enrichedTrades = accTrades.map((t) => {
    const outcome = computeOutcome(t.pnl, t.risk, settings.beThreshold);
    return { ...t, outcome };
  });

  const wins = enrichedTrades.filter((t) => t.outcome === "W").length;
  const losses = enrichedTrades.filter((t) => t.outcome === "L").length;
  const decisionTrades = wins + losses;
  const winRate = decisionTrades ? Math.round((wins / decisionTrades) * 100) : 0;
  const winTrades = enrichedTrades.filter((t) => t.outcome === "W" && t.risk > 0);
  const avgRR = winTrades.length
    ? (winTrades.reduce((s, t) => s + (t.pnl / t.risk), 0) / winTrades.length).toFixed(1)
    : "—";
  const ratings = { green: 0, amber: 0, red: 0 };
  enrichedTrades.forEach((t) => { if (ratings[t.rating] !== undefined) ratings[t.rating]++; });

  const totalPnl = enrichedTrades.reduce((s, t) => s + t.pnl, 0);
  const maxLossBreached = account.maxLoss > 0 && totalPnl <= -account.maxLoss;
  const dailyPnlByDate = {};
  enrichedTrades.forEach((t) => { dailyPnlByDate[t.date] = (dailyPnlByDate[t.date] || 0) + t.pnl; });
  const dailyLossBreached = account.dailyLoss > 0 && Object.values(dailyPnlByDate).some((d) => d <= -account.dailyLoss);
  const isBreached = (maxLossBreached || dailyLossBreached) && account.status !== "breached" && account.status !== "passed";

  let running = 0;
  const sortedTrades = enrichedTrades.slice().reverse();
  const refundEvent = account.refund > 0 && account.refundDate
    ? [{ date: account.refundDate, pnl: account.refund, isRefund: true }] : [];
  const mergedDrawer = [...sortedTrades, ...refundEvent].sort((a, b) => (a.date > b.date ? 1 : -1));
  const curve = mergedDrawer.map((t) => {
    running += t.pnl;
    return { date: formatDateUK(t.date), pnl: Math.round(running) };
  });

  const canProceed = (account.targetPct ?? 0) >= 100 && nextStatus(account.status, phaseCount);
  const nextDest = nextStatusLabel(account.status, phaseCount);

  async function handleProceed() {
    setBusy(true);
    setActionError("");
    try {
      const newId = await proceedFn({ id: account.id });
      onClose();
      navigate({ to: "/accounts/$accountId", params: { accountId: newId } });
    } catch (err) {
      setShowProceedConfirm(false);
      setActionError(friendlyError(err));
      setBusy(false);
    }
  }

  async function handleBreach() {
    setBusy(true);
    setActionError("");
    try {
      await breachFn({ id: account.id });
      onClose();
    } catch (err) {
      setShowBreachConfirm(false);
      setActionError(friendlyError(err));
      setBusy(false);
    }
  }

  async function toggleArchive() {
    setBusy(true);
    setActionError("");
    try {
      if (account.archived) {
        await unarchiveAccount(account.id);
      } else {
        await archiveAccount(account.id);
      }
      onClose();
    } catch (err) {
      setActionError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex justify-end" style={{ background: "rgba(10,11,15,0.55)" }} onClick={onClose}>
      <div className="pd-drawer pd-scrollbar w-full max-w-md h-full overflow-y-auto p-6 flex flex-col"
        style={{ background: "var(--ink-2)", borderLeft: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 min-h-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              <span className="pd-eyebrow">{getAccountLabel(account)}</span>
              <div className="pd-display text-4xl" style={{ fontWeight: 700 }}>${(account.size / 1000).toFixed(0)}K</div>
            </div>
            <button className="pd-btn" onClick={onClose} aria-label="Close"><X size={14} /></button>
          </div>
          <div className="mb-4"><StatusPill status={account.status} /></div>

          {actionError && <div className="mb-4"><ErrorBanner message={actionError} onDismiss={() => setActionError("")} /></div>}

          <ProgressionStepper phaseCount={phaseCount} status={account.status} target={template?.target} compact />

            <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-md p-2.5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
              <div className="pd-label">Drawdown</div>
              <div className="pd-mono text-xs">{account.drawdown} · max {account.maxLoss}</div>
            </div>
            <div className="rounded-md p-2.5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
              <div className="pd-label">Challenge Fee</div>
              <div className="pd-mono text-xs" style={{ color: "var(--sand)" }}>{money(challengeFee)}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="pd-label mb-1.5">Credentials</div>
            <div className="rounded-md p-2.5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
              <CredentialReveal fields={[
                { key: "platformLogin", label: "Login", value: account.platformLogin },
                { key: "platformPassword", label: "Password", value: account.platformPassword },
                { key: "platformInvestorPassword", label: "Investor", value: account.platformInvestorPassword },
              ]} />
            </div>
          </div>

          {accTrades.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-md p-2 text-center" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
                <div className="pd-label mb-0.5" style={{ fontSize: 9 }}>Win Rate</div>
                <div className="pd-mono text-lg" style={{ color: "var(--sage)" }}>{winRate}%</div>
                <div className="pd-mono" style={{ fontSize: 9, color: "var(--slate)" }}>{wins}W / {losses}L</div>
              </div>
              <div className="rounded-md p-2 text-center" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
                <div className="pd-label mb-0.5" style={{ fontSize: 9 }}>Avg R:R</div>
                <div className="pd-mono text-lg" style={{ color: "var(--brass)" }}>{avgRR}</div>
              </div>
              <div className="rounded-md p-2 text-center" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
                <div className="pd-label mb-0.5" style={{ fontSize: 9 }}>Ratings</div>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  {["green", "amber", "red"].map((r) => (
                    <span key={r} className="pd-mono text-xs" style={{ color: RATING_META[r].color }}>{ratings[r]}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {curve.length > 1 && (
            <div className="mb-4">
              <div className="pd-label mb-1.5">Equity Curve</div>
              <EquityCurve data={curve} height={90} gradientId="pdAreaDrawer" showAxes={false} tooltipFmt={(v) => [`$${v}`, "P&L"]} />
            </div>
          )}

          {accTrades.length > 0 && (
            <div className="mb-4">
              <div className="pd-label mb-1.5">Recent Trades ({enrichedTrades.length})</div>
              {enrichedTrades.slice(0, 5).map((t) => (
                <div key={t.id} className="pd-row rounded-md p-1.5 mb-1 text-xs flex items-center justify-between" style={{ border: "1px solid var(--line)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="pd-mono" style={{
                      fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 3,
                      color: OUTCOME_META[t.outcome].color, background: OUTCOME_META[t.outcome].bg,
                    }}>{t.outcome}</span>
                    <span className="pd-mono">{t.symbol}</span>
                    <span style={{ color: "var(--slate)" }}>{t.side}</span>
                  </div>
                  <span className="pd-mono" style={{ color: t.pnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{money(t.pnl)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pt-4 mt-4 flex flex-col gap-2" style={{ borderTop: "1px solid var(--line)" }}>
          {canProceed && (
            <button
              className="pd-btn w-full flex items-center justify-center gap-2"
              style={{ background: "var(--sage)", color: "var(--ink)", borderColor: "var(--sage)" }}
              onClick={() => setShowProceedConfirm(true)}
            >
              <ArrowRight size={14} /> Pass to {nextDest}
            </button>
          )}
          {isBreached && (
            <button
              className="pd-btn w-full flex items-center justify-center gap-2"
              style={{ borderColor: "var(--brick-dim)", color: "var(--brick)" }}
              onClick={() => setShowBreachConfirm(true)}
            >
              <AlertTriangle size={14} /> Mark as Breached
            </button>
          )}
          <button
            className="pd-btn pd-btn-primary w-full flex items-center justify-center gap-2"
            onClick={() => { onLogTrade(account.id); onClose(); }}
          >
            <PenLine size={14} /> Log a trade
          </button>
          <button
            className="pd-btn w-full flex items-center justify-center gap-2"
            onClick={() => { onViewDetails(account.id); onClose(); }}
          >
            View full details <ChevronRight size={14} />
          </button>
          {account.archived ? (
            <button
              className="pd-btn w-full flex items-center justify-center gap-2"
              style={{ borderColor: "var(--sage)", color: "var(--sage)" }}
              onClick={toggleArchive}
              disabled={busy}
            >
              <ArchiveRestore size={14} /> Unarchive
            </button>
          ) : (
            <button
              className="pd-btn w-full flex items-center justify-center gap-2"
              onClick={toggleArchive}
              disabled={busy}
            >
              <Archive size={14} /> Archive
            </button>
          )}
        </div>
      </div>

      {showProceedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,11,15,0.7)" }} onClick={() => setShowProceedConfirm(false)}>
          <div className="pd-panel p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="pd-display text-xl mb-2">Pass to {nextDest}</div>
            <div className="text-sm mb-5" style={{ color: "var(--sand-dim)" }}>
              Mark this account as passed and create a new {nextDest} account?
            </div>
            <div className="flex justify-end gap-2">
              <button className="pd-btn" onClick={() => setShowProceedConfirm(false)}>Cancel</button>
              <button className="pd-btn" style={{ background: "var(--sage)", color: "var(--ink)", borderColor: "var(--sage)" }} onClick={handleProceed} disabled={busy}>{busy ? "Working…" : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {showBreachConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,11,15,0.7)" }} onClick={() => setShowBreachConfirm(false)}>
          <div className="pd-panel p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="pd-display text-xl mb-2">Mark as Breached</div>
            <div className="text-sm mb-5" style={{ color: "var(--sand-dim)" }}>
              Mark this account as breached? This cannot be undone.
            </div>
            <div className="flex justify-end gap-2">
              <button className="pd-btn" onClick={() => setShowBreachConfirm(false)}>Cancel</button>
              <button className="pd-btn" style={{ background: "var(--brick)", color: "white", borderColor: "var(--brick)" }} onClick={handleBreach} disabled={busy}>{busy ? "Working…" : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
