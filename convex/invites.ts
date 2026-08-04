import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "./_generated/dataModel";

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `ECP-${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8)}`;
}

function usedIds(r: Doc<"invites">) {
  return r.usedByIds ?? (r.usedById ? [r.usedById] : []);
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) return [];
    const rows = await ctx.db.query("invites").order("desc").take(200);
    const now = Date.now();
    return rows.map((r) => {
      const ids = usedIds(r);
      const maxUses = Math.max(1, r.maxUses ?? 1);
      const usedCount = ids.length;
      const status = r.expiresAt < now ? "expired" : usedCount >= maxUses ? "used" : "active";
      return {
        id: r._id,
        code: r.code,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        maxUses,
        usedCount,
        usedByIds: ids,
        status,
      };
    });
  },
});

export const generate = mutation({
  args: { maxUses: v.optional(v.number()), hours: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new Error("Only admins can create invites.");

    const maxUses = Math.max(1, Math.floor(args.maxUses ?? 1));
    const hours = Math.max(1, args.hours ?? 24);
    const now = Date.now();
    const expiresAt = now + hours * 60 * 60 * 1000;

    let code = makeCode();
    let existing = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    let attempts = 0;
    while (existing && attempts < 5) {
      code = makeCode();
      existing = await ctx.db
        .query("invites")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      attempts++;
    }

    const id = await ctx.db.insert("invites", {
      code,
      createdBy: userId,
      createdAt: now,
      expiresAt,
      maxUses,
      usedByIds: [],
    });
    return { id, code, createdAt: now, expiresAt, maxUses, usedByIds: [], status: "active" };
  },
});

export const revoke = mutation({
  args: { id: v.id("invites") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new Error("Only admins can revoke invites.");
    const invite = await ctx.db.get(args.id);
    if (!invite) throw new Error("Invite not found.");
    await ctx.db.delete(args.id);
    return args.id;
  },
});