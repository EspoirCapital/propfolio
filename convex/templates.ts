import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const templateFields = v.object({
  firm: v.string(),
  name: v.string(),
  phases: v.number(),
  target: v.string(),
  dailyLoss: v.string(),
  maxLoss: v.string(),
  drawdown: v.string(),
  consistency: v.string(),
  feeRefund: v.boolean(),
  platforms: v.string(),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("templates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => ({ ...r, id: r._id }));
  },
});

export const create = mutation({
  args: templateFields,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const id = await ctx.db.insert("templates", { ...args, userId });
    return id;
  },
});

export const update = mutation({
  args: { id: v.id("templates"), ...templateFields.fields },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Template not found.");
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, userId });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Template not found.");
    await ctx.db.delete(args.id);
    return args.id;
  },
});
