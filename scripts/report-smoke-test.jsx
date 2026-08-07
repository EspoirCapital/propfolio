import { renderToStaticMarkup } from "react-dom/server";
import { DistributionReport, applyDistributionFilters } from "/home/blackbox/propfolio/src/components/DistributionReport.jsx";

const accounts = [{ id: "a1", platformLogin: "12345", firmName: "FTMO", size: 50000 }];
const settings = { beThreshold: 10 };

const trades = [
  { id: "t1", accountId: "a1", date: "2026-07-06", openDate: "2026-07-06T07:30", risk: 100, pnl: 250, archived: false },   // Mon 07:30 W 2.5R
  { id: "t2", accountId: "a1", date: "2026-07-06", openDate: "2026-07-06T09:15", risk: 100, pnl: 80, archived: false },    // Mon 09:15 W 0.8R
  { id: "t3", accountId: "a1", date: "2026-07-07", openDate: "2026-07-07T07:45", risk: 100, pnl: -100, archived: false },  // Tue 07:45 L -1R
  { id: "t4", accountId: "a1", date: "2026-07-07", openDate: "2026-07-07T10:00", risk: 100, pnl: 50, archived: false },    // Tue 10:00 W 0.5R
  { id: "t5", accountId: "a1", date: "2026-07-08", openDate: "2026-07-08T12:00", risk: 100, pnl: -50, archived: false },   // Wed 12:00 L -0.5R
  { id: "t6", accountId: "a1", date: "2026-07-08", openDate: "2026-07-08T12:30", risk: 100, pnl: 0, archived: false },     // Wed 12:30 BE
  { id: "t7", accountId: "a1", date: "2026-07-09", openDate: null, risk: 100, pnl: 20, archived: false },                  // Thu no time W 0.2R
  { id: "t8", accountId: "a1", date: "2026-07-09", openDate: "2026-07-09T09:00", risk: 100, pnl: 999, archived: true },    // archived, must be excluded
];

const html = renderToStaticMarkup(
  <DistributionReport accounts={accounts} trades={trades} settings={settings} />
);

const checks = [
  ["7 trades stat", /7 closed trade/, "expected 7 non-archived trades"],
  ["win rate 67%", /67%/, "expected 4W/6L-decisions = 67%"],
  ["avg R +0.42R", /\+\s*0\.42R/, "expected (2.5+0.8-1+0.5-0.5+0.2)/6 = +0.42R"],
  ["total P&L +$250", /250/, "expected 250+80-100+50-50+0+20 = 250"],
  ["best window Mon 07:00", /Mon 07:00/, "expected Mon 07:00 cell"],
  ["best day Mon", /Best day:.*?Monday/, "expected Monday best day"],
  ["worst day Wed", /Worst day:.*?Wednesday/, "expected Wednesday worst day"],
  ["best hour 09:00", /Best hour:.*?09:00/, "09:00 avg +0.80 with 1 trade - fallback below 3 trades"],
  ["worst hour 12:00", /Worst hour:.*?12:00/, "12:00 avg -0.50"],
  ["busiest hour 07:00", /Busiest hour:.*?07:00 with 2 trade/, "07:00 has 2 trades"],
  ["heatmap cell 2.5", /2\.5/, "Mon 07 cell shows +2.5"],
  ["heatmap note", /5 day\/hour cells have fewer than 3 trade/, "5 cells under 3 trades"],
  ["entry time footer", /6 of 7 trades have entry times/, "6 with time of 7"],
  ["by account row", /FTMO \$50K/, "account label in By Account table"],
];

let pass = 0;
for (const [name, re, why] of checks) {
  const ok = re.test(html);
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` (${why})`}`);
}
const archivedOk = !/999/.test(html);
console.log(`${archivedOk ? "PASS" : "FAIL"} archived excluded from count`);
pass += archivedOk;
const beOk = /Wednesday.*?-0\.50R/.test(html);
console.log(`${beOk ? "PASS" : "FAIL"} BE excluded from avg (Wed row must be -0.50R, not -0.25R)`);
pass += beOk;

const empty = renderToStaticMarkup(
  <DistributionReport accounts={accounts} trades={[]} settings={settings} />
);
const emptyOk = /No trades match the current filters/.test(empty);
console.log(`${emptyOk ? "PASS" : "FAIL"} empty state`);
pass += emptyOk;

const filterChecks = [
  ["account filter", applyDistributionFilters(trades, { accountId: "a1" }).length === 7, "7 trades on a1"],
  ["day filter excludes Friday", applyDistributionFilters(trades, { days: [1] }).map((t) => t.id).join() === "t1,t2", "only Mon trades"],
  ["time filter excludes no-time", applyDistributionFilters(trades, { fromHour: 7, toHour: 9 }).every((t) => t.openDate && !t.openDate.endsWith("T00:00")), "t7 has no time"],
  ["inclusive bounds", applyDistributionFilters(trades, { fromHour: 7, toHour: 9 }).map((t) => t.id).join() === "t1,t2,t3", "07:30, 09:15, 07:45 inside 07-09"],
  ["range 10-12", applyDistributionFilters(trades, { fromHour: 10, toHour: 12 }).map((t) => t.id).join() === "t4,t5,t6", "10:00 and 12:00 inside 10-12"],
  ["wrap-around overnight", applyDistributionFilters(trades, { fromHour: 20, toHour: 8 }).map((t) => t.id).join() === "t1,t3", "07:30 and 07:45 inside 20-08 wrap"],
  ["archived never included", applyDistributionFilters(trades).every((t) => t.id !== "t8"), "t8 archived"],
];
for (const [name, ok, why] of filterChecks) {
  if (ok) pass++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` (${why})`}`);
}

console.log(`\n${pass}/${checks.length + 3 + filterChecks.length} checks passed`);
process.exit(pass === checks.length + 3 + filterChecks.length ? 0 : 1);
