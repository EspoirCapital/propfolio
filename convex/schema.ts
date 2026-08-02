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
    inviteCode: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  invites: defineTable({
    code: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
    usedById: v.optional(v.id("users")),
    usedAt: v.optional(v.number()),
  }).index("by_code", ["code"]),

  settings: defineTable({
    userId: v.id("users"),
    displayFormat: v.string(),
    beThreshold: v.number(),
    mfeThreshold: v.number(),
  }).index("by_userId", ["userId"]),

  templates: defineTable({
    userId: v.id("users"),
    firm: v.string(),
    name: v.string(),
    phases: v.number(),
    target: v.string(),
    dailyLoss: v.string(),
    maxLoss: v.string(),
    drawdown: v.string(),
    consistency: v.string(),
    feeRefund: v.boolean(),
    platforms: v.string(),
  }).index("by_userId", ["userId"]),

  accounts: defineTable({
    userId: v.id("users"),
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
    notes: v.optional(v.string()),
    archived: v.boolean(),
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

  clusters: defineTable({
    userId: v.id("users"),
    name: v.string(),
    masterAccountId: v.id("accounts"),
    slaves: v.array(v.object({ accountId: v.id("accounts"), riskMultiplier: v.number() })),
    createdAt: v.string(),
  }).index("by_userId", ["userId"]),
});
