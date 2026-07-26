# EC PROPFOLIO — Agent Guide

## What this is

Prop firm trading portfolio tracker (FundingPips, FTMO, FundedNext). React SPA, no backend, all mock data in `src/constants.js`. Refresh loses nothing — data is hardcoded.

## Stack

- React 19 + Vite 5, pure JSX (no TypeScript, no tests, no lint config)
- Tailwind CSS utilities + custom CSS variables/design system in `src/index.css`
- `@tanstack/react-router` for client-side routing
- `recharts` for equity curve charts
- `lucide-react` for icons
- Package manager: bun

## Commands

```bash
bun install          # install deps
bun run dev          # dev server at localhost:5173
bun run build        # production build to dist/
bun run preview      # preview prod build locally
```

No lint, typecheck, or test commands exist. `npm run build` also works.

## Architecture

```
src/
  main.jsx           # entry point
  App.jsx             # (legacy, now just re-exports router)
  router.jsx          # all routes, Layout with sidebar, page components
  context.jsx         # AppProvider — single React context for all state
  hooks.js            # useDerived — computed fields from accounts/trades/payouts
  constants.js        # FIRMS, TEMPLATES, initialAccounts, initialTrades, etc.
  utils.js            # money(), formatDateUK(), computeOutcome(), helpers
  index.css           # design tokens (.pd-* classes, CSS variables)
  components/         # reusable UI: KpiTile, EquityCurve, DatePicker, Select, etc.
  views/              # page-level components: OverviewView, AccountsView, etc.
```

## Key conventions

### Domain rules (prop trading)

- **P&L** = simulated trading performance on the firm's virtual capital. NOT real income.
- **NET** = payouts + refunds - costs/fees. This is real money.
- **Refunds** = challenge fee returned on first payout (firm-specific). Real cash, not P&L.
- **Max/daily loss limits** are checked against simulated P&L only, never against refunds.
- Break-even threshold: `|pnl| <= (beThreshold/100) * |risk|` (default 10%). Not `pnl === 0`.
- Dates stored as YYYY-MM-DD, displayed as DD/MM/YYYY via `formatDateUK()`.

### Code rules

- **No unicode escapes** — use Lucide icons (Check, Circle, X) and literal characters (—, ·, •).
- **No emojis or `\u` escapes** anywhere in source.
- All native `window.confirm` replaced with `<ConfirmModal>`.
- All `<input type="date">` replaced with `<DatePicker>`.
- All native `<select>` replaced with styled `<Select>`.
- Sidebar: fixed, 224px wide, `position: fixed`, full height. `.pd-sidebar` class in CSS.
- Brand: "EC PROPFOLIO" — `pd-mono text-sm font-semibold tracking-widest`, brass accent.

### Data flow

- `context.jsx` holds all state via `useState` — no persistence, no API.
- `hooks.js` `useDerived()` computes: per-account net, refund, targetPct, outcome stats.
- `templates` define phases, targets, feeRefund per firm. Phase count determines pass behavior.
- `nextStatus(status, phaseCount)` in `utils.js` computes the next phase on pass.

### Styling

- Dark theme. Design tokens as CSS variables in `index.css`: `--ink`, `--ledger`, `--sand`, `--brass`, `--sage`, `--brick`, `--slate`, `--sand-dim`, `--line`, `--line-soft`.
- Fonts: IBM Plex Mono (monospace/brand), IBM Plex Sans (UI), Big Shoulders Display (headings).
- All UI components use `.pd-*` prefixed classes for styling.
