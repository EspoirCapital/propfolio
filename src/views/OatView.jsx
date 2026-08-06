import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Check, AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import { money, getAccountLabel, formatDateUK } from "../utils";
import { KpiTile } from "../components/KpiTile";

const ROLE_COLOR = {
  active: { color: "var(--brass)", bg: "rgba(206,159,82,0.12)" },
  reserve: { color: "var(--slate)", bg: "rgba(137,146,163,0.12)" },
  maintenance: { color: "var(--sage)", bg: "rgba(111,176,139,0.12)" },
  drawdown: { color: "var(--brick)", bg: "rgba(193,89,75,0.14)" },
  done: { color: "var(--sage)", bg: "rgba(111,176,139,0.12)" },
  next: { color: "var(--slate)", bg: "rgba(137,146,163,0.12)" },
  manual: { color: "var(--brass)", bg: "rgba(206,159,82,0.10)" },
};

function Tag({ kind, children }) {
  const c = ROLE_COLOR[kind] || ROLE_COLOR.reserve;
  return (
    <span className="pd-mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: c.color, background: c.bg, padding: "2px 6px", borderRadius: 4 }}>
      {children}
    </span>
  );
}

function AccountList({ title, subtitle, accounts, drawdownIds, role, onDrop, draggingId, onDraggingChange }) {
  const [dragOver, setDragOver] = useState(false);
  const isOverlaid = onDrop != null;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="pd-label">{title}{subtitle ? ` · ${subtitle}` : ""}</div>
        <span className="pd-mono text-xs" style={{ color: "var(--slate)" }}>{accounts.length}</span>
      </div>
      <div
        onDragOver={(e) => { if (isOverlaid) { e.preventDefault(); setDragOver(true); } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={isOverlaid ? (e) => { setDragOver(false); onDrop(e); } : undefined}
        data-oat-drop={role}
        style={{
          minHeight: 120,
          borderRadius: 8,
          border: "1px dashed var(--line)",
          borderColor: dragOver ? "var(--brass)" : "var(--line)",
          background: dragOver ? "rgba(206,159,82,0.06)" : "transparent",
          padding: 6,
          transition: "border-color .15s ease, background .15s ease",
          opacity: draggingId && !dragOver ? 0.6 : 1,
        }}
      >
        {accounts.length === 0 ? (
          <div className="flex items-center justify-center min-h-[90px] text-center text-sm px-3" style={{ color: dragOver ? "var(--brass)" : "var(--slate)" }}>
            {isOverlaid ? (dragOver ? "Release to drop here" : "None — drop an account here") : "None yet"}
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)", background: "var(--ledger)", padding: 2 }}>
            {accounts.map((acc) => {
              const inDD = drawdownIds.has(acc.id);
              const maintenance = acc.received > 0;
              const nextMove = maintenance
                ? `payout held · ${money(acc.received)} secured`
                : acc.tradePnl < 0
                ? "in drawdown — hold, no batch-hopping"
                : acc.payoutGap > 0
                ? `≈ ${money(acc.payoutGap)} more to lock a payout`
                : "at payout threshold — lock it in";
              const dragDisabled = maintenance || !isOverlaid;
              const buildGhost = (e) => {
                const source = e.currentTarget;
                const ghost = source.cloneNode(true);
                ghost.style.cssText = [
                  "boxShadow:0 14px 30px -10px rgba(0,0,0,.6)",
                  "border:1px solid var(--brass)",
                  "borderRadius:8px",
                  "transform:rotate(-1.5deg)",
                  "background:var(--ink-2)",
                  "pointerEvents:none",
                ].join(";");
                ghost.style.position = "absolute";
                ghost.style.top = "-1000px";
                ghost.style.left = "0";
                ghost.style.opacity = "0.96";
                document.body.appendChild(ghost);
                const r = source.getBoundingClientRect();
                e.dataTransfer.setDragImage(ghost, Math.min(40, r.width / 2), Math.min(16, r.height / 2));
                window.setTimeout(() => ghost.remove(), 0);
              };
              return (
                <div
                  key={acc.id}
                  draggable={!dragDisabled}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/oat", acc.id);
                    e.dataTransfer.effectAllowed = "move";
                    onDraggingChange?.(acc.id);
                    buildGhost(e);
                  }}
                  onDragEnd={() => onDraggingChange?.(null)}
                  style={{
                    opacity: draggingId === acc.id ? 0.35 : 1,
                    borderRadius: 6,
                    marginBottom: 2,
                    border: "1px solid transparent",
                    borderColor: acc.oatBatch ? "rgba(206,159,82,0.22)" : "transparent",
                    background: acc.oatBatch ? "rgba(206,159,82,0.05)" : "transparent",
                    cursor: dragDisabled ? "default" : draggingId === acc.id ? "grabbing" : "grab",
                  }}
                >
                  <Link
                    to="/accounts/$accountId"
                    params={{ accountId: acc.id }}
                    className="pd-row flex items-center gap-3 px-3 py-2.5 no-underline"
                    style={{ color: "var(--sand)", textDecoration: "none" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">{getAccountLabel(acc)}{acc.oatBatch && <span className="ml-2"><Tag kind="manual">pinned</Tag></span>}</div>
                      <div className="pd-mono text-xs mt-0.5 truncate" style={{ color: acc.tradePnl < 0 && !maintenance ? "var(--brick)" : "var(--slate)" }}>
                        {nextMove}
                        {maintenance && (
                          <span className="ml-2"><Tag kind="maintenance">maintenance</Tag></span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="pd-mono text-sm" style={{ color: acc.tradePnl >= 0 ? "var(--sage)" : "var(--brick)" }}>
                        {acc.tradePnl > 0 ? "+" : ""}{money(acc.tradePnl)}
                      </div>
                      {inDD && (
                        <div className="mt-1"><Tag kind="drawdown">drawdown</Tag></div>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function GuideChecklist({ oat }) {
  const checks = [
    { label: "Minimum pool of 3 funded accounts", done: oat.ready },
    { label: "30/70 split in place", done: oat.poolCount >= 3 },
    { label: "≤1% risk per trade on funded accounts", done: oat.outstandingViolations === 0 },
    { label: "At least one payout secured", done: oat.locked.length > 0 },
    { label: "Active batch not in drawdown", done: oat.active.length > 0 && !oat.drawdown },
    { label: "Next-rotation account standing by", done: !!oat.nextUp },
  ];
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)", flex: 1 }}>
      {checks.map((c, i) => (
        <div key={c.label} className="flex items-center gap-2.5 px-4 py-2" style={{ borderBottom: i < checks.length - 1 ? "1px solid var(--line-soft)" : "none", padding: "8px 14px" }}>
          <span style={{ color: c.done ? "var(--sage)" : "var(--slate)", display: "flex" }}>
            {c.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
          </span>
          <span className="text-sm" style={{ color: c.done ? "var(--sand)" : "var(--sand-dim)" }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

const EMPTY_OAT = {
  pool: [], active: [], reserve: [], locked: [], riskViolations: [],
  fullyLocked: false, nextUp: null, drawdown: null,
  poolCount: 0, activeCount: 0, ready: false, minPool: 3, activePct: 30,
  payoutsSecured: 0, tradableCount: 0, riskPct: 1, outstandingViolations: 0,
  ladder: { stage: 0, lockedCount: 0 },
  payoutCycle: { perAccount: 500, perCycle: 500, assumed: true },
  payoutFloor: 500, monthlyGoal: 10000,
};

function ScalingLadder({ oat }) {
  const poolCount = oat.poolCount;
  const lockedCount = oat.ladder.lockedCount;
  const payoutFloor = money(oat.payoutFloor);

  const stages = [
    {
      n: 1,
      title: "Single-account lock-in",
      desc: `Start with one funded account and trade it conservatively until its first payout locks (${payoutFloor} = 1% of a $50k account).`,
      tag: poolCount >= 2 ? "done" : poolCount === 1 ? "active" : "next",
    },
    {
      n: 2,
      title: "Two-account rotation",
      desc: "Fund the second challenge. Rotate: lock in Account 1, switch to Account 2, lock that too. Two locked payouts build surplus capital.",
      tag: poolCount >= 3 ? "done" : poolCount === 2 ? "active" : "next",
    },
    {
      n: 3,
      title: "Three-account threshold",
      desc: "Reinvest the surplus into a third challenge. At 3 funded accounts the full architecture unlocks: 1 active (30%), 2 in reserve (70%).",
      tag: poolCount >= 3 ? "active" : "next",
    },
    {
      n: "4+",
      title: "Full batch scaling",
      desc: "Payouts keep funding new challenges. The pool scales in 30% slots: 6 accounts = 2 active / 4 reserve, 9 accounts = 3 active / 6 reserve.",
      tag: poolCount >= 3 ? "active" : "next",
    },
  ];

  let status;
  if (poolCount >= 3) {
    status = { tone: "var(--sage)", lead: "Full 30/70 architecture live", rest: ` - ${oat.active.length} active, ${oat.reserve.length} reserve. Payouts keep funding new challenges as the pool scales.` };
  } else if (poolCount === 2 && lockedCount >= 2) {
    status = { tone: "var(--sage)", lead: "Both accounts locked", rest: " - surplus secured. Fund the third challenge." };
  } else if (poolCount === 2 && lockedCount === 1) {
    status = { tone: "var(--brass)", lead: "Account 1 locked", rest: " - rotate to Account 2 and lock it in." };
  } else if (poolCount === 2) {
    status = { tone: "var(--brass)", lead: "Two accounts funded", rest: " - trade Account 1 to lock-in, then rotate to Account 2." };
  } else if (poolCount === 1 && lockedCount >= 1) {
    status = { tone: "var(--sage)", lead: "First payout locked", rest: " - the base is now risk-free. Stop trading it and fund challenge #2." };
  } else {
    status = { tone: "var(--brass)", lead: "One funded account", rest: ` - trade it conservatively until the first payout locks (${payoutFloor} = 1% of a $50k account).` };
  }

  return (
    <div>
      <div className="flex items-center gap-2" style={{ padding: "0 10px" }}>
        {stages.map((s, i) => {
          const bg = s.tag === "done" ? "var(--sage)" : s.tag === "active" ? "var(--brass)" : "transparent";
          const fg = s.tag === "done" || s.tag === "active" ? "var(--ink)" : "var(--sand-dim)";
          return (
            <Fragment key={`${s.n}-${i}`}>
              {i > 0 && (
                <div className="flex-1" style={{ height: 2, borderRadius: 999, background: (i === 1 ? poolCount >= 2 : poolCount >= 3) ? "var(--sage)" : "var(--line)" }} />
              )}
              <div
                className="pd-mono flex items-center justify-center"
                title={`Stage ${s.n} - ${s.title}`}
                style={{ width: 30, height: 30, borderRadius: "50%", background: bg, color: fg, border: s.tag === "next" ? "1px solid var(--line)" : "none", flexShrink: 0, fontSize: s.tag === "done" ? undefined : 11, fontWeight: 600 }}
              >
                {s.tag === "done" ? <Check size={13} strokeWidth={2.5} /> : s.n}
              </div>
            </Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: "var(--sand-dim)", lineHeight: 1.55, maxWidth: 720 }}>
          <strong style={{ color: status.tone }}>{status.lead}</strong>
          {status.rest}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        {stages.map((s) => (
          <div key={s.n} className="rounded-lg p-4" style={{ background: "var(--ledger-raised)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="pd-mono text-xs" style={{ color: "var(--slate)" }}>stage {s.n === "4+" ? "4+" : s.n}</span>
              <Tag kind={s.tag}>{s.tag}</Tag>
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: "var(--sand)" }}>{s.title}</div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--slate)" }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OatView({ derived, setBatch, onAcknowledge }) {
  const oat = derived.oat || EMPTY_OAT;
  const [draggingId, setDraggingId] = useState(null);
  const activeShare = oat.poolCount ? Math.round((oat.active.length / oat.poolCount) * 100) : 0;
  const reserveShare = 100 - activeShare;
  const drawdownIds = oat.drawdown ? new Set([oat.drawdown.id]) : new Set();

  const pc = oat.payoutCycle;
  const cycleCount = Math.max(1, oat.active.length);
  const accountWord = cycleCount === 1 ? "account" : "accounts";
  const payoutCycleText = pc.assumed
    ? `${cycleCount} ${accountWord} × ~${money(pc.perAccount)} ≈ ${money(pc.perCycle)} per payout cycle (1% of a $50k account), stacked safely.`
    : `${cycleCount} ${accountWord} × ${money(pc.perAccount)} ≈ ${money(pc.perCycle)} per payout cycle (from your locked payouts), stacked safely.`;

  const poolFees = oat.pool.reduce((s, a) => s + a.cost, 0);
  const batchSize = Math.max(1, oat.poolCount || 1);
  const blowFees = poolFees * Math.max(1, batchSize);
  const nextPayout = batchSize * oat.payoutFloor;
  const aggressiveLines = [
    `Blown batch (${batchSize} account${batchSize === 1 ? "" : "s"}): -${money(blowFees)} in fees`,
    `Next batch payout (${batchSize} × ${money(oat.payoutFloor)}): +${money(nextPayout)}`,
    `Net: ${nextPayout > blowFees ? "+" : ""}${money(nextPayout - blowFees)} — asymmetric by design`,
  ];

  const assignRole = (e, role) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/oat");
    if (!id || !setBatch) return;
    setDraggingId(null);
    setBatch(id, role);
  };

  const rotate = (dir) => {
    if (!setBatch || oat.poolCount < 2) return;
    if (dir === "next") {
      const reserveTradable = oat.reserve.filter((a) => a.received <= 0);
      if (!oat.active.length || !reserveTradable.length) return;
      setBatch(oat.active[0].id, "reserve");
      setBatch(reserveTradable[0].id, "active");
    } else {
      const reserveCurrent = oat.reserve.filter((a) => a.received <= 0);
      if (!oat.active.length || !reserveCurrent.length) return;
      setBatch(oat.active[oat.active.length - 1].id, "reserve");
      setBatch(reserveCurrent[reserveCurrent.length - 1].id, "active");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm" style={{ color: "var(--slate)", maxWidth: 660, lineHeight: 1.65 }}>
        One At a Time decouples portfolio growth from market exposure. A small active batch is traded at ~1% risk until a
        payout locks in — roughly 1% of each funded size — then it goes to maintenance and the next batch takes over.
        Reserve capital stays untouched.
      </p>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          label="Funded Pool"
          value={`${oat.poolCount} / ${oat.minPool}`}
          accent={oat.ready ? "var(--sage)" : "var(--brass)"}
          sub={oat.ready ? "minimum met" : (
            <Link to="/accounts" className="no-underline" style={{ color: "var(--brass)", textDecoration: "none" }}>pass a challenge to grow it</Link>
          )}
        />
        <KpiTile label="Active Batch" value={oat.poolCount ? oat.active.length : "—"} accent="var(--brass)" sub={oat.poolCount ? `${oat.activeCount} slot${oat.activeCount === 1 ? "" : "s"} · trading now` : "no funded accounts"} />
        <KpiTile label="Reserve" value={oat.reserve.length} accent="var(--slate)" sub={oat.locked.length ? `${oat.locked.length} locked · rest idle` : "idle backup"} />
        <KpiTile
          label="Payouts Secured"
          animate={oat.payoutsSecured}
          fmt={money}
          accent="var(--sage)"
          sub={`${oat.locked.length} account${oat.locked.length === 1 ? "" : "s"} locked in`}
        />
      </div>

      {/* Initial scaling ladder */}
      {oat.poolCount > 0 && (
        <div className="rounded-lg" style={{ background: "var(--ledger)", border: "1px solid var(--line)", padding: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="pd-label">Scaling ladder</div>
            <span className="pd-mono text-xs" style={{ color: "var(--slate)" }}>
              {oat.poolCount >= 3 ? "ladder complete" : `stage ${Math.min(3, oat.poolCount)} of 3`}
            </span>
          </div>
          <ScalingLadder oat={oat} />
        </div>
      )}

      {/* Allocation */}
      <div className="rounded-lg" style={{ background: "var(--ledger)", border: "1px solid var(--line)", padding: 16 }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="pd-label">Allocation</div>
          <div className="flex items-center gap-3">
            {oat.poolCount > 0 && (
              <>
                <div className="flex items-center gap-1.5">
                  <button
                    className="pd-btn-icon"
                    onClick={() => rotate("prev")}
                    disabled={!setBatch || oat.poolCount < 2}
                    title="Previous batch — swap the newest active account with the newest reserve"
                    aria-label="Previous batch"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button
                    className="pd-btn-icon"
                    onClick={() => rotate("next")}
                    disabled={!setBatch || oat.poolCount < 2}
                    title="Next batch — oldest active account to reserve, oldest reserve into the active slot"
                    aria-label="Next batch"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
                <div className="pd-mono text-xs" style={{ color: "var(--slate)" }}>{activeShare}% / {reserveShare}%</div>
              </>
            )}
          </div>
        </div>
        {oat.poolCount === 0 ? (
          <Link to="/accounts" className="block rounded-lg p-8 text-center text-sm no-underline" style={{ border: "1px dashed var(--line)", color: "var(--slate)", textDecoration: "none" }}>
            No funded accounts yet. <span style={{ color: "var(--brass)" }}>Pass a challenge to build the pool.</span>
          </Link>
        ) : (
          <>
            <div className="flex h-2 rounded overflow-hidden" style={{ gap: 2, marginBottom: 16 }}>
              <div style={{ width: `${activeShare}%`, background: "var(--brass)", minWidth: activeShare > 0 ? 8 : 0, flexShrink: 0 }} />
              <div style={{ width: `${reserveShare}%`, background: "var(--line)" }} />
            </div>
            {oat.poolCount < 3 && (
              <div className="text-xs mb-4" style={{ color: "var(--slate)" }}>
                The 30/70 split fully engages at 3 funded accounts. You are in the build-up ladder above.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <AccountList
                title="Active"
                subtitle="trading now"
                accounts={oat.active}
                drawdownIds={drawdownIds}
                role="active"
                onDrop={(e) => assignRole(e, "active")}
                draggingId={draggingId}
                onDraggingChange={setDraggingId}
              />
              <AccountList
                title="Reserve"
                subtitle="idle"
                accounts={oat.reserve}
                drawdownIds={drawdownIds}
                role="reserve"
                onDrop={(e) => assignRole(e, "reserve")}
                draggingId={draggingId}
                onDraggingChange={setDraggingId}
              />
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 text-xs" style={{ color: "var(--sand-dim)", borderTop: "1px solid var(--line-soft)" }}>
              Drag accounts between batches, or use the arrows to rotate. Pinned accounts keep their batch until dragged back; unassigned ones follow the automatic rotation.
            </div>
          </>
        )}
      </div>

      {/* Rotation + drawdown state */}
      {oat.poolCount > 0 && (
        <div className="rounded-lg" style={{ background: "var(--ledger)", border: "1px solid var(--line)", padding: 16 }}>
          <div className="pd-label mb-2">Rotation</div>
          {oat.fullyLocked ? (
            <span className="text-sm" style={{ color: "var(--sand-dim)" }}>
              Every pool account has locked in a payout. Expand the pool or start a fresh cycle once the next reserve slot is ready.
            </span>
          ) : oat.drawdown ? (
            <div className="flex items-start gap-3 text-sm">
              <span style={{ color: "var(--brick)", marginTop: 1 }}><AlertTriangle size={16} /></span>
              <span style={{ color: "var(--sand-dim)" }}>
                <strong style={{ color: "var(--brick)" }}>Protocol 1</strong> · the active batch is in drawdown
                ({money(oat.drawdown.tradePnl)} on {getAccountLabel(oat.drawdown)}). Stay on this batch until it recovers
                into profit or blows. Do not batch-hop.
              </span>
            </div>
          ) : oat.nextUp ? (
            <div className="flex items-start gap-3 text-sm">
              <span style={{ color: "var(--brass)", marginTop: 1 }}><CheckCircle2 size={16} /></span>
              <span style={{ color: "var(--sand-dim)" }}>
                Active batch in progress. When it locks in a payout,{" "}
                <strong style={{ color: "var(--sand)" }}>{getAccountLabel(oat.nextUp)}</strong> rotates into the active slot —
                repeat at the ~{oat.riskPct}% risk level.
              </span>
            </div>
          ) : (
            <span className="text-sm" style={{ color: "var(--sand-dim)" }}>
              Active batch in progress. Expand the pool to open the next reserve slot after this batch locks in.
            </span>
          )}
        </div>
      )}

      {/* Risk guard */}
      <div className="rounded-lg" style={{ background: "var(--ledger)", border: "1px solid var(--line)", padding: 16 }}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="pd-label">Risk Guard · max {oat.riskPct}% per trade</div>
          {oat.riskViolations.length > 0 && (
            <span className="pd-mono text-xs" style={{ color: oat.outstandingViolations === 0 ? "var(--sage)" : "var(--brass)" }}>
              {oat.outstandingViolations} outstanding · {oat.riskViolations.length - oat.outstandingViolations} acknowledged
            </span>
          )}
        </div>
        {oat.riskViolations.length === 0 ? (
          <div className="text-sm" style={{ color: "var(--sage)" }}>
            No funded-account trade has risked more than {oat.riskPct}% of its account size.
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)" }}>
            <div className="grid pd-label items-center" style={{ gridTemplateColumns: "1.5fr 90px 70px 100px 100px 110px", gap: "0 12px", background: "var(--ledger-raised)", borderBottom: "1px solid var(--line)", padding: "8px 14px" }}>
              <span>Account</span><span>Date</span><span>Symbol</span><span>Risk</span><span>% of size</span><span className="text-right">Status</span>
            </div>
            {oat.riskViolations.slice(0, 40).map((v) => (
              <div key={`${v.accountId}-${v.date}-${v.symbol}-${v.risk}`} className="grid pd-mono items-center text-sm" style={{ gridTemplateColumns: "1.5fr 90px 70px 100px 100px 110px", gap: "0 12px", padding: "8px 14px", borderBottom: "1px solid var(--line-soft)" }}>
                <Link to="/accounts/$accountId" params={{ accountId: v.accountId }} className="truncate no-underline" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--sand-dim)" }}>
                  {v.accountLabel}
                </Link>
                <span className="truncate" style={{ color: "var(--slate)" }}>{formatDateUK(v.date)}</span>
                <span className="truncate" style={{ color: "var(--sand)" }}>{v.symbol}</span>
                <span className="truncate" style={{ color: "var(--sand)" }}>{money(v.risk)}</span>
                <span className="text-right" style={{ color: v.pct >= 2 ? "var(--brick)" : "var(--brass)" }}>{v.pct.toFixed(2)}%</span>
                <span className="text-right">
                  {v.acked ? (
                    <span className="pd-mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--sage)", background: "rgba(111,176,139,0.12)", padding: "2px 6px", borderRadius: 4 }}>acknowledged</span>
                  ) : (
                    <button
                      onClick={() => onAcknowledge(v.tradeId)}
                      className="pd-mono"
                      style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--brass)", background: "rgba(206,159,82,0.12)", border: "1px solid rgba(206,159,82,0.35)", padding: "3px 8px", borderRadius: 4, cursor: "pointer" }}
                    >acknowledge</button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guide reference */}
      <div className="space-y-6">
        <div className="pd-label">The Guide</div>

        <div className="rounded-lg" style={{ background: "var(--ledger)", border: "1px solid var(--line)", padding: 16 }}>
          <div className="pd-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>One At A Time</div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--slate)", maxWidth: 720 }}>
            The O.A.T. System decouples portfolio growth from active exposure. Instead of chasing one massive payout by
            risking every account at once, it stacks <span style={{ color: "var(--sand)" }}>smaller, repeatable payouts</span>{" "}
            — from {money(oat.payoutFloor)} per $50k account (1% of the standard funded size), ratcheting as accounts grow —
            toward a {money(oat.monthlyGoal)}/month objective — across distinct batches, while the reserve{" "}
            <span style={{ color: "var(--sand)" }}>stays untouched</span>.{" "}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 items-stretch">
            <div className="flex flex-col">
              <div className="pd-label mb-2">Parameters</div>
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--line)", flex: 1 }}>
                {[
                  ["Active / Reserve", "30% / 70%", "max variance buffer / standby backup"],
                  ["Minimum Pool", "3 funded", "to start the split"],
                  ["Payout Floor", `~${money(oat.payoutFloor)}`, "1% of a $50k account"],
                  ["Monthly Objective", `~${money(oat.monthlyGoal)}`, "stacked payouts across batches"],
                  ["Evaluation Risk", "high %", "fast-pass phase"],
                  ["Funded Risk", "~1% / trade", "capital preservation"],
                  ["Rotation Trigger", "payout secured", "switch immediately"],
                ].map(([k, v, note], i) => (
                  <div key={k} className="grid items-center" style={{ gridTemplateColumns: "1.2fr 1fr 1.6fr", gap: "0 12px", padding: "8px 14px", borderBottom: i < 5 ? "1px solid var(--line-soft)" : "none" }}>
                    <span className="text-sm" style={{ color: "var(--sand-dim)" }}>{k}</span>
                    <span className="pd-mono text-sm" style={{ color: "var(--brass)" }}>{v}</span>
                    <span className="text-xs" style={{ color: "var(--slate)" }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="pd-label mb-2">Checklist</div>
              <GuideChecklist oat={oat} />
            </div>
          </div>
        </div>

        <div className="rounded-lg" style={{ background: "var(--ledger)", border: "1px solid var(--line)", padding: 16 }}>
          <div className="pd-label mb-3">Workflow — three phases</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                phase: "Phase 1 · Capital recycling",
                lines: [
                  "Pass evaluations fast by risking higher on challenge accounts.",
                  "The first payout refunds the evaluation fee — everything after is risk-free.",
                  "Repeat until the pool holds 3 funded accounts.",
                ],
              },
              {
                phase: "Phase 2 · Active batch",
                lines: [
                  "Trade only the active batch at ~1% risk, mirrored across the batch.",
                  "The other 70% of accounts stay idle — pure backup.",
                  "The moment the batch hits its payout target, stop trading it.",
                  "Hold maintenance: small days / micro-lots if the firm requires them.",
                ],
              },
              {
                phase: "Phase 3 · Rotation",
                lines: [
                  "Lock in Batch 1, rotate trading to the next batch.",
                  "Each locked batch holds its payout while the next one trades.",
                  payoutCycleText,
                ],
              },
            ].map((ph) => (
              <div key={ph.phase} className="rounded-lg p-4" style={{ background: "var(--ledger-raised)" }}>
                <div className="text-sm font-semibold mb-2" style={{ color: "var(--sand)" }}>{ph.phase}</div>
                <ul className="space-y-2" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {ph.lines.map((line) => (
                    <li key={line} className="text-sm leading-relaxed" style={{ color: "var(--slate)" }}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg" style={{ background: "var(--ledger)", border: "1px solid var(--line)", padding: 16 }}>
          <div className="pd-label mb-3">Drawdown rules</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg p-4" style={{ background: "rgba(111,176,139,0.07)", border: "1px solid var(--line)" }}>
              <div className="text-sm font-semibold mb-1" style={{ color: "var(--sage)" }}>Conservative — recommended</div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--sand-dim)" }}>
                If the active batch enters drawdown, stay on it. Keep trading that batch until it either recovers into payout
                or blows completely. Switching to a fresh batch while negative is batch-hopping, and it feeds a gambling cycle.
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "rgba(193,89,75,0.07)", border: "1px solid var(--line)" }}>
              <div className="text-sm font-semibold mb-1" style={{ color: "var(--brick)" }}>Aggressive — high risk</div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--sand-dim)" }}>
                Leave the drawn-down batch and jump to the next one for an A+ setup. This risks the whole portfolio, but the
                structure still wins if a single batch blows:
              </p>
              <div className="pd-mono text-xs mt-3 space-y-1" style={{ color: "var(--slate)" }}>
                <div>{aggressiveLines[0]}</div>
                <div>{aggressiveLines[1]}</div>
                <div style={{ color: "var(--sage)" }}>{aggressiveLines[2]}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}