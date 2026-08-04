import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const firmFields = v.object({
  name: v.string(),
  platformLink: v.optional(v.string()),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db.query("firms").collect();
    return rows
      .map((r) => ({ id: r._id, name: r.name, platformLink: r.platformLink ?? "" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

async function requireAdmin(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in.");
  const user = await ctx.db.get(userId);
  if (!user?.isAdmin) throw new Error("Only admins can manage firms.");
  return userId;
}

export const create = mutation({
  args: firmFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    if (!name) throw new Error("Firm name is required.");
    const existing = await ctx.db
      .query("firms")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    if (existing) throw new Error("A firm with that name already exists.");
    return ctx.db.insert("firms", { name, platformLink: args.platformLink ?? "" });
  },
});

export const update = mutation({
  args: { id: v.id("firms"), ...firmFields.fields },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Firm not found.");
    const name = fields.name.trim();
    if (!name) throw new Error("Firm name is required.");
    const clash = await ctx.db
      .query("firms")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    if (clash && clash._id !== id) throw new Error("A firm with that name already exists.");
    await ctx.db.patch(id, { name, platformLink: fields.platformLink ?? existing.platformLink ?? "" });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("firms") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Firm not found.");
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_firmId", (q) => q.eq("firmId", args.id))
      .first();
    if (templates) throw new Error("Cannot delete a firm that still has templates.");
    await ctx.db.delete(args.id);
    return args.id;
  },
});
