import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const accountFields = v.object({
  firmId: v.id("firms"),
  templateId: v.id("templates"),
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
});

async function requireValidTemplate(ctx: MutationCtx, templateId: Id<"templates">, firmId: Id<"firms">) {
  const template = await ctx.db.get(templateId);
  if (!template) throw new Error("Template not found.");
  if (template.firmId !== firmId) throw new Error("Template does not belong to that firm.");
  return template;
}

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
    await requireValidTemplate(ctx, args.templateId, args.firmId);
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
    await requireValidTemplate(ctx, args.templateId, args.firmId);
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
    const links = await ctx.db
      .query("copyLinks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const l of links) {
      if (l.masterAccountId === args.id || l.slaveAccountId === args.id) {
        await ctx.db.delete(l._id);
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

// Assign an OAT batch role (active / reserve) manually. Passing null clears the
// manual role so the automatic rotation rules take over again.
export const setBatch = mutation({
  args: { id: v.id("accounts"), role: v.optional(v.union(v.literal("active"), v.literal("reserve"))) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Account not found.");
    await ctx.db.patch(args.id, { oatBatch: args.role });
    return args.id;
  },
});

// Manually group two accounts (and anything already in either of their chains)
// into one journey. The chainId is anchored to the earliest-created member so
// the ordering shown in the UI is stable.
export const link = mutation({
  args: { id: v.id("accounts"), otherId: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const a = await ctx.db.get(args.id);
    const b = await ctx.db.get(args.otherId);
    if (!a || a.userId !== userId || !b || b.userId !== userId) throw new Error("Account not found.");
    if (a._id === b._id) throw new Error("Cannot link an account to itself.");

    const all = await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const wanted = new Set<string>();
    const addChain = (acc: { _id: Id<"accounts">; chainId?: string }) => {
      wanted.add(acc._id);
      if (acc.chainId) {
        for (const o of all) {
          if (o.chainId === acc.chainId) wanted.add(o._id);
        }
      }
    };
    addChain(a);
    addChain(b);
    const members = all.filter((o) => wanted.has(o._id));
    const anchor = members.reduce((min, m) => (m.creationDate < min.creationDate ? m : min))._id;
    for (const m of members) {
      if (m.chainId !== anchor) await ctx.db.patch(m._id, { chainId: anchor });
    }
    return anchor;
  },
});

// Pull an account out of its journey, leaving its former chain-mates intact.
export const unlink = mutation({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Account not found.");
    if (!existing.chainId) throw new Error("Account is not part of a journey.");
    await ctx.db.patch(args.id, { chainId: undefined });
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

    const template = account.templateId ? await ctx.db.get(account.templateId) : null;
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
    if (next === null || !account.firmId || !account.templateId) return args.id;

    const newId = await ctx.db.insert("accounts", {
      userId,
      firmId: account.firmId,
      templateId: account.templateId,
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
