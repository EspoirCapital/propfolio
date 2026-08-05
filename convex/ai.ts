import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b:free";

const SYSTEM_PROMPT = `You are a professional prop-firm trading performance analyst.
The trader logs MFE (max favorable excursion, in R) and MAE (max adverse excursion, in R) per trade, but often leaves them blank, so they may be missing entirely.

If MFE/MAE data is present, answer exactly two questions, briefly, in plain English:
1. Entry: should they keep taking market orders, or place a limit order at their average MAE depth?
2. Target: should they keep their current take-profit, or set it at their average MFE?

If MFE/MAE data is missing, instead give a plain-English read of their edge from the available stats: win rate, average RR on winners, EV per trade, how winners compare to losers, and risk behaviour. Give one concrete, actionable takeaway.

Rules:
- Base every claim strictly on the numbers provided. Do not invent statistics.
- A value of "—" means that stat was not logged. Ignore it, never comment on it, never ask for it.
- Never dismiss the numbers as a small sample or call them inconclusive. In prop-firm challenges, 10-40 trades is a normal full sample and enough to act on.
- Do not recommend trailing stops or partial-profit exits.
- "Missed" trades are trades that never reached the level, so they would be skipped, not taken.
- Keep it under ~120 words. No markdown headers, no bullets.`;

export const analyze = action({
  args: {
    scope: v.string(),
    tradeCount: v.number(),
    wins: v.number(),
    losses: v.number(),
    winRate: v.number(),
    avgRR: v.optional(v.string()),
    ev: v.optional(v.string()),
    mfeThreshold: v.number(),
    avgMfe: v.string(),
    avgMae: v.string(),
    capture: v.string(),
    giveback: v.string(),
    limitWr: v.string(),
    limitSub: v.string(),
    comboWr: v.string(),
    comboSub: v.string(),
    wrAtAvgMfe: v.string(),
    wrSub: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in.");

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter is not configured. Set the OPENROUTER_API_KEY environment variable.");
    }

    const hasMfe = args.avgMfe !== "—" || args.avgMae !== "—";

    const userContent = [
      `Context: ${args.scope}`,
      `MFE/MAE data: ${hasMfe ? "logged" : "not logged (fields left blank)"}`,
      `Trades: ${args.tradeCount} (${args.wins}W / ${args.losses}L), win rate ${args.winRate}%, avg RR on winners ${args.avgRR || "n/a"}, EV per trade ${args.ev || "n/a"}`,
      hasMfe
        ? [
            `MFE minimum threshold: ${args.mfeThreshold}R (trades below it excluded from the average)`,
            `Avg MFE: ${args.avgMfe}R | Avg MAE: ${args.avgMae}R | Capture: ${args.capture} (giveback ${args.giveback}R)`,
            `WR w/ limit @ avg MAE: ${args.limitWr} | ${args.limitSub}`,
            `WR @ avg MFE: ${args.wrAtAvgMfe} | ${args.wrSub}`,
            `WR limit MAE + TP MFE: ${args.comboWr} | ${args.comboSub}`,
          ].join("\n")
        : "No MFE/MAE figures available; base the read on the base stats above.",
    ].join("\n");

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenRouter request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenRouter returned an empty response.");
    return text.trim();
  },
});
