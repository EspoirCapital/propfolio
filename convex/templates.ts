import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const templateFields = v.object({
  firmId: v.id("firms"),
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
    const rows = await ctx.db.query("templates").collect();
    return rows.map((r) => ({ ...r, id: r._id }));
  },
});

async function requireAdmin(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in.");
  const user = await ctx.db.get(userId);
  if (!user?.isAdmin) throw new Error("Only admins can manage templates.");
  return userId;
}

async function firmExists(ctx: MutationCtx, firmId: Id<"firms">) {
  return (await ctx.db.get(firmId)) !== null;
}

export const create = mutation({
  args: templateFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (!(await firmExists(ctx, args.firmId))) throw new Error("Firm not found.");
    if (!args.name.trim()) throw new Error("Template name is required.");
    const id = await ctx.db.insert("templates", args);
    return id;
  },
});

export const update = mutation({
  args: { id: v.id("templates"), ...templateFields.fields },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Template not found.");
    if (!(await firmExists(ctx, args.firmId))) throw new Error("Firm not found.");
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Template not found.");
    await ctx.db.delete(args.id);
    return args.id;
  },
});
