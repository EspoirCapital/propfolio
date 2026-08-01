export const DEFAULT_SETTINGS = { displayFormat: "dollar", beThreshold: 10 };

export const DEFAULT_TEMPLATES = [
  { firm: "FundingPips", name: "2-Step Pro", phases: 2, target: "6% / 6%", dailyLoss: "3%", maxLoss: "6%", drawdown: "Static", consistency: "45%", feeRefund: false, platforms: "MatchTrader, MT5, cTrader" },
  { firm: "FundingPips", name: "2-Step Standard", phases: 2, target: "8% / 5%", dailyLoss: "5%", maxLoss: "10%", drawdown: "Static", consistency: "40%", feeRefund: false, platforms: "MatchTrader, MT5, cTrader" },
  { firm: "FundingPips", name: "1-Step", phases: 1, target: "10%", dailyLoss: "3%", maxLoss: "6%", drawdown: "Static", consistency: "35%", feeRefund: false, platforms: "MatchTrader, MT5, cTrader" },
  { firm: "FundingPips", name: "Zero (Instant)", phases: 0, target: "—", dailyLoss: "—", maxLoss: "5%", drawdown: "Trailing", consistency: "35%", feeRefund: false, platforms: "MatchTrader, MT5, cTrader" },
  { firm: "FTMO", name: "Challenge — Normal", phases: 2, target: "10% / 5%", dailyLoss: "5%", maxLoss: "10%", drawdown: "Static", consistency: "—", feeRefund: true, platforms: "MT4, MT5, cTrader, DXtrade" },
  { firm: "FTMO", name: "Swing Account", phases: 2, target: "10% / 5%", dailyLoss: "5%", maxLoss: "10%", drawdown: "Static", consistency: "—", feeRefund: true, platforms: "MT4, MT5" },
  { firm: "FundedNext", name: "Stellar 2-Step", phases: 2, target: "8% / 5%", dailyLoss: "5%", maxLoss: "10%", drawdown: "Static", consistency: "—", feeRefund: true, platforms: "MT4, MT5" },
  { firm: "FundedNext", name: "Stellar 1-Step", phases: 1, target: "10%", dailyLoss: "3%", maxLoss: "6%", drawdown: "Static", consistency: "—", feeRefund: true, platforms: "MT4, MT5" },
  { firm: "FundedNext", name: "Express (Instant)", phases: 0, target: "—", dailyLoss: "3%", maxLoss: "6%", drawdown: "Trailing", consistency: "—", feeRefund: false, platforms: "MT4, MT5" },
];
