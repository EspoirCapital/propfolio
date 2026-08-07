import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const tradeFields = v.object({
  accountId: v.id("accounts"),
  date: v.string(),
  symbol: v.string(),
  side: v.string(),
  lots: v.number(),
  risk: v.number(),
  pnl: v.number(),
  session: v.string(),
  tag: v.string(),
  tvLink: v.string(),
  rating: v.string(),
  notes: v.string(),
  mfeR: v.optional(v.union(v.number(), v.null())),
  maeR: v.optional(v.union(v.number(), v.null())),
  entryTime: v.optional(v.union(v.string(), v.null())),
  exitTime: v.optional(v.union(v.string(), v.null())),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("trades")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => ({ ...r, id: r._id }));
  },
});

export const create = mutation({
  args: tradeFields,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) throw new Error("Account not found.");
    const id = await ctx.db.insert("trades", { ...args, userId, archived: false });
    return id;
  },
});

export const update = mutation({
  args: { id: v.id("trades"), ...tradeFields.fields },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Trade not found.");
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) throw new Error("Account not found.");
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, userId });
    return id;
  },
});

export const acknowledge = mutation({
  args: { id: v.id("trades") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Trade not found.");
    await ctx.db.patch(args.id, { riskAcked: true });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("trades") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Trade not found.");
    await ctx.db.delete(args.id);
    return args.id;
  },
});
