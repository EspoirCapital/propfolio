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
