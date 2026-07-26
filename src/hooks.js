import { useMemo } from "react";

export function useDerived(accounts, trades, payouts, templates) {
  return useMemo(() => {
    const withComputed = accounts.map((acc) => {
      const cost = acc.costs.reduce((s, c) => s + c.amount, 0);
      const accPayouts = payouts.filter((p) => p.accountId === acc.id);
      const received = accPayouts.reduce((s, p) => s + p.amount, 0);
      const accTrades = trades.filter((t) => t.accountId === acc.id);
      const tradePnl = accTrades.reduce((s, t) => s + (t.pnl || 0), 0);
      const tradeCount = accTrades.length;

      const tmpl = templates.find((t) => t.firm === acc.firm && t.name === acc.template);
      const sortedPayouts = [...accPayouts].sort((a, b) => (a.requestedDate > b.requestedDate ? 1 : -1));
      const firstPayout = sortedPayouts[0];
      const hasRefund = tmpl?.feeRefund && firstPayout;
      const refund = hasRefund ? Math.abs(acc.costs[0]?.amount || 0) : 0;
      const refundDate = hasRefund ? firstPayout.requestedDate : null;

      let targetPct = null;
      let targetGoal = null;
      if (["phase_1", "phase_2", "phase_3"].includes(acc.status)) {
        if (tmpl && tmpl.target && tmpl.target !== "—") {
          const parts = tmpl.target.split("/").map((s) => s.trim());
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

      return { ...acc, cost, received, refund, refundDate, net: received + refund - cost, tradePnl, tradeCount, targetPct, targetGoal };
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
    return { accounts: withComputed, totals, passRate };
  }, [accounts, trades, payouts, templates]);
}
