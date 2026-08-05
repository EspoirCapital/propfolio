import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),
    banned: v.optional(v.boolean()),
    inviteCode: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  invites: defineTable({
    code: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
    maxUses: v.optional(v.number()),
    usedByIds: v.optional(v.array(v.id("users"))),
    usedById: v.optional(v.id("users")),
    usedAt: v.optional(v.number()),
  }).index("by_code", ["code"]),

  settings: defineTable({
    userId: v.id("users"),
    displayFormat: v.string(),
    beThreshold: v.number(),
    mfeThreshold: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  firms: defineTable({
    name: v.string(),
    platformLink: v.optional(v.string()),
  }).index("by_name", ["name"]),

  templates: defineTable({
    firmId: v.id("firms"),
    name: v.string(),
    phases: v.number(),
    target: v.string(),
    dailyLoss: v.string(),
    maxLoss: v.string(),
    drawdown: v.string(),
    consistency: v.string(),
    feeRefund: v.boolean(),
    platforms: v.string(),
  }).index("by_firmId", ["firmId"]),

  accounts: defineTable({
    userId: v.id("users"),
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
    notes: v.optional(v.string()),
    archived: v.boolean(),
    chainId: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  trades: defineTable({
    userId: v.id("users"),
    accountId: v.id("accounts"),
    date: v.string(),
    symbol: v.string(),
    side: v.string(),
    lots: v.number(),
    risk: v.number(),
    pnl: v.number(),
    session: v.string(),
    tag: v.string(),
    tvLink: v.string(),
    rating: v.string(),
    notes: v.string(),
    mfeR: v.optional(v.union(v.number(), v.null())),
    maeR: v.optional(v.union(v.number(), v.null())),
    archived: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_accountId", ["accountId"]),

  payouts: defineTable({
    userId: v.id("users"),
    accountId: v.id("accounts"),
    requestedDate: v.string(),
    amount: v.number(),
    split: v.string(),
    method: v.string(),
    proofLink: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_accountId", ["accountId"]),

  certificates: defineTable({
    userId: v.id("users"),
    accountId: v.id("accounts"),
    type: v.string(),
    date: v.string(),
    link: v.string(),
    label: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_accountId", ["accountId"]),

  copyLinks: defineTable({
    userId: v.id("users"),
    masterAccountId: v.id("accounts"),
    slaveAccountId: v.id("accounts"),
  })
    .index("by_userId", ["userId"])
    .index("by_masterAccountId", ["masterAccountId"]),

  symbols: defineTable({
    name: v.string(),
    category: v.string(),
    aliases: v.optional(v.array(v.string())),
  }).index("by_name", ["name"]),
});
