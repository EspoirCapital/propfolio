import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db.query("symbols").collect();
    return rows
      .map((r) => ({ id: r._id, name: r.name, category: r.category, aliases: r.aliases ?? [] }))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  },
});

const SEED = [
  { name: "EURUSD", category: "FX", aliases: ["EUR/USD"] },
  { name: "GBPUSD", category: "FX", aliases: ["GBP/USD"] },
  { name: "USDJPY", category: "FX", aliases: ["USD/JPY"] },
  { name: "AUDUSD", category: "FX", aliases: ["AUD/USD"] },
  { name: "USDCAD", category: "FX", aliases: ["USD/CAD"] },
  { name: "USDCHF", category: "FX", aliases: ["USD/CHF"] },
  { name: "NZDUSD", category: "FX", aliases: ["NZD/USD"] },
  { name: "EURGBP", category: "FX", aliases: ["EUR/GBP"] },
  { name: "EURJPY", category: "FX", aliases: ["EUR/JPY"] },
  { name: "GBPJPY", category: "FX", aliases: ["GBP/JPY"] },
  { name: "XAUUSD", category: "Metals", aliases: ["GOLD", "XAU", "Gold"] },
  { name: "XAGUSD", category: "Metals", aliases: ["SILVER", "XAG", "Silver"] },
  { name: "US30", category: "Indices", aliases: ["DJ30", "WS30", "Dow"] },
  { name: "US100", category: "Indices", aliases: ["NAS100", "NDX", "Nasdaq"] },
  { name: "SPX500", category: "Indices", aliases: ["SP500", "US500", "S&P"] },
  { name: "GER40", category: "Indices", aliases: ["DAX40", "DAX", "Germany40"] },
  { name: "UK100", category: "Indices", aliases: ["FTSE", "UK100Cash"] },
  { name: "JPN225", category: "Indices", aliases: ["Nikkei", "NI225"] },
  { name: "US2000", category: "Indices", aliases: ["RUS2000", "Russell"] },
  { name: "BTCUSD", category: "Crypto", aliases: ["BTC/USD", "BITCOIN"] },
  { name: "ETHUSD", category: "Crypto", aliases: ["ETH/USD", "ETHEREUM"] },
  { name: "SOLUSD", category: "Crypto", aliases: ["SOL/USD"] },
  { name: "BNBUSD", category: "Crypto", aliases: ["BNB/USD"] },
  { name: "XRPUSD", category: "Crypto", aliases: ["XRP/USD"] },
  { name: "ADAUSD", category: "Crypto", aliases: ["ADA/USD"] },
  { name: "DOGEUSD", category: "Crypto", aliases: ["DOGE/USD"] },
  { name: "WTI", category: "Energies", aliases: ["USOIL", "Crude", "CL"] },
  { name: "BRENT", category: "Energies", aliases: ["UKOIL", "Brent"] },
  { name: "NGAS", category: "Energies", aliases: ["Natural Gas", "NATGAS"] },
];

// Idempotent: inserts only symbols whose name is missing. Safe to call
// repeatedly — used to self-seed on first load.
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");
    const existing = await ctx.db.query("symbols").collect();
    const have = new Set(existing.map((s) => s.name));
    let inserted = 0;
    for (const s of SEED) {
      if (have.has(s.name)) continue;
      await ctx.db.insert("symbols", { name: s.name, category: s.category, aliases: s.aliases });
      inserted += 1;
    }
    return inserted;
  },
});
