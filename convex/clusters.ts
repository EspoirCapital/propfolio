import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const clusterFields = v.object({
  name: v.string(),
  masterAccountId: v.id("accounts"),
  slaves: v.array(v.object({ accountId: v.id("accounts"), riskMultiplier: v.number() })),
  createdAt: v.string(),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("clusters")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => ({ ...r, id: r._id }));
  },
});

export const create = mutation({
  args: clusterFields,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    for (const accId of [args.masterAccountId, ...args.slaves.map((s) => s.accountId)]) {
      const account = await ctx.db.get(accId);
      if (!account || account.userId !== userId) throw new Error("Account not found.");
    }
    const id = await ctx.db.insert("clusters", { ...args, userId });
    return id;
  },
});

export const update = mutation({
  args: { id: v.id("clusters"), ...clusterFields.fields },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Cluster not found.");
    for (const accId of [args.masterAccountId, ...args.slaves.map((s) => s.accountId)]) {
      const account = await ctx.db.get(accId);
      if (!account || account.userId !== userId) throw new Error("Account not found.");
    }
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, userId });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("clusters") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Cluster not found.");
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Copy a trade logged on a cluster's master account onto each of its slaves.
// Risk and lots scale by (slave size / master size) x the slave's multiplier,
// and P&L scales by the same factor so the R-multiple is preserved across every
// account. Date, symbol, side, session, tag, link, rating, notes and MFE/MAE
// copy verbatim. The master's own trade is left untouched.
export const copyTrade = mutation({
  args: { tradeId: v.id("trades"), clusterId: v.id("clusters") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");

    const cluster = await ctx.db.get(args.clusterId);
    if (!cluster || cluster.userId !== userId) throw new Error("Cluster not found.");

    const trade = await ctx.db.get(args.tradeId);
    if (!trade || trade.userId !== userId) throw new Error("Trade not found.");
    if (trade.accountId !== cluster.masterAccountId) {
      throw new Error("Only a master account's trades can be copied to its cluster.");
    }

    const master = await ctx.db.get(cluster.masterAccountId);
    if (!master || master.userId !== userId) throw new Error("Account not found.");

    let copied = 0;
    for (const slave of cluster.slaves) {
      if (slave.accountId === cluster.masterAccountId) continue;
      const slaveAccount = await ctx.db.get(slave.accountId);
      if (!slaveAccount || slaveAccount.userId !== userId) continue;
      const factor = (slaveAccount.size / master.size) * slave.riskMultiplier;
      if (factor <= 0) continue;
      await ctx.db.insert("trades", {
        userId,
        accountId: slave.accountId,
        date: trade.date,
        symbol: trade.symbol,
        side: trade.side,
        lots: round2(trade.lots * factor),
        risk: round2(trade.risk * factor),
        pnl: round2(trade.pnl * factor),
        session: trade.session,
        tag: trade.tag,
        tvLink: trade.tvLink,
        rating: trade.rating,
        notes: trade.notes,
        mfeR: trade.mfeR ?? null,
        maeR: trade.maeR ?? null,
        archived: false,
      });
      copied++;
    }
    return { copied };
  },
});

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
