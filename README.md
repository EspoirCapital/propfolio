# Propfolio

A portfolio, trade-journal, and payout tracker for forex CFD prop-firm traders —
**FundingPips, FTMO, and FundedNext**. Frontend-only (React + mock data); no
backend, database, or API calls are wired up yet. See `PRD.md` (separate doc)
for the intended Convex data model and roadmap.

## Stack

- React 19 + Vite
- Tailwind CSS (utility classes for layout; custom CSS variables/classes in
  `src/index.css` for the design system)
- `lucide-react` for icons
- `recharts` for the account equity curve

## Getting started

```bash
bun install
bun run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

```bash
bun run build      # production build to dist/
bun run preview    # preview the production build locally
```

## Structure

```
src/
  App.jsx        # all views + mock data (Portfolio, Journal, Payouts,
                 # Certificates, Firms & Rules) — everything lives in
                 # React state, nothing persists on reload
  index.css      # design tokens (colors, fonts) + Tailwind directives
  main.jsx       # entry point
```

## What's here

- **Portfolio** — every purchased challenge/account as a "ledger ticket" card,
  filterable by firm and status, with lifetime invested/received/net KPIs.
- **Account detail** (click a card) — rule snapshot, cost ledger, journaled
  equity curve, linked trades/payouts/certificates.
- **Journal** — trade log with a TradingView link field per trade.
- **Payouts** — payout records with proof links and paid/processing totals.
- **Certificates** — passing and payout proof gallery.
- **Firms & Rules** — the account-type templates (FundingPips 1-Step/2-Step/
  2-Step Pro/Zero, FTMO Challenge/Swing, FundedNext Stellar/Express) as
  editable data, not hardcoded logic.

## Not yet wired up

- No persistence (refresh clears anything you add in the Journal or Firms &
  Rules forms) — that's the Convex layer described in the PRD.
- No MatchTrader/MT4/MT5 integration — trades are manual entries for now.
