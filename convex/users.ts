import { v } from "convex/values";
import { query, mutation, action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId, getAuthSessionId, retrieveAccount, modifyAccountCredentials, invalidateSessions } from "@convex-dev/auth/server";
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

export const changePassword = action({
  args: { currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const sessionId = await getAuthSessionId(ctx);
    if (sessionId === null) throw new Error("Not signed in.");

    const email = await ctx.runQuery(internal.users.getEmail, { userId });
    if (!email) throw new Error("User not found.");

    if (args.newPassword.length < 8) throw new Error("New password must be at least 8 characters.");

    await retrieveAccount(ctx, {
      provider: "password",
      account: { id: email, secret: args.currentPassword },
    }).catch(() => {
      throw new Error("Current password is incorrect.");
    });

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: email, secret: args.newPassword },
    });

    await invalidateSessions(ctx, { userId, except: [sessionId] });
    return true;
  },
});

export const getEmail = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.email ?? null;
  },
});
