import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const payoutFields = v.object({
  accountId: v.id("accounts"),
  requestedDate: v.string(),
  amount: v.number(),
  split: v.string(),
  method: v.string(),
  proofLink: v.string(),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("payouts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => ({ ...r, id: r._id }));
  },
});

export const create = mutation({
  args: payoutFields,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) throw new Error("Account not found.");
    const id = await ctx.db.insert("payouts", { ...args, userId });
    return id;
  },
});

export const update = mutation({
  args: { id: v.id("payouts"), ...payoutFields.fields },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Payout not found.");
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) throw new Error("Account not found.");
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, userId });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("payouts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Payout not found.");
    await ctx.db.delete(args.id);
    return args.id;
  },
});
