import { useMemo } from "react";
import { getAccountLabel } from "./utils.js";

const OAT_MIN_POOL = 3;
const OAT_ACTIVE_PCT = 0.3;
const OAT_RISK_PCT = 1;

export function useDerived(accounts, trades, payouts, templates, firms) {
  return useMemo(() => derive(accounts, trades, payouts, templates, firms), [accounts, trades, payouts, templates, firms]);
}

export function derive(accounts, trades, payouts, templates, firms) {
    const firmsById = new Map(firms.map((f) => [f.id, f]));
    const templatesById = new Map(templates.map((t) => [t.id, t]));

    const withComputed = accounts.map((acc) => {
      const cost = acc.costs.reduce((s, c) => s + c.amount, 0);
      const accPayouts = payouts.filter((p) => p.accountId === acc.id);
      const received = accPayouts.reduce((s, p) => s + p.amount, 0);
      const accTrades = trades.filter((t) => t.accountId === acc.id);
      const tradePnl = accTrades.reduce((s, t) => s + (t.pnl || 0), 0);
      const tradeCount = accTrades.length;
      const sizeNum = Number(acc.size) || 0;
      const minPayout = Math.round(0.01 * sizeNum);
      const payoutGap = Math.max(0, minPayout - tradePnl);

      const firm = firmsById.get(acc.firmId);
      const template = templatesById.get(acc.templateId);
      const firmName = firm?.name ?? acc.firm ?? "";
      const templateName = template?.name ?? acc.template ?? "";

      const sortedPayouts = [...accPayouts].sort((a, b) => (a.requestedDate > b.requestedDate ? 1 : -1));
      const firstPayout = sortedPayouts[0];
      const hasRefund = template?.feeRefund && firstPayout;
      const refund = hasRefund ? Math.abs(acc.costs[0]?.amount || 0) : 0;
      const refundDate = hasRefund ? firstPayout.requestedDate : null;

      let targetPct = null;
      let targetGoal = null;
      if (["phase_1", "phase_2", "phase_3"].includes(acc.status)) {
        if (template && template.target && template.target !== "—") {
          const parts = template.target.split("/").map((s) => s.trim());
          const phaseIdx = { phase_1: 0, phase_2: 1, phase_3: 2 }[acc.status];
          const targetStr = parts[phaseIdx];
          if (targetStr) {
            targetGoal = targetStr;
            const num = parseFloat(targetStr);
            if (!isNaN(num) && num > 0 && acc.size > 0) {
              const targetAmt = (num / 100) * acc.size;
              targetPct = Math.min(100, Math.round((tradePnl / targetAmt) * 100));
            }
          }
        }
      }

      return { ...acc, firm, template, firmName, templateName, cost, received, refund, refundDate, net: received + refund - cost, tradePnl, tradeCount, targetPct, targetGoal, minPayout, payoutGap };
    });
    const totals = withComputed.reduce(
      (acc, a) => ({
        invested: acc.invested + a.cost,
        received: acc.received + a.received,
        refunds: acc.refunds + a.refund,
      }),
      { invested: 0, received: 0, refunds: 0 }
    );
    const passCount = withComputed.filter((a) => ["funded", "passed"].includes(a.status)).length;
    const decidedCount = withComputed.filter((a) => ["funded", "passed", "breached"].includes(a.status)).length;
    const passRate = decidedCount ? Math.round((passCount / decidedCount) * 100) : 0;

    const pool = withComputed.filter((a) => a.status === "funded" && !a.archived);
    const activeCount = Math.max(1, Math.round(pool.length * OAT_ACTIVE_PCT));
    const byAcquired = (list) =>
      [...list].sort((a, b) => {
        const d = (a.creationDate || "").localeCompare(b.creationDate || "");
        if (d !== 0) return d;
        return (a.platformLogin || "").localeCompare(b.platformLogin || "");
      });
    const tradable = byAcquired(pool.filter((a) => a.received <= 0));
    const locked = byAcquired(pool.filter((a) => a.received > 0));
    const manualQueue = byAcquired(tradable.filter((a) => a.oatBatch === "active"));
    const autoQueue = byAcquired(tradable.filter((a) => a.oatBatch !== "active" && a.oatBatch !== "reserve"));
    const heldBack = byAcquired(tradable.filter((a) => a.oatBatch === "reserve"));
    const rotationQueue = [...manualQueue, ...autoQueue];
    const active = rotationQueue.slice(0, activeCount);
    const reserve = [...rotationQueue.slice(activeCount), ...heldBack, ...locked];
    const fullyLocked = pool.length > 0 && tradable.length === 0;
    const nextUp = rotationQueue[activeCount] || null;
    const riskViolations = [];
    pool.forEach((acc) => {
      const size = Number(acc.size) || 0;
      trades
        .filter((t) => t.accountId === acc.id && !t.archived)
        .forEach((t) => {
          const base = Number(t.accountSize) || size;
          const risk = Number(t.risk) || 0;
          if (base > 0 && risk > 0) {
            const pct = (risk / base) * 100;
            if (pct > OAT_RISK_PCT) {
              riskViolations.push({
                accountId: acc.id,
                accountLabel: getAccountLabel(acc) || "",
                date: t.date,
                symbol: t.symbol || "—",
                risk,
                size: base,
                pct,
              });
            }
          }
        });
    });
    riskViolations.sort((a, b) => b.pct - a.pct);

    const drawdownAccount = active.find((a) => a.tradePnl < 0) || null;
    const payoutsSecured = pool.reduce((s, a) => s + a.received, 0);

    const avgPayout = locked.length ? payoutsSecured / locked.length : null;
    const floorSizes = withComputed.filter((a) => !a.archived).map((a) => Number(a.size) || 0);
    const floorSize = floorSizes.length ? Math.min(...floorSizes) : 0;
    const assumedPayout = floorSize ? Math.round(0.01 * floorSize) : 500;
    const perAccountPayout = avgPayout !== null ? Math.round(avgPayout) : assumedPayout;
    const payoutCycle = {
      perAccount: perAccountPayout,
      perCycle: perAccountPayout * Math.max(1, active.length),
      assumed: avgPayout === null,
    };

    const ladder = {
      stage: Math.min(3, pool.length),
      lockedCount: locked.length,
    };

    const oat = {
      pool,
      poolCount: pool.length,
      ready: pool.length >= OAT_MIN_POOL,
      minPool: OAT_MIN_POOL,
      activePct: Math.round(OAT_ACTIVE_PCT * 100),
      activeCount,
      active,
      reserve,
      locked,
      fullyLocked,
      nextUp,
      drawdown: drawdownAccount,
      riskViolations,
      riskPct: OAT_RISK_PCT,
      payoutsSecured,
      tradableCount: tradable.length,
      ladder,
      payoutCycle,
      payoutFloor: assumedPayout,
    };

    return { accounts: withComputed, totals, passRate, oat };
}
