// MOCK DATA — replace with real account data before production use
import { Clock3, CheckCircle2, AlertTriangle } from "lucide-react";

export const FIRMS = ["FundingPips", "FTMO", "FundedNext"];

export const TEMPLATES = [
  { id: "t1", firm: "FundingPips", name: "2-Step Pro", phases: 2, target: "6% / 6%", dailyLoss: "3%", maxLoss: "6%", drawdown: "Static", consistency: "45%", feeRefund: false, platforms: "MatchTrader, MT5, cTrader" },
  { id: "t2", firm: "FundingPips", name: "2-Step Standard", phases: 2, target: "8% / 5%", dailyLoss: "5%", maxLoss: "10%", drawdown: "Static", consistency: "40%", feeRefund: false, platforms: "MatchTrader, MT5, cTrader" },
  { id: "t3", firm: "FundingPips", name: "1-Step", phases: 1, target: "10%", dailyLoss: "3%", maxLoss: "6%", drawdown: "Static", consistency: "35%", feeRefund: false, platforms: "MatchTrader, MT5, cTrader" },
  { id: "t4", firm: "FundingPips", name: "Zero (Instant)", phases: 0, target: "—", dailyLoss: "—", maxLoss: "5%", drawdown: "Trailing", consistency: "35%", feeRefund: false, platforms: "MatchTrader, MT5, cTrader" },
  { id: "t5", firm: "FTMO", name: "Challenge — Normal", phases: 2, target: "10% / 5%", dailyLoss: "5%", maxLoss: "10%", drawdown: "Static", consistency: "—", feeRefund: true, platforms: "MT4, MT5, cTrader, DXtrade" },
  { id: "t6", firm: "FTMO", name: "Swing Account", phases: 2, target: "10% / 5%", dailyLoss: "5%", maxLoss: "10%", drawdown: "Static", consistency: "—", feeRefund: true, platforms: "MT4, MT5" },
  { id: "t7", firm: "FundedNext", name: "Stellar 2-Step", phases: 2, target: "8% / 5%", dailyLoss: "5%", maxLoss: "10%", drawdown: "Static", consistency: "—", feeRefund: true, platforms: "MT4, MT5" },
  { id: "t8", firm: "FundedNext", name: "Stellar 1-Step", phases: 1, target: "10%", dailyLoss: "3%", maxLoss: "6%", drawdown: "Static", consistency: "—", feeRefund: true, platforms: "MT4, MT5" },
  { id: "t9", firm: "FundedNext", name: "Express (Instant)", phases: 0, target: "—", dailyLoss: "3%", maxLoss: "6%", drawdown: "Trailing", consistency: "—", feeRefund: false, platforms: "MT4, MT5" },
];

export const STATUS_META = {
  phase_1: { label: "Phase 1", color: "var(--slate)", bg: "rgba(137,146,163,0.12)", icon: Clock3, pulse: true },
  phase_2: { label: "Phase 2", color: "var(--brass)", bg: "rgba(206,159,82,0.12)", icon: Clock3, pulse: true },
  funded: { label: "Funded", color: "var(--sage)", bg: "rgba(111,176,139,0.12)", icon: CheckCircle2, pulse: false },
  passed: { label: "Passed", color: "var(--sage)", bg: "rgba(111,176,139,0.12)", icon: CheckCircle2, pulse: true },
  breached: { label: "Breached", color: "var(--brick)", bg: "rgba(193,89,75,0.14)", icon: AlertTriangle, pulse: false },
};

export const initialAccounts = [];

export const initialTrades = [];

export const initialPayouts = [];

export const initialCertificates = [];

export const initialClusters = [];
