export const DEFAULT_SETTINGS = { displayFormat: "dollar", beThreshold: 10, mfeThreshold: 1 };

export const money = (n) => {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export function formatDisplay(dollars, format, accountSize, riskDollars) {
  switch (format) {
    case "percent": {
      if (!accountSize) return `${dollars}`;
      return `${((dollars / accountSize) * 100).toFixed(2)}%`;
    }
    case "rr": {
      if (!riskDollars || riskDollars === 0) return `${dollars}`;
      return `${(dollars / riskDollars).toFixed(1)}R`;
    }
    default: return money(dollars);
  }
}

export function computeOutcome(pnl, risk, beThreshold) {
  if (!risk || risk === 0) return pnl > 0 ? "W" : pnl < 0 ? "L" : "BE";
  const zone = (beThreshold / 100) * Math.abs(risk);
  if (Math.abs(pnl) <= zone) return "BE";
  return pnl > 0 ? "W" : "L";
}

// Expected value per trade, in R: average pnl/risk across trades with risk,
// excluding break-even outcomes. Trades must carry `outcome`, `risk`, `pnl`.
export function computeEv(trades) {
  const pool = trades.filter((t) => t.risk > 0 && t.outcome !== "BE");
  if (!pool.length) return null;
  return pool.reduce((s, t) => s + (t.pnl / t.risk), 0) / pool.length;
}

export function formatEv(ev) {
  if (ev === null || ev === undefined || isNaN(ev)) return "—";
  return `${ev >= 0 ? "+" : ""}${ev.toFixed(2)}R`;
}

export const OUTCOME_META = {
  W: { color: "var(--sage)", bg: "rgba(111,176,139,0.12)" },
  L: { color: "var(--brick)", bg: "rgba(193,89,75,0.14)" },
  BE: { color: "var(--slate)", bg: "rgba(137,146,163,0.12)" },
};

export function formatDateUK(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// MFE/MAE stats across any trade list (trades must carry `outcome`, `risk`, `pnl`).
// Returns display-ready values: avgMfe, avgMae, capture, giveback, limitWr,
// limitSub, comboWr, comboSub, wrAtAvgMfe, wrSub — strings ("—" when no data).
export function computeMfeMaeStats(trades, mfeMinR = 1) {
  const maeWins = trades.filter((t) => t.maeR != null && t.outcome === "W");
  const avgMaeR = maeWins.length ? maeWins.reduce((s, t) => s + t.maeR, 0) / maeWins.length : null;
  const avgMae = avgMaeR !== null ? avgMaeR.toFixed(2) : "—";

  const mfeSet = trades.filter((t) => t.mfeR != null && t.risk > 0 && t.mfeR > mfeMinR);
  const avgMfeR = mfeSet.length ? mfeSet.reduce((s, t) => s + t.mfeR, 0) / mfeSet.length : null;
  const avgRealizedOfMfe = mfeSet.length
    ? mfeSet.reduce((s, t) => s + (t.pnl / t.risk), 0) / mfeSet.length
    : null;
  const avgMfe = avgMfeR !== null ? avgMfeR.toFixed(2) : "—";
  const capture = avgMfeR !== null && avgRealizedOfMfe !== null && avgMfeR > 0
    ? `${Math.round((avgRealizedOfMfe / avgMfeR) * 100)}%` : "—";
  const giveback = avgMfeR !== null && avgRealizedOfMfe !== null
    ? (avgMfeR - avgRealizedOfMfe).toFixed(2) : "—";

  const limitPool = trades.filter((t) => t.maeR != null && t.risk > 0 && t.outcome !== "BE" && avgMaeR !== null);
  const limitFills = limitPool.filter((t) => t.maeR >= avgMaeR);
  const limitMissedTrades = limitPool.filter((t) => t.maeR < avgMaeR);
  const missedPct = limitPool.length ? Math.round((limitMissedTrades.length / limitPool.length) * 100) : null;
  const missedW = limitMissedTrades.filter((t) => t.outcome === "W").length;
  const missedL = limitMissedTrades.filter((t) => t.outcome === "L").length;
  const missedWPct = limitMissedTrades.length ? Math.round((missedW / limitMissedTrades.length) * 100) : null;
  const missedLPct = limitMissedTrades.length ? Math.round((missedL / limitMissedTrades.length) * 100) : null;
  const limitWr = limitFills.length
    ? `${Math.round((limitFills.filter((t) => t.outcome === "W").length / limitFills.length) * 100)}%` : "—";
  const limitSub = avgMaeR !== null && limitPool.length && missedPct !== null && missedWPct !== null && missedLPct !== null
    ? `+${avgMaeR.toFixed(2)}R per trade · ${missedPct}% missed (${missedWPct}%W · ${missedLPct}%L)` : "—";

  const comboPool = trades.filter((t) => t.mfeR != null && t.maeR != null && t.risk > 0 && t.outcome !== "BE" && avgMaeR !== null && avgMfeR !== null);
  const comboFills = comboPool.filter((t) => t.maeR >= avgMaeR);
  const comboWinners = comboFills.filter((t) => t.mfeR >= avgMfeR);
  const comboMissedTrades = comboPool.filter((t) => t.maeR < avgMaeR);
  const comboMissedPct = comboPool.length ? Math.round((comboMissedTrades.length / comboPool.length) * 100) : null;
  const comboMissedW = comboMissedTrades.filter((t) => t.outcome === "W").length;
  const comboMissedL = comboMissedTrades.filter((t) => t.outcome === "L").length;
  const comboMissedWPct = comboMissedTrades.length ? Math.round((comboMissedW / comboMissedTrades.length) * 100) : null;
  const comboMissedLPct = comboMissedTrades.length ? Math.round((comboMissedL / comboMissedTrades.length) * 100) : null;
  const comboWr = comboFills.length
    ? `${Math.round((comboWinners.length / comboFills.length) * 100)}%` : "—";
  const comboRrGained = comboWinners.length && avgMfeR !== null
    ? (avgMfeR - comboWinners.reduce((s, t) => s + (t.pnl / t.risk), 0) / comboWinners.length).toFixed(2)
    : null;
  const comboSub = comboRrGained !== null && comboMissedPct !== null && comboMissedWPct !== null && comboMissedLPct !== null
    ? `+${comboRrGained}R per trade · ${comboMissedPct}% missed (${comboMissedWPct}%W · ${comboMissedLPct}%L)` : "—";

  const mfeDecisions = trades.filter((t) => t.mfeR != null && t.risk > 0 && t.outcome !== "BE");
  const mfeWinners = mfeDecisions.filter((t) => avgMfeR !== null && t.mfeR >= avgMfeR);
  const wrAtAvgMfe = mfeDecisions.length
    ? `${Math.round((mfeWinners.length / mfeDecisions.length) * 100)}%` : "—";
  const mfeMissedTrades = mfeDecisions.filter((t) => avgMfeR === null || t.mfeR < avgMfeR);
  const mfeMissedPct = mfeDecisions.length
    ? Math.round((mfeMissedTrades.length / mfeDecisions.length) * 100) : null;
  const mfeMissedW = mfeMissedTrades.filter((t) => t.outcome === "W").length;
  const mfeMissedL = mfeMissedTrades.filter((t) => t.outcome === "L").length;
  const mfeMissedWPct = mfeMissedTrades.length ? Math.round((mfeMissedW / mfeMissedTrades.length) * 100) : null;
  const mfeMissedLPct = mfeMissedTrades.length ? Math.round((mfeMissedL / mfeMissedTrades.length) * 100) : null;
  const rrGained = mfeWinners.length && avgMfeR !== null
    ? (avgMfeR - mfeWinners.reduce((s, t) => s + (t.pnl / t.risk), 0) / mfeWinners.length).toFixed(2)
    : null;
  const wrSub = rrGained !== null && mfeMissedPct !== null && mfeMissedWPct !== null && mfeMissedLPct !== null
    ? `+${rrGained}R per trade · ${mfeMissedPct}% missed (${mfeMissedWPct}%W · ${mfeMissedLPct}%L)` : "TP at avg MFE";

  return { avgMfe, avgMae, capture, giveback, limitWr, limitSub, comboWr, comboSub, wrAtAvgMfe, wrSub };
}

export function parseDateUK(ukDate) {
  if (!ukDate) return "";
  const [d, m, y] = ukDate.split("/");
  if (!d || !m || !y) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function getAccountLabel(account) {
  if (!account) return "";
  const login = account.platformLogin || "No login";
  const firm = account.firmName || account.firm || "";
  return `${firm} $${(account.size / 1000).toFixed(0)}K · ${login}`;
}

export const RATING_META = {
  green: { color: "var(--sage)", label: "Good" },
  amber: { color: "var(--brass)", label: "Off" },
  red: { color: "var(--brick)", label: "Bad" },
};

const RATING_WEIGHTS = { green: 2, amber: 1, red: 0 };

// Account health from trade ratings: weighted average of green/amber/red,
// returned as a 0-100 score plus the per-rating counts.
export function computeHealth(trades) {
  const counts = { green: 0, amber: 0, red: 0 };
  trades.forEach((t) => {
    if (counts[t.rating] !== undefined) counts[t.rating]++;
  });
  const total = counts.green + counts.amber + counts.red;
  if (!total) return { score: null, counts, total };
  const weighted = (RATING_WEIGHTS.green * counts.green) + (RATING_WEIGHTS.amber * counts.amber) + (RATING_WEIGHTS.red * counts.red);
  return { score: Math.round((weighted / (2 * total)) * 100), counts, total };
}

export function healthAccent(score) {
  if (score === null || score === undefined) return "var(--sand)";
  if (score >= 70) return "var(--sage)";
  if (score >= 40) return "var(--brass)";
  return "var(--brick)";
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun

// Per-weekday average R per trade. The pool matches computeEv (risk > 0,
// break-even excluded). Trades must carry `date` (YYYY-MM-DD), `risk`, `pnl`,
// `outcome`. Returns all seven days in Mon..Sun order, each
// { day, label, avg, n } (avg null, n 0 when untraded).
export function computeDayProfile(trades) {
  const byDay = {};
  trades.forEach((t) => {
    if (!(t.risk > 0) || t.outcome === "BE") return;
    const dow = new Date(`${t.date}T00:00:00`).getDay();
    if (!byDay[dow]) byDay[dow] = { sum: 0, n: 0 };
    byDay[dow].sum += t.pnl / t.risk;
    byDay[dow].n += 1;
  });
  return WEEK_ORDER.map((dow) => {
    const v = byDay[dow];
    return { day: dow, label: DAY_LABELS[dow], avg: v ? v.sum / v.n : null, n: v ? v.n : 0 };
  });
}

// Best and worst trading day by average R per trade, from computeDayProfile.
// Returns { best, worst } where each is { day, label, avg, n } or null when empty.
export function computeDayEdge(trades) {
  const traded = computeDayProfile(trades).filter((d) => d.n > 0);
  let best = null;
  let worst = null;
  traded.forEach((d) => {
    if (!best || d.avg > best.avg) best = d;
    if (!worst || d.avg < worst.avg) worst = d;
  });
  return { best, worst };
}

export function nextStatus(status, phaseCount) {
  if (phaseCount <= 0) return null;
  if (status === "phase_1") return phaseCount >= 2 ? "phase_2" : "funded";
  if (status === "phase_2") return phaseCount >= 3 ? "phase_3" : "funded";
  if (status === "phase_3") return "funded";
  return null;
}

export function nextStatusLabel(status, phaseCount) {
  const next = nextStatus(status, phaseCount);
  if (!next) return null;
  if (next === "funded") return "Funded";
  return next.replace("phase_", "Phase ");
}

const FRIENDLY_ERRORS = {
  "Invalid invite code.": "That invite code isn't valid. Check the link you were sent and try again.",
  "Invite code is required.": "An invite code is required. Use the link from your invitation.",
  "This invite has already been used.": "That invite link has already been used. Ask the admin for a new one.",
  "This invite has expired.": "That invite link has expired. Ask the admin for a new one.",
  "This invite has reached its maximum uses.": "That invite link has reached its limit. Ask the admin for a new one.",
  "InvalidAccountId": "No account is linked to that email. Check the address and try again.",
  "InvalidSecret": "Incorrect email or password. Check your details and try again.",
  "Invalid credentials": "Incorrect email or password. Check your details and try again.",
  "Invalid password": "Password must be at least 8 characters.",
  "TooManyFailedAttempts": "Too many failed attempts. Wait a few minutes and try again.",
  "Not signed in.": "Your session has expired. Please sign in again.",
  "This account has been suspended.": "This account has been suspended. Contact the admin if you think this is a mistake.",
  "You cannot ban yourself.": "You can't ban your own account.",
  "Only admins can ban users.": "Only admins can ban users.",
  "Only admins can create invites.": "Only admins can create invite links.",
  "Only admins can revoke invites.": "Only admins can revoke invite links.",
  "Invite not found.": "That invite couldn't be found. It may have been removed.",
  "Only admins can manage roles.": "Only admins can change roles.",
  "You cannot remove your own admin role.": "You can't remove your own admin role.",
  "User not found.": "That user no longer exists. They may have been removed.",
  "Current password is incorrect.": "Current password is incorrect. Try again.",
  "New password must be at least 8 characters.": "New password must be at least 8 characters.",
  "Account not found.": "That account no longer exists. It may have been deleted.",
  "Cluster not found.": "That cluster no longer exists. It may have been deleted.",
  "Template not found.": "That template no longer exists. It may have been deleted.",
  "Trade not found.": "That trade no longer exists. It may have been deleted.",
  "Payout not found.": "That payout record no longer exists. It may have been deleted.",
  "Certificate not found.": "That certificate no longer exists. It may have been deleted.",
};

function lookupFriendly(message) {
  const key = Object.keys(FRIENDLY_ERRORS).find((k) => message.includes(k));
  return key ? FRIENDLY_ERRORS[key] : null;
}

// Turn a raw error (from a Convex mutation, query, or auth action) into a
// short, human-readable message. Never leak request IDs, stack traces, or
// internal Convex prefixes to the end user.
export function friendlyError(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;

  // ConvexError carries the thrown payload in `data`.
  if (err.data !== undefined) {
    const data = typeof err.data === "string" ? err.data : err.data?.message;
    if (data) {
      const mapped = lookupFriendly(data);
      return mapped || data;
    }
  }

  let raw = err.message ? err.message : typeof err === "string" ? err : "";
  if (!raw) return fallback;

  const clean = raw
    .replace(/^\[CONVEX [A-Z]\([^)]*\)\]\s*/g, "")
    .replace(/\[Request ID: [^\]]*\]\s*/g, "")
    .replace(/^Server Error Called by client\s+(?:-|—)\s*/g, "")
    .replace(/\s*Called by client\s*$/g, "")
    .replace(/^Uncaught Error:\s*/g, "")
    .trim()
    .split("\n")[0]
    .replace(/^Uncaught Error:\s*/g, "")
    .trim();

  if (!clean) return fallback;

  const mapped = lookupFriendly(clean);
  if (mapped) return mapped;

  if (/\[CONVEX|Request ID|\.ts:\d|\.js:\d|node_modules| at \w+ \(/.test(clean)) {
    return fallback;
  }

  return clean;
}

// Group accounts that share a chainId into lifecycle "journeys" (phase 1 ->
// phase 2 -> funded). Returns only chains with 2+ members, each member sorted
// by creation date. Accounts without a chainId (or solo chains) are left to the
// caller to render as standalone cards.
export function groupAccountsByChain(accounts) {
  const byId = new Map();
  for (const a of accounts) {
    if (!a.chainId) continue;
    if (!byId.has(a.chainId)) byId.set(a.chainId, []);
    byId.get(a.chainId).push(a);
  }
  const groups = [];
  for (const [chainId, members] of byId) {
    if (members.length > 1) {
      members.sort((a, b) => (a.creationDate < b.creationDate ? -1 : 1));
      groups.push({ chainId, accounts: members });
    }
  }
  return groups;
}

// The active account in a journey is the first one still in progress.
export function activeChainMember(accounts) {
  return accounts.find((a) => ["phase_1", "phase_2", "phase_3"].includes(a.status) && !a.archived) || null;
}
