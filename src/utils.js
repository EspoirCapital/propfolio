export const DEFAULT_SETTINGS = { displayFormat: "dollar", beThreshold: 10 };

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
// Returns display-ready values: avgMfe, avgMae, capture, giveback, winsRetrace,
// wrAtAvgMfe, wrSub — all strings ("—" when there's no data to compute).
export function computeMfeMaeStats(trades) {
  const maeTrades = trades.filter((t) => t.maeR != null);
  const avgMaeR = maeTrades.length ? maeTrades.reduce((s, t) => s + t.maeR, 0) / maeTrades.length : null;
  const avgMae = avgMaeR !== null ? avgMaeR.toFixed(2) : "—";

  const mfeTrades = trades.filter((t) => t.mfeR != null);
  const mfeSet = mfeTrades.filter((t) => t.risk > 0);
  const avgMfeR = mfeSet.length ? mfeSet.reduce((s, t) => s + t.mfeR, 0) / mfeSet.length : null;
  const avgRealizedOfMfe = mfeSet.length
    ? mfeSet.reduce((s, t) => s + (t.pnl / t.risk), 0) / mfeSet.length
    : null;
  const avgMfe = avgMfeR !== null ? avgMfeR.toFixed(2) : "—";
  const capture = avgMfeR !== null && avgRealizedOfMfe !== null && avgMfeR > 0
    ? `${Math.round((avgRealizedOfMfe / avgMfeR) * 100)}%` : "—";
  const giveback = avgMfeR !== null && avgRealizedOfMfe !== null
    ? (avgMfeR - avgRealizedOfMfe).toFixed(2) : "—";

  const winsWithMae = mfeTrades.filter((t) => t.outcome === "W" && t.maeR != null);
  const winsDippedToAvgMae = winsWithMae.filter((t) => avgMaeR !== null && t.maeR >= avgMaeR);
  const winsRetrace = winsWithMae.length ? `${Math.round((winsDippedToAvgMae.length / winsWithMae.length) * 100)}%` : "—";

  const mfeDecisions = mfeTrades.filter((t) => t.risk > 0 && t.outcome !== "BE");
  const currentWrPool = mfeDecisions.length
    ? mfeDecisions.filter((t) => t.outcome === "W").length / mfeDecisions.length : null;
  const mfeWinners = mfeDecisions.filter((t) => avgMfeR !== null && t.mfeR >= avgMfeR);
  const wrAtAvgMfe = mfeDecisions.length
    ? `${Math.round((mfeWinners.length / mfeDecisions.length) * 100)}%` : "—";
  const wrDelta = currentWrPool !== null && mfeDecisions.length
    ? Math.round((currentWrPool - (mfeWinners.length / mfeDecisions.length)) * 100) : null;
  const rrGained = mfeWinners.length && avgMfeR !== null
    ? (avgMfeR - mfeWinners.reduce((s, t) => s + (t.pnl / t.risk), 0) / mfeWinners.length).toFixed(2)
    : null;
  const wrSub = currentWrPool !== null && wrDelta !== null && rrGained !== null
    ? `${wrDelta > 0 ? `-${wrDelta}` : wrDelta}pp vs now · +${rrGained}R/win` : "TP at avg MFE";

  return { avgMfe, avgMae, capture, giveback, winsRetrace, wrAtAvgMfe, wrSub };
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
  return `${account.firm} $${(account.size / 1000).toFixed(0)}K · ${login}`;
}

export const RATING_META = {
  green: { color: "var(--sage)", label: "Good" },
  amber: { color: "var(--brass)", label: "Off" },
  red: { color: "var(--brick)", label: "Bad" },
};

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
  "InvalidAccountId": "No account is linked to that email. Check the address and try again.",
  "InvalidSecret": "Incorrect email or password. Check your details and try again.",
  "Invalid credentials": "Incorrect email or password. Check your details and try again.",
  "Invalid password": "Password must be at least 8 characters.",
  "TooManyFailedAttempts": "Too many failed attempts. Wait a few minutes and try again.",
  "Not signed in.": "Your session has expired. Please sign in again.",
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
