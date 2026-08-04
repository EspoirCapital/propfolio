import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { DEFAULT_FIRMS, DEFAULT_TEMPLATES } from "./seed";

// One-time / fresh-deployment bootstrap: create the default firms and the
// canonical default plans if they do not already exist. Idempotent and safe to
// re-run; admins can trigger it from the Firms & Rules page when the workspace
// has no firms yet.

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const user = await ctx.db.get(userId);
    if (!user?.isAdmin) throw new Error("Only admins can seed the default data.");

    let seeded = 0;

    for (const f of DEFAULT_FIRMS) {
      const existing = await ctx.db
        .query("firms")
        .withIndex("by_name", (q) => q.eq("name", f.name))
        .first();
      if (existing) continue;
      await ctx.db.insert("firms", { name: f.name, platformLink: f.platformLink ?? "" });
      seeded++;
    }

    const firms = await ctx.db.query("firms").collect();
    for (const t of DEFAULT_TEMPLATES) {
      const firm = firms.find((x) => x.name === t.firm);
      if (!firm) continue;
      const existing = await ctx.db
        .query("templates")
        .withIndex("by_firmId", (q) => q.eq("firmId", firm._id))
        .filter((q) => q.eq(q.field("name"), t.name))
        .first();
      if (existing) continue;
      await ctx.db.insert("templates", {
        firmId: firm._id,
        name: t.name,
        phases: t.phases,
        target: t.target,
        dailyLoss: t.dailyLoss,
        maxLoss: t.maxLoss,
        drawdown: t.drawdown,
        consistency: t.consistency,
        feeRefund: t.feeRefund,
        platforms: t.platforms,
      });
      seeded++;
    }

    return { seeded };
  },
});
