# EC PROPFOLIO

A portfolio, trade journal, and payout tracker for forex CFD prop-firm traders — **FundingPips, FTMO, and FundedNext**. Frontend-only React SPA with mock data. No backend, database, or API calls yet.

## Stack

- React 19 + Vite 5
- Tailwind CSS utilities + custom CSS variables/design system (`src/index.css`)
- `@tanstack/react-router` for client-side routing
- `recharts` for equity curve charts
- `lucide-react` for icons
- Bun (package manager)

## Getting started

```bash
bun install
bun run dev        # localhost:5173
bun run build      # production build to dist/
bun run preview    # preview prod build locally
```

## Structure

```
src/
  main.jsx              # entry point
  App.jsx               # re-exports router
  router.jsx            # all routes, Layout, sidebar nav
  context.jsx           # AppProvider — single React context for all state
  hooks.js              # useDerived — computed fields from accounts/trades/payouts
  constants.js          # FIRMS, TEMPLATES, STATUS_META, empty data arrays
  utils.js              # money(), formatDateUK(), computeOutcome(), session helpers
  index.css             # design tokens (.pd-* classes, CSS variables)
  components/           # reusable UI: KpiTile, EquityCurve, DatePicker, Select, etc.
  views/                # page-level components
```

## Features

### Overview dashboard
6 KPI tiles (total invested, total received, net position, payouts, refunds, active accounts). Cumulative P&L equity curve with refund jump points. Monthly performance table with year navigation. Trade calendar heatmap. Session, tag, and symbol performance breakdowns. Recent trades and latest payouts.

### Accounts
Card/list toggle view with KPI tiles. Filter by firm and status. Archive/unarchive accounts. Create, edit, and delete. "Proceed to next phase" and "mark as breach" actions. Ticket cards show P&L percentage, dollar amount, brass progress bar, and target progress.

### Account detail
Full account page with rule snapshot, cost ledger, progression stepper, equity curve, trade journal, payouts, and certificates. Archive/unarchive from toolbar.

### Trade journal
Log trades per account with symbol, direction, entry/exit, P&L, risk, session, tags, rating, and TradingView link. Monthly P&L and RR breakdowns by symbol, session, and tag.

### Payouts
Payout records with proof links, split column (received/processing), and totals by account.

### Certificates
Four certificate types (phase 1/2/3 passing, payout) with auto-generated labels. Filter by account. Add via upload or URL.

### Copy trading
Cluster comparison view for copy-trading analysis.

### Templates
Editable firm templates with phases, targets, fees, and refund rules. Dynamic target percentage inputs per phase. "Refund after first payout" toggle.

### Settings
User profile (name, email). Display format (dollar/percent/RR). Breakeven threshold (default 10%).

### Login
Name + email login (no password). Session stored in localStorage. User-specific settings per account. Logout with confirmation modal.

## Design

Dark theme with brass accents. Custom fonts: IBM Plex Mono (brand), IBM Plex Sans (UI), Big Shoulders Display (headings). Design tokens as CSS variables. Grid dot pattern background. Print-optimized layout. Fixed 224px sidebar.

## Domain rules

- **P&L** = simulated trading performance on firm's virtual capital. Not real income.
- **NET** = payouts + refunds - costs/fees. This is real money.
- **Refunds** = challenge fee returned on first payout (firm-specific). Real cash, not P&L.
- **Break-even** = P&L within threshold % of risk (default 10%).
- All data is mock/empty — refresh loses nothing.

## Not yet wired up

- No persistence (Convex layer planned)
- No broker integration (MatchTrader/MT4/MT5) — trades are manual entries
- No real auth — session is localStorage only, Convex auth coming soon
