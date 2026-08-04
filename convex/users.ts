import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
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
        banned: r.banned ?? false,
        createdAt: r._creationTime,
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Aggregated performance per user, computed server-side so admins can see
// everyone's numbers (the per-user accounts/trades/payouts queries only ever
// return the signed-in user's own rows).
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const actor = await ctx.db.get(userId);
    if (!actor?.isAdmin) return [];

    const users = await ctx.db.query("users").collect();
    const ACTIVE_STATUS = new Set(["phase_1", "phase_2", "phase_3", "funded"]);

    const out = [];
    for (const u of users) {
      if (!u.email) continue;

      const accounts = await ctx.db.query("accounts").withIndex("by_userId", (q) => q.eq("userId", u._id)).collect();
      const payouts = await ctx.db.query("payouts").withIndex("by_userId", (q) => q.eq("userId", u._id)).collect();
      const trades = await ctx.db.query("trades").withIndex("by_userId", (q) => q.eq("userId", u._id)).collect();

      let active = 0;
      let cost = 0;
      let refund = 0;
      for (const a of accounts) {
        cost += (a.costs || []).reduce((s, c) => s + c.amount, 0);
        if (!a.archived && ACTIVE_STATUS.has(a.status)) active++;
        if (a.templateId) {
          const tpl = await ctx.db.get(a.templateId);
          const firstPayout = payouts.some((p) => p.accountId === a._id);
          if (tpl?.feeRefund && firstPayout) refund += Math.abs((a.costs || [])[0]?.amount || 0);
        }
      }

      const wins = trades.filter((t) => !t.archived && t.pnl > 0).length;
      const totalTrades = trades.filter((t) => !t.archived).length;
      const received = payouts.reduce((s, p) => s + p.amount, 0);
      const net = received + refund - cost;

      out.push({
        userId: u._id,
        joinDate: u._creationTime,
        activeAccounts: active,
        winRate: totalTrades > 0 ? Math.round((wins / totalTrades) * 1000) / 10 : null,
        payoutCount: payouts.length,
        totalReceived: received,
        net,
      });
    }

    return out;
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

export const setBanned = action({
  args: { id: v.id("users"), banned: v.boolean() },
  handler: async (ctx, args) => {
    // Validate + persist the flag first (so the ban holds even if the
    // session-removal step below fails), then kick their active sessions.
    await ctx.runMutation(internal.users.setBannedRecord, { id: args.id, banned: args.banned });
    if (args.banned) {
      await invalidateSessions(ctx, { userId: args.id });
    }
    return args.id;
  },
});

export const setBannedRecord = internalMutation({
  args: { id: v.id("users"), banned: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const actor = await ctx.db.get(userId);
    if (!actor?.isAdmin) throw new Error("Only admins can ban users.");
    if (args.id === userId) throw new Error("You cannot ban yourself.");
    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("User not found.");
    await ctx.db.patch(args.id, { banned: args.banned });
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
