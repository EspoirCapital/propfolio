import { useState } from "react";
import { ArrowLeft, ExternalLink, Award, Pencil, X, ArrowRight, AlertTriangle, PenLine, Archive, ArchiveRestore } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useApp } from "../context";
import { computeOutcome, money, formatDisplay, formatDateUK, getAccountLabel, OUTCOME_META, RATING_META, nextStatus, nextStatusLabel, friendlyError } from "../utils";
import { StatusPill } from "../components/StatusPill";
import { KpiTile } from "../components/KpiTile";
import { ProgressionStepper } from "../components/ProgressionStepper";
import { CredentialReveal } from "../components/CredentialReveal";
import { EquityCurve } from "../components/EquityCurve";
import { TradeCalendar } from "../components/TradeCalendar";
import { ConfirmModal } from "../components/ConfirmModal";
import { ErrorBanner } from "../components/ErrorBanner";
import { AccountPerformanceSummary } from "../components/AccountPerformanceSummary";

export function AccountDetailPage({ accountId, derived, trades, payouts, certificates, settings, templates, updateAccount, onBack, onEdit, onDelete, archiveAccount, unarchiveAccount }) {
  const { proceed: proceedFn, breach: breachFn } = useApp();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);
  const [showProceedConfirm, setShowProceedConfirm] = useState(false);
  const [showBreachConfirm, setShowBreachConfirm] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const account = derived.accounts.find((a) => a.id === accountId);
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
  }).sort((a, b) => (a.date < b.date ? 1 : -1));

  const wins = enrichedTrades.filter((t) => t.outcome === "W").length;
  const losses = enrichedTrades.filter((t) => t.outcome === "L").length;
  const decisionTrades = wins + losses;
  const winRate = decisionTrades ? Math.round((wins / decisionTrades) * 100) : 0;
  const avgRR = decisionTrades
    ? (enrichedTrades.filter((t) => t.outcome !== "BE" && t.risk > 0).reduce((s, t) => s + (t.pnl / t.risk), 0) / decisionTrades).toFixed(1)
    : "—";
  const ratings = { green: 0, amber: 0, red: 0 };
  enrichedTrades.forEach((t) => { if (ratings[t.rating] !== undefined) ratings[t.rating]++; });

  const mfeTrades = enrichedTrades.filter((t) => t.mfeR != null);
  const maeTrades = enrichedTrades.filter((t) => t.maeR != null);
  const avgMfe = mfeTrades.length ? (mfeTrades.reduce((s, t) => s + t.mfeR, 0) / mfeTrades.length).toFixed(2) : "—";
  const avgMae = maeTrades.length ? (maeTrades.reduce((s, t) => s + t.maeR, 0) / maeTrades.length).toFixed(2) : "—";
  const mfeR = parseFloat(avgMfe);
  const mfeWithRealized = mfeTrades.filter((t) => t.risk > 0);
  const avgRealizedOfMfe = mfeWithRealized.length
    ? mfeWithRealized.reduce((s, t) => s + (t.pnl / t.risk), 0) / mfeWithRealized.length
    : null;
  const capture = avgMfe !== "—" && avgRealizedOfMfe !== null && mfeR > 0
    ? `${Math.round((avgRealizedOfMfe / mfeR) * 100)}%` : "—";
  const giveback = avgMfe !== "—" && avgRealizedOfMfe !== null
    ? (mfeR - avgRealizedOfMfe).toFixed(2) : "—";

  let running = 0;
  const sortedTrades = enrichedTrades.slice().reverse();
  const refundEvent = account.refund > 0 && account.refundDate
    ? [{ date: account.refundDate, pnl: account.refund, isRefund: true }] : [];
  const merged = [...sortedTrades, ...refundEvent].sort((a, b) => (a.date > b.date ? 1 : -1));
  const curve = merged.map((t) => {
    running += t.pnl;
    return { date: formatDateUK(t.date), pnl: Math.round(running) };
  });

  const canProceed = (account.targetPct ?? 0) >= 100 && nextStatus(account.status, phaseCount);
  const nextDest = nextStatusLabel(account.status, phaseCount);

  const totalPnl = enrichedTrades.reduce((s, t) => s + t.pnl, 0);
  const maxLossBreached = account.maxLoss > 0 && totalPnl <= -account.maxLoss;
  const dailyPnlByDate = {};
  enrichedTrades.forEach((t) => { dailyPnlByDate[t.date] = (dailyPnlByDate[t.date] || 0) + t.pnl; });
  const dailyLossBreached = account.dailyLoss > 0 && Object.values(dailyPnlByDate).some((d) => d <= -account.dailyLoss);
  const isBreached = (maxLossBreached || dailyLossBreached) && account.status !== "breached" && account.status !== "passed";

  async function handleProceed() {
    setBusy(true);
    setActionError("");
    try {
      const newId = await proceedFn({ id: account.id });
      navigate({ to: "/accounts/$accountId", params: { accountId: newId } });
    } catch (err) {
      setShowProceedConfirm(false);
      setActionError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleBreach() {
    setBusy(true);
    setActionError("");
    try {
      await breachFn({ id: account.id });
      onBack();
    } catch (err) {
      setShowBreachConfirm(false);
      setActionError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setActionError("");
    try {
      await onDelete(account.id);
      onBack();
    } catch (err) {
      setShowConfirm(false);
      setActionError(friendlyError(err));
    } finally {
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
    } catch (err) {
      setActionError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={onBack} className="pd-btn flex items-center gap-2 mb-5">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="pd-eyebrow">{getAccountLabel(account)}</span>
            <StatusPill status={account.status} />
          </div>
          <div className="pd-display text-5xl" style={{ fontWeight: 700 }}>${(account.size / 1000).toFixed(0)}K</div>
          <div className="text-sm mt-1" style={{ color: "var(--sand-dim)" }}>
            Created {formatDateUK(account.creationDate)}
            <span className="ml-3">Terminated {account.terminationDate ? formatDateUK(account.terminationDate) : "—"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canProceed && (
            <button className="pd-btn flex items-center gap-1.5" style={{ background: "var(--sage)", color: "var(--ink)", borderColor: "var(--sage)" }} onClick={() => setShowProceedConfirm(true)}>
              <ArrowRight size={13} /> Pass to {nextDest}
            </button>
          )}
          {isBreached && (
            <button className="pd-btn flex items-center gap-1.5" style={{ borderColor: "var(--brick-dim)", color: "var(--brick)" }} onClick={() => setShowBreachConfirm(true)}>
              <AlertTriangle size={13} /> Breach
            </button>
          )}
          <button className="pd-btn flex items-center gap-1.5" onClick={() => onEdit(account.id)}><Pencil size={13} /> Edit</button>
          {account.archived ? (
            <button className="pd-btn flex items-center gap-1.5" style={{ borderColor: "var(--sage)", color: "var(--sage)" }} onClick={toggleArchive} disabled={busy}><ArchiveRestore size={13} /> Unarchive</button>
          ) : (
            <button className="pd-btn flex items-center gap-1.5" onClick={toggleArchive} disabled={busy}><Archive size={13} /> Archive</button>
          )}
          <button className="pd-btn flex items-center gap-1.5" style={{ borderColor: "var(--brick-dim)", color: "var(--brick)" }} onClick={() => setShowConfirm(true)}><X size={13} /> Delete</button>
        </div>
      </div>

      {actionError && <div className="mb-4"><ErrorBanner message={actionError} onDismiss={() => setActionError("")} /></div>}

      <ProgressionStepper phaseCount={phaseCount} status={account.status} target={template?.target} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
          {accTrades.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiTile label="Total P&L" value={money(totalPnl)} accent={totalPnl >= 0 ? "var(--sage)" : "var(--brick)"} />
              <KpiTile label="Win Rate" value={`${winRate}%`} accent="var(--sage)" sub={`${wins}W / ${losses}L`} />
              <KpiTile label="Avg R:R" value={avgRR} accent="var(--brass)" />
              <KpiTile label="Ratings" value={`${ratings.green}·${ratings.amber}·${ratings.red}`} accent="var(--sand)" sub="green · amber · red" />
              <KpiTile label="Avg MFE" value={avgMfe} accent="var(--sage)" sub="R" />
              <KpiTile label="Avg MAE" value={avgMae} accent="var(--brick)" sub="R" />
              <KpiTile label="Capture" value={capture} accent="var(--brass)" sub={`giveback ${giveback}R`} />
            </div>
          )}

          {accTrades.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div>
                <div className="pd-label mb-2">Trade Calendar</div>
                <TradeCalendar trades={accTrades} beThreshold={settings.beThreshold} />
              </div>
              {curve.length > 1 && (
                <div className="flex flex-col">
                  <div className="pd-label mb-2">Equity Curve</div>
                  <div className="flex-1">
                    <EquityCurve data={curve} gradientId="pdAreaDetail" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="pd-label">Journaled Trades ({enrichedTrades.length})</div>
              <Link to="/journal" search={{ account: account.id }} className="pd-btn flex items-center gap-1.5 no-underline">
                <PenLine size={12} /> Log trade
              </Link>
            </div>
            {enrichedTrades.length === 0 ? (
              <div className="rounded-lg p-8 text-center text-sm" style={{ border: "1px dashed var(--line)", color: "var(--slate)" }}>
                No trades logged yet for this account.
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
                <div className="grid pd-label items-center" style={{ gridTemplateColumns: "30px 90px 80px 38px 50px 80px 80px 58px 58px 36px 70px 100px 1fr 28px", gap: "0 12px", background: "var(--ledger)", borderBottom: "1px solid var(--line)", padding: "8px 14px" }}>
                  <span></span><span>Date</span><span>Symbol</span><span>Side</span><span>Lots</span><span>Risk</span><span>P&L</span><span>MFE</span><span>MAE</span><span>Out</span><span>Session</span><span>Tag</span><span>Notes</span><span></span>
                </div>
                {enrichedTrades.map((t) => (
                  <Link key={t.id} to="/journal" search={{ account: account.id }}
                    className="pd-row grid items-center text-sm pd-mono no-underline"
                    style={{ gridTemplateColumns: "30px 90px 80px 38px 50px 80px 80px 58px 58px 36px 70px 100px 1fr 28px", gap: "0 12px", padding: "8px 14px", borderBottom: "1px solid var(--line)", color: "var(--sand)", textDecoration: "none" }}>
                    <span className="flex items-center justify-center"><span style={{ width: 10, height: 10, borderRadius: "50%", background: RATING_META[t.rating]?.color || "var(--slate)", flexShrink: 0 }} /></span>
                    <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{formatDateUK(t.date)}</span>
                    <span className="whitespace-nowrap">{t.symbol}</span>
                    <span className="whitespace-nowrap" style={{ color: t.side === "Long" ? "var(--sage)" : "var(--brick)" }}>{t.side.slice(0, 1)}</span>
                    <span className="whitespace-nowrap">{t.lots}</span>
                    <span className="whitespace-nowrap" style={{ color: "var(--sand-dim)" }}>{formatDisplay(t.risk, settings.displayFormat, account.size, t.risk)}</span>
                    <span className="whitespace-nowrap" style={{ color: t.pnl >= 0 ? "var(--sage)" : "var(--brick)" }}>{formatDisplay(t.pnl, settings.displayFormat, account.size, t.risk)}</span>
                    <span className="whitespace-nowrap" style={{ color: t.mfeR != null ? "var(--sage)" : "var(--slate)" }}>{t.mfeR != null ? `${t.mfeR}R` : "—"}</span>
                    <span className="whitespace-nowrap" style={{ color: t.maeR != null ? "var(--brick)" : "var(--slate)" }}>{t.maeR != null ? `${t.maeR}R` : "—"}</span>
                    <span className="whitespace-nowrap">
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3, color: OUTCOME_META[t.outcome].color, background: OUTCOME_META[t.outcome].bg }}>{t.outcome}</span>
                    </span>
                    <span className="whitespace-nowrap" style={{ color: "var(--slate)" }}>{t.session}</span>
                    <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--sand-dim)" }} title={t.tag}>{t.tag}</span>
                    <span className="truncate min-w-0" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--sand-dim)" }} title={t.notes}>{t.notes || "—"}</span>
                    {t.tvLink ? <span className="flex items-center justify-center" style={{ color: "var(--slate)" }}><ExternalLink size={12} /></span> : <span />}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
            <div className="pd-label mb-3">Account Rules</div>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Drawdown", value: `${account.drawdown} · max ${account.maxLoss}` },
                { label: "Platform", value: account.platform },
                { label: "Challenge Fee", value: money(challengeFee) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="pd-label">{item.label}</span>
                  <span className="pd-mono text-sm" style={{ color: "var(--sand-dim)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
            <div className="pd-label mb-3">Platform Credentials</div>
            <CredentialReveal
              fields={[
                { key: "platformLogin", label: "Login ID", value: account.platformLogin },
                { key: "platformPassword", label: "Password", value: account.platformPassword },
                { key: "platformInvestorPassword", label: "Investor", value: account.platformInvestorPassword },
              ]}
              link={account.platformLink}
            />
          </div>

          <AccountPerformanceSummary trades={accTrades} accountSize={account.size} refund={account.refund} refundDate={account.refundDate} />

          <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="pd-label">Certificates ({accCerts.length})</div>
              <Link to="/certificates" search={{ account: account.id }} className="pd-btn flex items-center gap-1.5 no-underline">
                <Award size={12} /> Add certificate
              </Link>
            </div>
            {accCerts.length === 0 ? (
              <div className="text-xs" style={{ color: "var(--slate)" }}>None linked yet.</div>
            ) : accCerts.map((c) => (
              <a key={c.id} href={c.link} target="_blank" rel="noreferrer" className="flex items-center justify-between text-xs py-1.5 no-underline" style={{ borderTop: "1px solid var(--line-soft)", color: "var(--sand)", textDecoration: "none" }}>
                <span className="flex items-center gap-1.5 truncate min-w-0"><Award size={11} style={{ color: "var(--brass)", flexShrink: 0 }} /><span className="truncate">{c.label}</span></span>
                <ExternalLink size={11} style={{ color: "var(--slate)", flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </div>
      </div>
      {showConfirm && (
        <ConfirmModal
          title="Delete account"
          message="Delete this account? This cannot be undone. Trades, payouts, and certificates linked to it will remain orphaned."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          confirmLabel={busy ? "Working…" : "Delete"}
        />
      )}
      {showProceedConfirm && (
        <ConfirmModal
          title={`Pass to ${nextDest}`}
          message={`Mark this account as passed and create a new ${nextDest} account?`}
          onConfirm={handleProceed}
          onCancel={() => setShowProceedConfirm(false)}
          confirmLabel={busy ? "Working…" : "Confirm"}
          confirmStyle={{ background: "var(--sage)", color: "var(--ink)", borderColor: "var(--sage)" }}
        />
      )}
      {showBreachConfirm && (
        <ConfirmModal
          title="Mark as Breached"
          message="Mark this account as breached? This cannot be undone."
          onConfirm={handleBreach}
          onCancel={() => setShowBreachConfirm(false)}
          confirmLabel={busy ? "Working…" : "Confirm"}
          confirmStyle={{ background: "var(--brick)", color: "white", borderColor: "var(--brick)" }}
        />
      )}
    </div>
  );
}
