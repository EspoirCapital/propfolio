import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Copy Journaling: a master account is remembered alongside its slave
// accounts (one copyLinks row per master->slave pairing, no named groups).
// When a trade is logged on the master it can be copied onto the slaves,
// scaled by (slave size / master size) x desired multiplier so the
// R-multiple is preserved across every account.

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("copyLinks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => ({
      id: r._id,
      masterAccountId: r.masterAccountId,
      slaveAccountId: r.slaveAccountId,
    }));
  },
});

// Replace the slave set for a master account so the pairing is remembered.
export const setSlaves = mutation({
  args: { masterAccountId: v.id("accounts"), slaveAccountIds: v.array(v.id("accounts")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const master = await ctx.db.get(args.masterAccountId);
    if (!master || master.userId !== userId) throw new Error("Account not found.");
    for (const slaveId of args.slaveAccountIds) {
      const slave = await ctx.db.get(slaveId);
      if (!slave || slave.userId !== userId) throw new Error("Account not found.");
    }
    const existing = await ctx.db
      .query("copyLinks")
      .withIndex("by_masterAccountId", (q) => q.eq("masterAccountId", args.masterAccountId))
      .collect();
    for (const link of existing) await ctx.db.delete(link._id);
    for (const slaveId of args.slaveAccountIds) {
      if (slaveId === args.masterAccountId) continue;
      await ctx.db.insert("copyLinks", { userId, masterAccountId: args.masterAccountId, slaveAccountId: slaveId });
    }
    return args.masterAccountId;
  },
});

// Copy one or more of a master account's trades onto its chosen slaves.
export const copyTrades = mutation({
  args: {
    masterAccountId: v.id("accounts"),
    tradeIds: v.array(v.id("trades")),
    slaveAccountIds: v.array(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");

    const master = await ctx.db.get(args.masterAccountId);
    if (!master || master.userId !== userId) throw new Error("Account not found.");

    const slaves = [];
    for (const slaveId of args.slaveAccountIds) {
      if (slaveId === args.masterAccountId) continue;
      const slave = await ctx.db.get(slaveId);
      if (!slave || slave.userId !== userId) throw new Error("Account not found.");
      slaves.push(slave);
    }
    if (slaves.length === 0) return { copied: 0 };

    let copied = 0;
    for (const tradeId of args.tradeIds) {
      const trade = await ctx.db.get(tradeId);
      if (!trade || trade.userId !== userId) continue;
      if (trade.accountId !== args.masterAccountId) continue;
      for (const slave of slaves) {
        const factor = slave.size / master.size;
        if (factor <= 0) continue;
        await ctx.db.insert("trades", {
          userId,
          accountId: slave._id,
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
          entryTime: trade.entryTime ?? undefined,
          exitTime: trade.exitTime ?? undefined,
          archived: false,
        });
        copied++;
      }
    }
    return { copied };
  },
});

function round2(n: number) {
  return Math.round(n * 100) / 100;
}