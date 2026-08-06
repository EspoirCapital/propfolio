# The O.A.T. System (One At a Time)
*A Comprehensive Guide to Prop Firm Risk & Account Management*

---

## Overview & Core Philosophy

The **O.A.T. System** (**O**ne **A**t a **T**ime System), created by Kimmel Trading, is an account management and risk allocation framework engineered specifically for prop firm traders. 

Most funded traders fall into a common trap: once funded, they trade all their accounts simultaneously at high risk in pursuit of a single massive payout. Variance, market drawdown, and strict prop firm trailing rules inevitably catch up, wiping out all accounts simultaneously and resulting in zero net payouts.

The O.A.T. System decouples portfolio growth from active market exposure. Instead of chasing a single $50,000 payout, the system focuses on **stacking smaller, repeatable payouts** (roughly 1% of each account's funded size, e.g., $500 on a $50k account) across distinct batches of accounts to achieve a consistent **$10,000+ per month** while preserving capital reserves.

---

## Key System Parameters

| Parameter | Standard Rule | Notes |
| :--- | :--- | :--- |
| **Active Capital Allocation** | **30%** of total accounts | Maximize variance buffer |
| **Reserve Capital Allocation**| **70%** of total accounts | Standby / backup capital |
| **Minimum Starting Pool** | **3 Funded Accounts** | Required to initiate 30/70 split |
| **Payout Floor** | **~1% of funded size**| Minimum payout to lock in (e.g. $500 on a $50k) |
| **Evaluation Risk** | **Aggressive / High %** | Fast-pass evaluation phase |
| **Funded Account Risk** | **~1% per trade** | Conservative capital preservation |
| **Rotation Trigger** | **Target Profit / Payout Secured** | Switch active batch immediately |

---

## System Architecture: Portfolio Allocation

```
                        [ TOTAL FUNDED PORTFOLIO ]
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
  [ ACTIVE BATCH: 30% ]                             [ RESERVE POOL: 70% ]
  • Connected via Trade Copier                      • Idle / Untouched
  • Managed with ~1% Risk                           • Pure Capital Backup
  • Traded to Profit Lock-in                        • Activated only upon rotation
```

---

## The Initial Scaling Progression (From 1 Account to Batches)

The 30/70 architecture only activates once you hold a minimum pool of 3 funded accounts. Before that, you climb a specific ladder from a single account, locking payouts at each rung to fund the next challenge:

```
[ 1 Funded Account ]
       │
       ▼   (Secure 1st payout + refund)
[ 2 Funded Accounts ]
       │
       ▼   (Secure payouts on both accounts)
[ 3+ Funded Accounts ]
       │
       ▼   (Apply full O.A.T. 30/70 batching rule)
[ Multi-Batch Scaling Engine ]
```

### Stage 1: Single-Account Lock-In
1. Start with 1 funded account.
2. Trade it conservatively to lock in your very first payout (e.g., $500).
3. **The Goal:** this payout recovers the evaluation fee plus refund, making your initial investment fully recouped and your base zero-risk.
4. Once profit is locked, stop trading this account and buy your second challenge.

### Stage 2: The Two-Account Rotation
1. Pass the new challenge so you now hold 2 funded accounts.
2. Instead of trading both at once, trade Account 1 until profit is locked, then rotate to Account 2 and lock that in.
3. Now you have 2 locked payouts coming in, generating surplus capital.

### Stage 3: The Three-Account Threshold (System Activation)
1. Reinvest the surplus payout money into a third challenge to get 3 funded accounts.
2. Once you reach 3 funded accounts, you unlock the full O.A.T. architecture: 1 account active (30%), 2 accounts in reserve (70%).

### Stage 4: Full Batch Scaling
1. As payouts continue to stack, scale up the total pool.
2. 6 accounts total = 2 active in Batch 1, 4 in reserve.
3. 9 accounts total = 3 active in Batch 1, 6 in reserve.

---

## Step-by-Step Operational Workflow

### Phase 1: Capital Recycling & Risk-Free Base
1. **Pass Evaluation Phase:** Risk higher per trade on challenge accounts to pass quickly.
2. **First Payout Target:** Earn an initial modest payout (e.g., $500 on a $100k account).
3. **Recouping Investment:** The first payout covers the challenge evaluation fee plus refund, rendering all subsequent challenges and funded accounts **100% risk-free**.
4. **Build Minimum Pool:** Repeat the [Initial Scaling Progression](#the-initial-scaling-progression-from-1-account-to-batches) (1 → 2 → 3 accounts) until you hold a minimum pool of **3 funded accounts**.

### Phase 2: Active Batch Management & Maintenance
1. **Deploy Active Batch:** Group accounts into 30% active units (e.g., Batch 1 = Accounts 1–3).
2. **Execute Strategy:** Trade only the active batch using conservative risk management (~1% per trade). Keep the remaining 70% of accounts idle.
3. **Profit Lock-In:** As soon as the active batch reaches its payout target, **stop actively trading those accounts immediately**.
4. **Maintenance Mode:** If the prop firm enforces minimum trading days (e.g., Futures / Topstep):
   - Place micro-lot trades or secure small minimum days (e.g., $150/day).
   - Maintain account status without exposing accumulated profit to market risk while awaiting payout clearance.

### Phase 3: Rotation & Scaling
1. **Rotate to Reserve:** Once Batch 1 profit is locked in, switch active trading to **Batch 2** (the next 30% allocation).
2. **Repeat Cycle:** Achieve profit target on Batch 2, lock in, put on maintenance, and rotate to Batch 3.
3. **Stacking Payouts:** By rotating sequentially, you secure multiple smaller payouts simultaneously (e.g., 3 accounts × $500 = $1,500 per batch, at the ~1% floor) rather than risking all accounts at once.

---

## Drawdown Rules & Risk Management

Handling losing periods correctly is the single most critical factor determining long-term success under the O.A.T. System.

```
                           [ ACTIVE BATCH IN DRAWDOWN ]
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
  [ CONSERVATIVE PROTOCOL (RECOMMENDED) ]        [ AGGRESSIVE PROTOCOL (HIGH RISK) ]
  • STAY on current batch                        • Leave batch in drawdown (e.g., -2%)
  • Trade until recovered OR blown               • Switch to next batch for A+ setup
  • Prevents multi-batch collapse                • WARNING: Can trigger gambling cycle
```

### Protocol 1: Conservative Rule (Recommended)
* If your active batch enters drawdown, **you MUST stay on that active batch**.
* Continue trading that batch until you either **recover into profit/payout** OR **completely blow the batch**.
* **Why:** Switching to a fresh batch while negative encourages emotional batch-hopping, causing multiple batches to sit in drawdown simultaneously and triggering a destructive gambling cycle.

### Protocol 2: Mathematical Advantage of Batching
Even if a batch blows, the system's asymmetric structure protects overall profitability:

$$	ext{Loss from Blown Batch (3 Accounts)} = -10\% \quad (	ext{Cost: } \$3,000 	ext{ in evaluation fees})$$

$$	ext{Gain from Next Batch (2\% Target on 3 Accounts)} = +\$6,000 	ext{ in Payouts}$$

$$	ext{Net Realized Profit} = \$6,000 - \$3,000 = +\$3,000$$

---

## Summary Checklist for Implementation

- [ ] Climb the scaling ladder: 1 funded → first payout locked → 2 funded → both locked → 3 funded (system activation).
- [ ] Accumulate at least 3 funded prop firm accounts.
- [ ] Divide accounts into 30% active / 70% reserve batches.
- [ ] Risk ~1% per trade on the active batch via trade copier.
- [ ] Stop active trading immediately once profit target is reached on active batch.
- [ ] Run maintenance mode (micro-lots/small days) if required for payout eligibility.
- [ ] Rotate to the next reserve batch and repeat the cycle.
- [ ] Maintain strict discipline: never abandon a batch in drawdown to batch-hop.

---

# Implementation Plan — Live O.A.T. Dashboard

## Goal
A new in-app page at `/oat` ("OAT System" in the sidebar) that runs the O.A.T. system on the trader's real data (accounts, trades, payouts) and carries the full guide as reference. No schema, backend, or data-model changes — everything is derived.

## 1. Derived logic — `src/hooks.js`
Add a self-contained `oat` object to the `useDerived` return:

- **Pool** — accounts with status `funded` or `passed`, not archived.
- **Ready** — `pool.length >= 3` (guide minimum).
- **Split 30/70** — `activeCount = max(1, round(pool.length * 0.3))`.
  - Partition pool into **tradable** (no payout received yet) and **locked** (has received a payout → "profit secured").
  - Active = first `activeCount` of tradable (oldest creation/last-trade first); Reserve = the rest plus locked.
- **Lock-in** — `received > 0` on an account.
- **Rotation** — when every current active account is locked, surface the next tradable candidate as "next up".
- **Drawdown** — active account with `tradePnl < 0` → Protocol 1 hold note ("stay on batch, no batch-hopping").
- **Risk guard** — for pool accounts, flag trades where `risk / accountSize > 1%` (fall back to current account size). One violation entry per flagged trade: date, symbol, risk %, $, size.

## 2. New view — `src/views/OatView.jsx`
Styled with the existing design system (`--ledger`, `--line`, `pd-label`, `pd-mono`, brass/sage/brick). Sections:

1. Status KPI row (reuse `KpiTile`): Funded Pool (x/3), Active, Reserve, Payouts secured.
2. 30/70 allocation bar + Active/Reserve account lists with role badges, linking to each account.
3. Rotation block: "trading now", "next up", locked/maintenance list.
4. Drawdown callout when the active account is negative.
5. Risk guard block: violations list or clean state.
6. Reference guide: the full O.A.T. guide rendered as styled JSX below (philosophy, parameters table, architecture diagram, workflow, drawdown rules, checklist with live-ticked derivable items).

## 3. Routing — `src/router.jsx`
- Import `Target` from lucide-react.
- NAV entry `{ path: "/oat", label: "OAT System", icon: Target }` (after Report).
- `PAGE_META` entry, route component, register in `routeTree`.

## 4. Verification
- `bun run build` (no warnings).
- Review edge cases: empty trades, < 3 funded, all accounts locked, negative active P&L.
- Do not commit or push. Hand over the working tree.

## 5. Initial Scaling Progression (build-up from 1 account)
The page only narrated the system at 3+ funded accounts. Add the ladder the guide describes (locked in the "The Initial Scaling Progression" section above) as a live section on the same page:

- **Derived logic — `src/hooks.js`:** add `ladder` to the `oat` object: `stage = min(3, poolCount)` (0 = nothing, 1/2/3 = rung reached) and `lockedCount` (pool accounts with a payout locked). Pure, so the node test suite covers it.
- **View — `src/views/OatView.jsx`:** new "Scaling ladder" card between the KPI row and the Allocation card, rendered whenever the pool is non-empty:
  1. A 4-node progression (single-account lock-in → two-account rotation → three-account threshold → full batch scaling) with connectors that fill bronze→sage as rungs complete. Node fill: sage = passed, brass = current, outline = upcoming.
  2. A live status line that narrates the exact next action (e.g. "first payout locked — fund challenge #2") driven by pool count + locked count.
  3. Four stage cards with the guide's copy and a done/active/next tag.
- **Phase 3 workflow card:** the "per payout cycle" line is now live, not static copy. `payoutCycle` in `derive()` = (avg realised payout per locked account × active batch size); before any payout is locked it falls back to 1% of the smallest pool account ($500 empty-floor), flagged `assumed` so the UI can say which it is.
- **Allocation card:** when pool < 3, show a note that the 30/70 split engages at 3 funded accounts (the 30/70 bar is meaningless mid-ladder).
- **Guide:** new "Initial Scaling Progression" section (Stage 1–4, named stages not "Phases" to avoid colliding with the operational Phase 1–3), cross-linked from Phase 1, plus a checklist line.
- **Verification:** new ladder scenarios in `/tmp/opencode/oat-test.mjs` (1 fund/0 lock, 2 fund/0 lock, 3 fund, 6→2 active, 9→3 active), `bun run build`. Still no commit or push.
