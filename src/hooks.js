import { useMemo } from "react";

export function useDerived(accounts, trades, payouts, templates, firms) {
  return useMemo(() => {
    const firmsById = new Map(firms.map((f) => [f.id, f]));
    const templatesById = new Map(templates.map((t) => [t.id, t]));

    const withComputed = accounts.map((acc) => {
      const cost = acc.costs.reduce((s, c) => s + c.amount, 0);
      const accPayouts = payouts.filter((p) => p.accountId === acc.id);
      const received = accPayouts.reduce((s, p) => s + p.amount, 0);
      const accTrades = trades.filter((t) => t.accountId === acc.id);
      const tradePnl = accTrades.reduce((s, t) => s + (t.pnl || 0), 0);
      const tradeCount = accTrades.length;

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

      return { ...acc, firm, template, firmName, templateName, cost, received, refund, refundDate, net: received + refund - cost, tradePnl, tradeCount, targetPct, targetGoal };
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

    const phaseIdx = { phase_1: 0, phase_2: 1, phase_3: 2 };
    const ruinProbs = withComputed.map((acc) => {
      if (!["phase_1", "phase_2", "phase_3"].includes(acc.status)) return null;
      const targetNum = acc.targetGoal ? parseFloat(acc.targetGoal) : NaN;
      const maxLoss = parseFloat(acc.maxLoss) || (acc.template ? parseFloat(acc.template.maxLoss) : NaN);
      if (!(targetNum > 0) || !(maxLoss > 0) || !(acc.size > 0)) return null;
      const trades = trades.filter((t) => t.accountId === acc.id);
      const withR = trades.filter((t) => t.risk > 0);
      const winRs = [], lossRs = [];
      withR.forEach((t) => {
        const rr = t.pnl / t.risk;
        if (rr > 0) winRs.push(rr);
        else if (rr < 0) lossRs.push(rr);
      });
      if (winRs.length + lossRs.length === 0) return null;
      const p = winRs.length / (winRs.length + lossRs.length);
      const winR = winRs.reduce((s, v) => s + v, 0) / winRs.length;
      const lossR = lossRs.reduce((s, v) => s + v, 0) / lossRs.length;
      const riskPct = withR.reduce((s, t) => s + t.risk, 0) / withR.length / acc.size;
      if (!(riskPct > 0)) return null;

      const progress = acc.targetPct !== null ? acc.targetPct / 100 : 0;
      const T = (1 - progress) * targetNum;
      const B = maxLoss + progress * targetNum;
      const mu = (p * winR + (1 - p) * lossR) * riskPct;
      const sigma2 = p * (1 - p) * (winR - lossR) ** 2 * riskPct ** 2;
      if (sigma2 <= 0) return null;
      const ruin = mu <= 0
        ? 1
        : 1 - (1 - Math.exp((-2 * mu * B) / sigma2)) / (1 - Math.exp((-2 * mu * (T + B)) / sigma2));
      return Math.min(0.999, Math.max(0, ruin));
    });
    const knownRuins = ruinProbs.filter((p) => p !== null);
    const ruinRate = knownRuins.length
      ? Math.round((knownRuins.reduce((s, p) => s + p, 0) / knownRuins.length) * 100)
      : null;

    return { accounts: withComputed, totals, passRate, ruinRate, ruinAccountCount: knownRuins.length };
  }, [accounts, trades, payouts, templates, firms]);
}
