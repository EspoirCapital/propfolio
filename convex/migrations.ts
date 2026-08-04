import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { DEFAULT_FIRMS, DEFAULT_TEMPLATES } from "./seed";
import { Id } from "./_generated/dataModel";

// Migration: convert per-user string references into global ID references.
//
// Before this migration, every user had their own copy of the templates table
// (seeded at signup) and accounts stored `firm` / `template` name strings.
// After it, firms and templates are a single global, admin-managed set and
// accounts point at them via firmId / templateId.
//
// It is idempotent and safe to re-run. It does not touch trades, payouts,
// certificates, or clusters. Legacy template rows (the per-user copies) are
// deleted; canonical rows are created fresh so exactly one plan exists per
// (firm, name).

type LegacyTemplate = {
  _id: Id<"templates">;
  firm?: string;
  name?: string;
  phases?: number;
  target?: string;
  dailyLoss?: string;
  maxLoss?: string;
  drawdown?: string;
  consistency?: string;
  feeRefund?: boolean;
  platforms?: string;
};

type LegacyAccount = {
  _id: Id<"accounts">;
  firm?: string;
  template?: string;
  platformLink?: string;
};

async function requireAdmin(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not signed in.");
  const user = await ctx.db.get(userId);
  if (!user?.isAdmin) throw new Error("Only admins can run the migration.");
  return userId;
}

export const status = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { pending: false, accounts: 0 };
    const accounts = (await ctx.db.query("accounts").take(500)) as LegacyAccount[];
    const legacy = accounts.filter((a) => a.firm);
    return { pending: legacy.length > 0, accounts: legacy.length };
  },
});

export const migrateRefs = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // 1. Collect every firm name we know about: the defaults plus any firm
    //    string referenced by a legacy account or legacy template.
    const legacyAccounts = (await ctx.db.query("accounts").collect()) as LegacyAccount[];
    const legacyTemplates = (await ctx.db.query("templates").collect()) as LegacyTemplate[];

    const firmNames = new Set<string>();
    DEFAULT_FIRMS.forEach((f) => firmNames.add(f.name));
    legacyAccounts.forEach((a) => a.firm && firmNames.add(a.firm));
    legacyTemplates.forEach((t) => t.firm && firmNames.add(t.firm));

    // 2. Ensure a firms row exists for every known name, backfilling the
    //    platform link from any legacy account that carried one.
    const firmIdByName: Record<string, Id<"firms">> = {};
    for (const name of firmNames) {
      let firm = await ctx.db
        .query("firms")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first();
      if (!firm) {
        const id = await ctx.db.insert("firms", { name, platformLink: "" });
        firmIdByName[name] = id;
        continue;
      }
      firmIdByName[name] = firm._id;
      if (!firm.platformLink) {
        const legacy = legacyAccounts.find((a) => a.firm === name && a.platformLink);
        if (legacy?.platformLink) {
          await ctx.db.patch(firm._id, { platformLink: legacy.platformLink });
        }
      }
    }

    // 3. Resolve the canonical field set for every (firm, name) plan we need:
    //    defaults first, then the rules from a legacy template row (which keeps
    //    any custom plans working), then a bare default as a last resort.
    const defaultsByName = new Map(
      DEFAULT_TEMPLATES.map((t) => [`${t.firm}\u0000${t.name}`, t])
    );
    const canonicalFields = new Map<string, Record<string, unknown>>();
    const need = new Set<string>();

    const addNeed = (firm: string, name: string) => {
      const key = `${firm}\u0000${name}`;
      if (!need.has(key)) {
        need.add(key);
        const fromDefault = defaultsByName.get(key);
        const fromLegacy = legacyTemplates.find((t) => t.firm === firm && t.name === name);
        canonicalFields.set(key, {
          name,
          phases: fromDefault?.phases ?? fromLegacy?.phases ?? 0,
          target: fromDefault?.target ?? fromLegacy?.target ?? "—",
          dailyLoss: fromDefault?.dailyLoss ?? fromLegacy?.dailyLoss ?? "—",
          maxLoss: fromDefault?.maxLoss ?? fromLegacy?.maxLoss ?? "—",
          drawdown: fromDefault?.drawdown ?? fromLegacy?.drawdown ?? "Static",
          consistency: fromDefault?.consistency ?? fromLegacy?.consistency ?? "—",
          feeRefund: fromDefault?.feeRefund ?? fromLegacy?.feeRefund ?? false,
          platforms: fromDefault?.platforms ?? fromLegacy?.platforms ?? "",
        });
      }
    };

    DEFAULT_TEMPLATES.forEach((t) => addNeed(t.firm, t.name));
    legacyTemplates.forEach((t) => {
      if (t.firm && t.name) addNeed(t.firm, t.name);
    });

    // 4. Insert exactly one canonical template row per (firm, name).
    const templateIdByKey = new Map<string, Id<"templates">>();
    for (const key of need) {
      const [firmName, name] = key.split("\u0000");
      const firmId = firmIdByName[firmName];
      if (!firmId) continue;
      const existing = await ctx.db
        .query("templates")
        .withIndex("by_firmId", (q) => q.eq("firmId", firmId))
        .filter((q) => q.eq(q.field("name"), name))
        .first();
      if (existing) {
        templateIdByKey.set(key, existing._id);
      } else {
        const fields = canonicalFields.get(key) as unknown as {
        name: string;
        phases: number;
        target: string;
        dailyLoss: string;
        maxLoss: string;
        drawdown: string;
        consistency: string;
        feeRefund: boolean;
        platforms: string;
      };
      const id = await ctx.db.insert("templates", { firmId, ...fields });
        templateIdByKey.set(key, id);
      }
    }

    // 5. Point every legacy account at its firmId / templateId and drop the
    //    denormalized strings.
    for (const account of legacyAccounts) {
      if (!account.firm || !account.template) continue;
      const firmId = firmIdByName[account.firm];
      const templateId = templateIdByKey.get(`${account.firm}\u0000${account.template}`);
      if (!firmId || !templateId) continue;
      await ctx.db.patch(account._id, {
        firmId,
        templateId,
        firm: undefined,
        template: undefined,
        platformLink: undefined,
      } as never);
    }

    // 6. Delete the legacy per-user template rows now that canonical rows exist.
    for (const t of legacyTemplates) {
      if (t.firm) await ctx.db.delete(t._id);
    }

    return { firms: firmNames.size, templates: templateIdByKey.size, accounts: legacyAccounts.length };
  },
});
