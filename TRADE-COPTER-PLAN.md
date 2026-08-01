# Trade Copier — Build Plan

Automated trade copier for fundingpips (MatchTrader), remote-controlled from the propfolio website. The daemon does all trading work on the user's PC (own IP); the website is a dashboard + remote control.

**Hard requirement:** zero manual steps for the end user. Anything manual breaks the workflow. The daemon provisions, monitors, and re-provisions itself.

---

## 1. Stack

| Piece | Technology | Runs where |
|---|---|---|
| Daemon | TypeScript / Bun, compiled single binary (`.exe` on Windows) | User's PC |
| Website | Propfolio (React + Vite, unchanged stack), hosted on Vercel | propfolio.vercel.app |

**Connections:**

- daemon ↔ fundingpips: HTTPS MatchTrader API (from user's IP)
- daemon ↔ browser: localhost REST + WebSocket (CORS open to propfolio.vercel.app)

## 2. Architecture

```
┌─────────────────────────────────────────────┐
│  propfolio.vercel.app (website)             │
│  Dashboard + remote control only            │
│  No trading, no polling, no credentials     │
└──────────────────┬──────────────────────────┘
                   │ localhost REST + WebSocket
                   │ (browser on the user's PC)
┌──────────────────▼──────────────────────────┐
│  Daemon (user's PC, headless service)       │
│  Engine · adapter · config · status push    │
│  All fundingpips calls come from here       │
└──────────────────┬──────────────────────────┘
                   │ HTTPS API
        ┌──────────▼───────────┐
        │  fundingpips (MT)    │
        └──────────────────────┘
```

### Website (propfolio.vercel.app)

- `src/lib/copier.js` — thin client to the daemon (fetch + WebSocket).
- `CopytradingView` (name unchanged) gains:
  - **Connect panel**: fundingpips email/password + cf_clearance/UA → saved via daemon config.
  - **Live panel**: LIVE/PAUSED badge, master + slave balances, positions, pending orders, activity log, Start/Stop/Pause buttons.
- Clusters load/save through the daemon; clusters are saved presets, **one active session** at a time.
- Daemon offline → page shows "daemon offline"; rest of propfolio unaffected.
- Existing cluster form + risk simulator stay as-is.

### Daemon (headless — no TUI)

- **Server**: one local port — serves propfolio's built files, REST endpoints, WebSocket pushes. CORS allowlist: `https://propfolio.vercel.app` + localhost origins.
- **Engine**: existing `src/core/copier.ts` (poll loop, position diffing, multiplier scaling, open/close/cancel, pending orders, pause/resume, seed existing positions, counters, notifications).
- **Adapter**: `MatchTraderAdapter` — wraps the fundingpips client (login, positions, pending, balance, open/close/cancel) with `ClientProfile` (cf_clearance + UA).
- **Persistence**: `copier-config.json` (fundingpips credentials, cf_clearance, user_agent, poll_ms) + `clusters.json` (cluster presets). Credentials never leave the daemon.
- **Status snapshot**: balances, positions, pending, log, live/paused, last poll, counters — rebuilt every poll tick and pushed to connected browsers.
- **Endpoints**: `GET/POST /api/config` · `POST /api/start` · `POST /api/stop` · `POST /api/pause` · `GET /api/status` · `GET /api/log` · `WS /ws`.
- Plain text logs to its own console only.

### Security / pairing (one-click)

- Daemon listens on `127.0.0.1` only; accepts calls only from allowed origins.
- One-time pairing: daemon generates a token on first run; the website opens the daemon's local pair page in a new tab; one click stores the token in the browser. All commands require the token.

## 3. Locked decisions

- **TS/Bun for the daemon** — engine already exists and is tested; one language across the whole stack. Language speed is irrelevant here (network-bound workload).
- **TUI is deprecated** — no further TUI work after the core Cloudflare changes.
- **No rename** — the propfolio section stays "Copytrading".
- **One active session**; clusters = presets.
- **Local-only for now** — browser must be on the same machine as the daemon. Remote access (tunnel / relay) is deferred, not now.
- **Polling never used in the web version** — live WebSocket pushes only.

## 4. Phases

1. **Core Cloudflare work** — `ClientProfile` (cf_clearance + user_agent) in `src/api/client.ts`, config fields, engine UA passing, fix failing tests, typecheck green.
2. **Daemon** — MatchTrader: server, REST + WebSocket, config/clusters persistence, endpoint tests, live smoke with real credentials.
3. **Propfolio integration** — `src/lib/copier.js`, Connect + Live panels, Start/Stop/Pause, one-click pairing, build, manual end-to-end locally.
4. **Later (deferred)** — remote access channel (tunnel or relay) so the site works away from home.

## 5. Verification

- `bun test` + `bun run typecheck` green in the copier repo.
- Daemon endpoint tests with mocked fetch; live smoke with real credentials.
- `npm run build` in propfolio; manual end-to-end: create cluster → connect → start → watch live status → pause/stop.
