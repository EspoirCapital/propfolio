import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const accountFields = v.object({
  firm: v.string(),
  template: v.string(),
  size: v.number(),
  platform: v.string(),
  creationDate: v.string(),
  terminationDate: v.string(),
  status: v.string(),
  drawdown: v.string(),
  maxLoss: v.string(),
  dailyLoss: v.string(),
  costs: v.array(v.object({ label: v.string(), amount: v.number() })),
  platformLogin: v.string(),
  platformPassword: v.string(),
  platformInvestorPassword: v.string(),
  platformLink: v.string(),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return rows.map((r) => ({ ...r, id: r._id }));
  },
});

export const create = mutation({
  args: accountFields,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const id = await ctx.db.insert("accounts", { ...args, userId, archived: false, notes: "" });
    return id;
  },
});

export const update = mutation({
  args: { id: v.id("accounts"), ...accountFields.fields },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Account not found.");
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, userId, archived: existing.archived });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Account not found.");
    // Cascade delete everything linked to the account.
    const trades = await ctx.db
      .query("trades")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.id))
      .collect();
    for (const t of trades) await ctx.db.delete(t._id);
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.id))
      .collect();
    for (const p of payouts) await ctx.db.delete(p._id);
    const certificates = await ctx.db
      .query("certificates")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.id))
      .collect();
    for (const c of certificates) await ctx.db.delete(c._id);
    const clusters = await ctx.db
      .query("clusters")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const cl of clusters) {
      if (cl.masterAccountId === args.id) {
        await ctx.db.delete(cl._id);
      } else {
        const slaves = cl.slaves.filter((s) => s.accountId !== args.id);
        await ctx.db.patch(cl._id, { slaves });
      }
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const archive = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Account not found.");
    await ctx.db.patch(args.id, { archived: true });
    const trades = await ctx.db
      .query("trades")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.id))
      .collect();
    for (const t of trades) await ctx.db.patch(t._id, { archived: true });
    return args.id;
  },
});

export const unarchive = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Account not found.");
    await ctx.db.patch(args.id, { archived: false });
    const trades = await ctx.db
      .query("trades")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.id))
      .collect();
    for (const t of trades) await ctx.db.patch(t._id, { archived: false });
    return args.id;
  },
});

// Mark an account as passed and create the next-phase account. Returns the
// new account id.
export const proceed = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const account = await ctx.db.get(args.id);
    if (!account || account.userId !== userId) throw new Error("Account not found.");

    const template = await ctx.db
      .query("templates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.and(q.eq(q.field("firm"), account.firm), q.eq(q.field("name"), account.template)))
      .first();
    const phaseCount = template?.phases ?? 0;

    const today = new Date().toISOString().slice(0, 10);
    const chainId = account.chainId ?? args.id;
    await ctx.db.patch(args.id, { status: "passed", terminationDate: today, chainId });

    const nextStatus = (status: string, count: number): string | null => {
      if (count <= 0) return null;
      if (status === "phase_1") return count >= 2 ? "phase_2" : "funded";
      if (status === "phase_2") return count >= 3 ? "phase_3" : "funded";
      if (status === "phase_3") return "funded";
      return null;
    };
    const next = nextStatus(account.status, phaseCount);
    if (next === null) return args.id;

    const newId = await ctx.db.insert("accounts", {
      userId,
      firm: account.firm,
      template: account.template,
      size: account.size,
      platform: account.platform,
      drawdown: account.drawdown,
      maxLoss: account.maxLoss,
      dailyLoss: account.dailyLoss,
      status: next,
      creationDate: today,
      terminationDate: "",
      platformLogin: "",
      platformPassword: "",
      platformInvestorPassword: "",
      platformLink: "",
      notes: "",
      costs: [],
      archived: false,
      chainId,
    });
    return newId;
  },
});

export const breach = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Account not found.");
    const today = new Date().toISOString().slice(0, 10);
    await ctx.db.patch(args.id, { status: "breached", terminationDate: today });
    return args.id;
  },
});
