import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { DEFAULT_SETTINGS } from "./seed";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const row = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (row === null) return null;
    return { ...row, id: row._id };
  },
});

export const update = mutation({
  args: { displayFormat: v.string(), beThreshold: v.number(), mfeThreshold: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    let row = await ctx.db
      .query("settings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (row === null) {
      const id = await ctx.db.insert("settings", { userId, ...args });
      return id;
    }
    await ctx.db.patch(row._id, args);
    return row._id;
  },
});
