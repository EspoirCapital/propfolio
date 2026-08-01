import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const certificateFields = v.object({
  accountId: v.id("accounts"),
  type: v.string(),
  date: v.string(),
  link: v.string(),
  label: v.string(),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("certificates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => ({ ...r, id: r._id }));
  },
});

export const create = mutation({
  args: certificateFields,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) throw new Error("Account not found.");
    const id = await ctx.db.insert("certificates", { ...args, userId });
    return id;
  },
});

export const update = mutation({
  args: { id: v.id("certificates"), ...certificateFields.fields },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Certificate not found.");
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) throw new Error("Account not found.");
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, userId });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("certificates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Certificate not found.");
    await ctx.db.delete(args.id);
    return args.id;
  },
});
