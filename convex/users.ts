import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return { id: user._id, name: user.name ?? "", email: user.email ?? "", isAdmin: user.isAdmin ?? false };
  },
});

export const updateProfile = mutation({
  args: { name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    await ctx.db.patch(userId, { name: args.name.trim(), email: args.email.trim().toLowerCase() });
    return userId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];
    const rows = await ctx.db.query("users").collect();
    return rows
      .filter((r) => r.email)
      .map((r) => ({
        id: r._id,
        name: r.name ?? "",
        email: r.email ?? "",
        isAdmin: r.isAdmin ?? false,
        createdAt: r._creationTime,
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const setRole = mutation({
  args: { id: v.id("users"), isAdmin: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const actor = await ctx.db.get(userId);
    if (!actor?.isAdmin) throw new Error("Only admins can manage roles.");
    if (args.id === userId && !args.isAdmin) throw new Error("You cannot remove your own admin role.");
    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("User not found.");
    await ctx.db.patch(args.id, { isAdmin: args.isAdmin });
    return args.id;
  },
});
